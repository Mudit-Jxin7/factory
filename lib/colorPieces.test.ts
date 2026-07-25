import { aggregatePiecesByColor } from './colorPieces'

describe('aggregatePiecesByColor', () => {
  it('returns empty array for empty input', () => {
    expect(aggregatePiecesByColor([])).toEqual([])
    expect(aggregatePiecesByColor()).toEqual([])
  })

  it('sums pieces + tukda per color', () => {
    expect(aggregatePiecesByColor([
      { color: 'Black', pieces: 10, tukda: 2 },
      { color: 'Black', pieces: 5, tukda: 0 },
      { color: 'White', pieces: 3, tukda: 1 },
    ])).toEqual([
      { color: 'Black', totalPieces: 17 },
      { color: 'White', totalPieces: 4 },
    ])
  })

  it('uses — for blank color', () => {
    expect(aggregatePiecesByColor([{ color: '', pieces: 4, tukda: 1 }])).toEqual([
      { color: '—', totalPieces: 5 },
    ])
  })
})
