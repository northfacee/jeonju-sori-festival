import { STOP_POOL, DATE_LABELS } from '../../src/data/stopPool.js'
import { SURVEY_STEPS } from '../../src/data/survey.js'
import { haversineKm } from '../../src/data/festival.js'
import { getRestaurants } from './restaurants.js'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const MAX_WALK_KM = 1.8
const DATE_ORDER = Object.keys(DATE_LABELS) // ['08-12'..'08-16']
const DURATION_DAY_COUNT = { day: 1, night1: 2, night2: 3 }

// ── 시간 유틸 ──────────────────────────────────────────
function toMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(m) {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
function overlaps(a, b) {
  return toMinutes(a.time) < toMinutes(b.timeEnd) && toMinutes(b.time) < toMinutes(a.timeEnd)
}
function sortKey(s) {
  return toMinutes(s.time)
}
function dedupeOverlaps(list) {
  const sorted = [...list].sort((a, b) => sortKey(a) - sortKey(b))
  const kept = []
  for (const s of sorted) {
    if (kept.some((k) => overlaps(k, s))) continue
    kept.push(s)
  }
  return kept
}
function findFreeSlot(existingStops, windowStartMin, windowEndMin, durationMin) {
  for (let t = windowStartMin; t + durationMin <= windowEndMin; t += 15) {
    const candidate = { time: minutesToTime(t), timeEnd: minutesToTime(t + durationMin) }
    if (!existingStops.some((s) => overlaps(s, candidate))) return candidate
  }
  return null
}
function closestStop(stops, targetMin) {
  if (!stops.length) return null
  return stops.reduce((best, s) => {
    const d = Math.abs(toMinutes(s.time) - targetMin)
    const bd = Math.abs(toMinutes(best.time) - targetMin)
    return d < bd ? s : best
  })
}
function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/(^-|-$)/g, '') || 'place'
  )
}

// ── Gemini 호출 ───────────────────────────────────────
async function geminiGenerate(apiKey, body, retried = false) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: { maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
        ...body,
      }),
    },
  )
  const data = await res.json()
  if (data.error) {
    // 무료 티어 레이트리밋(429)은 잠깐 쉬었다가 한 번만 재시도.
    if (data.error.code === 429 && !retried) {
      await new Promise((r) => setTimeout(r, 1500))
      return geminiGenerate(apiKey, body, true)
    }
    throw new Error(data.error.message || 'Gemini API 오류')
  }
  return data
}

// 특정 함수를 강제로 호출시켜서 구조화된 JSON을 받는다 (검색 없음).
async function callGeminiTool(apiKey, prompt, functionDeclaration) {
  const data = await geminiGenerate(apiKey, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools: [{ functionDeclarations: [functionDeclaration] }],
    toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [functionDeclaration.name] } },
  })
  const parts = data.candidates?.[0]?.content?.parts || []
  const fc = parts.find((p) => p.functionCall)?.functionCall
  if (!fc) throw new Error(`모델이 ${functionDeclaration.name} 결과를 반환하지 않았습니다.`)
  return fc.args
}

// 구글 검색 그라운딩으로 실시간 검색 결과 텍스트를 받는다 (숙소 검색에만 사용).
// (Gemini는 googleSearch 도구와 함수 호출을 한 요청에 같이 못 써서, 검색 → 구조화 2단계로 나눔)
async function searchWithGoogle(apiKey, prompt) {
  const data = await geminiGenerate(apiKey, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools: [{ googleSearch: {} }],
  })
  const parts = data.candidates?.[0]?.content?.parts || []
  const text = parts
    .map((p) => p.text || '')
    .join('\n')
    .trim()
  if (!text) throw new Error('구글 검색 결과가 비어있습니다.')
  return text
}

