import { describe, it, expect } from 'vitest'
import { unwrapListData } from '../pagination'

describe('pagination utility', () => {
  it('returns data when it is already an array', () => {
    const data = [{ id: 1 }, { id: 2 }]

    expect(unwrapListData(data)).toEqual(data)
  })

  it('returns results array when data is paginated object', () => {
    const data = { count: 2, results: [{ id: 1 }, { id: 2 }] }

    expect(unwrapListData(data)).toEqual(data.results)
  })

  it('returns empty array when results is not an array', () => {
    expect(unwrapListData({ results: null })).toEqual([])
    expect(unwrapListData({ results: 'invalid' })).toEqual([])
  })

  it('returns empty array for nullish or unsupported payload', () => {
    expect(unwrapListData(undefined)).toEqual([])
    expect(unwrapListData(null)).toEqual([])
    expect(unwrapListData({})).toEqual([])
  })
})
