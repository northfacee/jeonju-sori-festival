// 전북특별자치도 전주시 공공데이터 "음식점기본정보" CSV를 읽어서
// 위경도가 있는 실제 등록 음식점 목록으로 만든다. 실시간 검색이 아니라
// 이 실데이터에서 거리 기준으로 골라 추천한다.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH = path.join(__dirname, '../data/jeonju-restaurants.csv')

// 진짜 식사/카페가 아닌 업종은 후보에서 뺀다.
const EXCLUDE_TYPES = new Set(['편의점', '극장', '유원지', '백화점', '출장조리', '감성주점'])
const CAFE_LICENSES = new Set(['휴게음식점', '제과점영업'])

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  const n = text.length
  while (i < n) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function load() {
  const text = fs.readFileSync(CSV_PATH, 'utf-8').replace(/^﻿/, '')
  const rows = parseCsv(text)
  const records = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (r.length < 10) continue
    const name = r[1]?.trim()
    const roadAddress = r[2]?.trim()
    const lotAddress = r[3]?.trim()
    const lat = parseFloat(r[4])
    const lon = parseFloat(r[5])
    const type = r[7]?.trim()
    const license = r[8]?.trim()
    const status = r[9]?.trim()
    if (!name || status !== '운영중') continue
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 30 || lon < 100) continue
    if (EXCLUDE_TYPES.has(type)) continue
    const address = roadAddress || lotAddress
    if (!address) continue
    records.push({
      name,
      address,
      lat,
      lon,
      type,
      license,
      kind: CAFE_LICENSES.has(license) ? 'cafe' : 'food',
    })
  }
  return records
}

let cache = null
export function getRestaurants() {
  if (!cache) cache = load()
  return cache
}