// ── 실시간 지오코딩 (Nominatim/OpenStreetMap, 숙소 주소 보완용) ──
async function geocode(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=kr`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'jeonju-sorifestival-app/1.0 (course planner demo)' },
    })
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch (err) {
    console.error('[geocode] failed for', query, err.message)
  }
  return null
}

async function geocodePlace(name, address) {
  return (await geocode(`전주 ${name}`)) || (await geocode(address)) || null
}

function summarizeStop(s) {
  return {
    id: s.id,
    time: `${s.time}-${s.timeEnd}`,
    venue: s.venue.name,
    hall: s.hall,
    name: s.name,
    type: s.free ? '무료 공연' : '유료 공연',
    desc: s.desc,
  }
}

// ── Phase 1: 그날의 실제 축제 프로그램 고르기 (사전 정리된 일정 데이터 사용) ──
async function pickDayStops({ apiKey, date, pool, answers, anchorVenue }) {
  const dayPool = pool.filter((s) => s.date === date)
  if (dayPool.length === 0) return []

  const declaration = {
    name: 'pick_day_stops',
    description: '그날 실제로 열리는 프로그램 중, 사용자 답변에 맞는 것들을 골라 하루 동선을 짠다.',
    parameters: {
      type: 'OBJECT',
      properties: {
        stopIds: {
          type: 'ARRAY',
          items: { type: 'STRING', enum: dayPool.map((s) => s.id) },
          description: '방문 순서대로 나열한 정류지 id 목록 (2~5개).',
        },
      },
      required: ['stopIds'],
    },
  }

  const answerLines = SURVEY_STEPS.map((step) => {
    const opt = step.options.find((o) => o.id === answers[step.key])
    return `- ${step.question} → ${opt ? `${opt.label} (${opt.desc})` : '(답변 없음)'}`
  }).join('\n')

  const walkNote =
    answers.transport === 'walk'
      ? `\n- 이동수단이 도보이므로, 서로 가까운(같은 공연장·건물 위주) 정류지를 고르세요.${
          anchorVenue ? ` 특히 "${anchorVenue.name}"(${anchorVenue.address}) 근처를 우선하세요.` : ''
        }`
      : ''
  const stayNote =
    anchorVenue && answers.transport !== 'walk'
      ? `\n- 전날 밤 숙소가 "${anchorVenue.name}"(${anchorVenue.address})였으니, 그 근처에서 시작하는 동선을 우선 고려하세요.`
      : ''

  const prompt = `2026 전주세계소리축제 ${DATE_LABELS[date]}에 실제로 열리는 프로그램 목록입니다. 아래 목록에만 있는 것을 골라 그날의 동선을 짜주세요.

[사용자 답변]
${answerLines}

[${DATE_LABELS[date]} 실제 프로그램 목록]
${JSON.stringify(dayPool.map(summarizeStop))}

규칙:
- 시간이 겹치는 두 정류지를 동시에 고르면 안 됩니다.${walkNote}${stayNote}
- pick_day_stops 도구로만 답하세요.`

  let picks
  try {
    const args = await callGeminiTool(apiKey, prompt, declaration)
    picks = (args.stopIds || []).map((id) => dayPool.find((s) => s.id === id)).filter(Boolean)
  } catch (err) {
    console.error('[pickDayStops] failed:', err.message)
    picks = []
  }

  picks = dedupeOverlaps(picks)

  let anchor = anchorVenue
  if (answers.transport === 'walk') {
    if (!anchor && picks[0]) anchor = picks[0].venue
    if (anchor) picks = picks.filter((s) => haversineKm(anchor, s.venue) <= MAX_WALK_KM)
  }

  if (picks.length < 3) {
    let candidates = dayPool.filter((s) => !picks.some((p) => p.id === s.id))
    if (answers.transport === 'walk' && anchor) {
      candidates = candidates.filter((s) => haversineKm(anchor, s.venue) <= MAX_WALK_KM)
    }
    candidates.sort((a, b) => sortKey(a) - sortKey(b))
    for (const cand of candidates) {
      if (picks.length >= 4) break
      if (picks.some((s) => overlaps(s, cand))) continue
      picks.push(cand)
    }
  }

  return picks.sort((a, b) => sortKey(a) - sortKey(b))
}

// ── Phase 2: 전주시 공공데이터 "음식점기본정보"에서 근처 실제 음식점/카페 찾기 ──
// (실시간 검색이 아니라, 위경도가 있는 실제 등록 업체 데이터에서 거리 기준으로 고른다)
function findNearbyRestaurants({ anchorVenue, radiusKm, excludeNames, count }) {
  const excluded = new Set(excludeNames.map((n) => n.trim().toLowerCase()))
  const candidates = getRestaurants()
    .filter((r) => !excluded.has(r.name.trim().toLowerCase()))
    .map((r) => ({ ...r, distanceKm: haversineKm(anchorVenue, r) }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)

  if (candidates.length === 0) return []

  // 매번 똑같은 1등만 나오지 않도록, 가까운 후보들 중에서 무작위로 고른다.
  const nearPool = candidates.slice(0, Math.max(count * 4, 8))
  const foodPool = nearPool.filter((r) => r.kind === 'food')
  const cafePool = nearPool.filter((r) => r.kind === 'cafe')

  const picked = []
  if (count >= 2 && foodPool.length && cafePool.length) {
    picked.push(foodPool[Math.floor(Math.random() * foodPool.length)])
    picked.push(cafePool[Math.floor(Math.random() * cafePool.length)])
  } else {
    const shuffled = [...nearPool].sort(() => Math.random() - 0.5)
    picked.push(...shuffled.slice(0, count))
  }
  return picked.slice(0, count)
}

function searchPlaces({ anchorVenue, excludeNames, walk }) {
  const radiusKm = walk ? MAX_WALK_KM : 5
  const picks = findNearbyRestaurants({ anchorVenue, radiusKm, excludeNames, count: 2 })
  return picks.map((r) => ({
    name: r.name,
    address: r.address,
    lat: r.lat,
    lon: r.lon,
    type: r.kind === 'cafe' ? '카페' : '식당',
    desc: `${r.type} · 전주시 등록 음식점(공공데이터) · 약 ${r.distanceKm.toFixed(1)}km`,
  }))
}

const STAY_DECL = {
  name: 'report_stay',
  description: '검색 결과 텍스트에서 실제 숙소 정보 1곳을 추출해 구조화한다.',
  parameters: {
    type: 'OBJECT',
    properties: {
      name: { type: 'STRING', description: '실제 숙소 이름 (호텔/게스트하우스 등)' },
      address: { type: 'STRING', description: '정확한 도로명 주소' },
      desc: { type: 'STRING', description: '한국어 1문장. 왜 추천하는지.' },
    },
    required: ['name', 'address', 'desc'],
  },
}

async function searchAccommodation({ apiKey, anchorVenue, excludeNames, walk }) {
  const walkNote = walk ? ' 다음날 도보로 이동할 수 있도록, 도보 20~30분 이내에 시내 명소가 있는 곳이면 좋아.' : ''
  const excludeNote = excludeNames.length ? ` 다음 곳은 이미 추천했으니 제외해: ${excludeNames.join(', ')}.` : ''
  const searchPrompt = `지금 구글 검색으로, "${anchorVenue.name}"(${anchorVenue.address}) 근처에 실제로 존재하고 영업 중인 숙소(호텔, 게스트하우스 등) 1곳을 찾아줘.${walkNote}${excludeNote} 실제 상호명과 정확한 도로명 주소, 추천 이유를 한국어로 정리해줘.`

  try {
    const searchText = await searchWithGoogle(apiKey, searchPrompt)
    const extractPrompt = `다음은 방금 검색한 결과입니다:\n\n${searchText}\n\n여기서 실제로 존재하는 숙소 1곳의 정보를 report_stay 도구로 추출해줘. 검색 결과에 없는 곳을 지어내면 안 돼.`
    return await callGeminiTool(apiKey, extractPrompt, STAY_DECL)
  } catch (err) {
    console.error('[searchAccommodation] failed:', err.message)
    return null
  }
}

async function toStopFromPlace(place, date, anchorVenue, walk, kindOverride) {
  // CSV 데이터는 이미 실제 위경도를 갖고 있어서 지오코딩이 필요 없다.
  // (숙소처럼 좌표 없이 이름/주소만 있는 경우에만 지오코딩으로 보완)
  let geo =
    place.lat !== undefined && place.lon !== undefined ? { lat: place.lat, lon: place.lon } : await geocodePlace(place.name, place.address)
  // 도보 조건일 때 좌표가 완전히 다른 동네로 잡히면(예: 4~5km 밖) 신뢰하지 않고
  // 앵커 위치로 대체한다 — 도보 거리 조건이 지도 위에서도 깨지지 않도록.
  if (walk && geo && haversineKm(anchorVenue, geo) > MAX_WALK_KM * 2.5) {
    geo = null
  }
  return {
    id: `place-${slugify(place.name)}-${date}`,
    date,
    dateLabel: DATE_LABELS[date],
    venue: {
      key: slugify(place.name),
      name: place.name,
      address: place.address,
      lat: geo?.lat,
      lon: geo?.lon,
    },
    name: place.name,
    time: null,
    timeEnd: null,
    kind: kindOverride || (place.type === '카페' ? 'cafe' : 'food'),
    desc: place.desc,
  }
}

function placeItemsIntoSlots(existingStops, items, windowStartMin, windowEndMin, anchorVenue) {
  const placed = []
  const working = [...existingStops]
  for (const item of items) {
    const slot = findFreeSlot(working, windowStartMin, windowEndMin, 45)
    if (!slot) continue
    if (item.venue.lat === undefined) {
      item.venue.lat = anchorVenue.lat
      item.venue.lon = anchorVenue.lon
    }
    const stop = { ...item, time: slot.time, timeEnd: slot.timeEnd }
    working.push(stop)
    placed.push(stop)
  }
  return placed
}

// ── 요일 창(연속 날짜) 고르기 ───────────────────────────
function pickDateWindow(dayCount) {
  const maxStart = DATE_ORDER.length - dayCount
  const startIdx = Math.min(3, Math.max(0, maxStart))
  return DATE_ORDER.slice(startIdx, startIdx + dayCount)
}

const SUMMARY_DECL = {
  name: 'summarize_trip',
  description: '완성된 여행 일정을 보고 전체 코스 이름과 추천 이유를 짧게 요약한다.',
  parameters: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING', description: '이 여행 전체의 이름. 한국어, 14자 내외.' },
      reason: { type: 'STRING', description: '한국어 2~4문장. 답변 내용을 근거로 전체 일정을 왜 이렇게 짰는지 설명.' },
    },
    required: ['title', 'reason'],
  },
}

export async function buildCourse(answers) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
    err.status = 503
    throw err
  }
  if (!answers || typeof answers !== 'object') {
    const err = new Error('answers가 필요합니다.')
    err.status = 400
    throw err
  }

  const dayCount = DURATION_DAY_COUNT[answers.duration] || 1
  const familyPool = STOP_POOL.filter((s) => answers.companion === 'family' || !s.kidsOnly)
  const window = pickDateWindow(dayCount)
  const walk = answers.transport === 'walk'

  const usedFoodNames = []
  const usedStayNames = []
  let previousStay = null
  const days = []

  for (let i = 0; i < window.length; i++) {
    const date = window[i]
    let stops = await pickDayStops({
      apiKey,
      date,
      pool: familyPool,
      answers,
      anchorVenue: previousStay?.venue || null,
    })

    if (stops.length === 0) {
      days.push({ dayNumber: i + 1, date, dateLabel: DATE_LABELS[date], stops: [] })
      continue
    }

    const lunchAnchor = closestStop(stops, 12 * 60 + 30) || stops[0]
    const dinnerAnchor = closestStop(stops, 18 * 60 + 30) || stops[stops.length - 1]

    // 점심에서 고른 곳을 저녁 후보에서 바로 빼기 위해 순서대로 처리한다.
    const lunchPlaces = searchPlaces({ anchorVenue: lunchAnchor.venue, excludeNames: usedFoodNames, walk })
    const dinnerPlaces = searchPlaces({
      anchorVenue: dinnerAnchor.venue,
      excludeNames: [...usedFoodNames, ...lunchPlaces.map((p) => p.name)],
      walk,
    })

    const lunchItems = await Promise.all(lunchPlaces.map((p) => toStopFromPlace(p, date, lunchAnchor.venue, walk)))
    const dinnerItems = await Promise.all(dinnerPlaces.map((p) => toStopFromPlace(p, date, dinnerAnchor.venue, walk)))

    const placedLunch = placeItemsIntoSlots(stops, lunchItems, 11 * 60, 15 * 60, lunchAnchor.venue)
    stops = dedupeOverlaps([...stops, ...placedLunch])
    const placedDinner = placeItemsIntoSlots(stops, dinnerItems, 17 * 60, 21 * 60, dinnerAnchor.venue)
    stops = dedupeOverlaps([...stops, ...placedDinner])

    usedFoodNames.push(...lunchPlaces.map((p) => p.name), ...dinnerPlaces.map((p) => p.name))

    let stayStop = null
    if (i < window.length - 1) {
      const lastStop = stops[stops.length - 1]
      const stay = await searchAccommodation({ apiKey, anchorVenue: lastStop.venue, excludeNames: usedStayNames, walk })
      if (stay) {
        const geo = await geocodePlace(stay.name, stay.address)
        stayStop = {
          id: `stay-${slugify(stay.name)}-${date}`,
          date,
          dateLabel: DATE_LABELS[date],
          venue: {
            key: slugify(stay.name),
            name: stay.name,
            address: stay.address,
            lat: geo?.lat ?? lastStop.venue.lat,
            lon: geo?.lon ?? lastStop.venue.lon,
          },
          name: stay.name,
          time: minutesToTime(toMinutes(lastStop.timeEnd) + 30 > 23 * 60 ? 23 * 60 : toMinutes(lastStop.timeEnd) + 30),
          timeEnd: '익일 체크아웃',
          kind: 'stay',
          desc: stay.desc,
        }
        usedStayNames.push(stay.name)
        previousStay = stayStop
      }
    }

    const finalStops = stayStop ? [...stops, stayStop] : stops
    days.push({ dayNumber: i + 1, date, dateLabel: DATE_LABELS[date], stops: finalStops })
  }

  let title = `${dayCount}일 전주소리축제 여행`
  let reason = '설문 답변을 바탕으로 실제 프로그램과 전주시 등록 음식점 데이터를 조합해 일정을 구성했어요.'
  try {
    const summary = await callGeminiTool(
      apiKey,
      `아래는 방금 완성된 2026 전주세계소리축제 맞춤 여행 일정입니다. 전체 이름과, 사용자 답변에 맞춰 왜 이렇게 짰는지 요약해줘.\n\n[일정]\n${JSON.stringify(
        days.map((d) => ({
          day: d.dayNumber,
          date: d.dateLabel,
          stops: d.stops.map((s) => ({ name: s.name, time: s.time, kind: s.kind })),
        })),
      )}\n\nsummarize_trip 도구로만 답하세요.`,
      SUMMARY_DECL,
    )
    title = summary.title || title
    reason = summary.reason || reason
  } catch (err) {
    console.error('[summarize_trip] failed:', err.message)
  }

  return { title, reason, days }
}
