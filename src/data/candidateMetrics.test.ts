import { describe, expect, it } from 'vitest'

import { RESEARCH_CANDIDATES } from './researchCandidates'
import {
  CANDIDATE_METRICS,
  calculateCandidateMetrics,
  calculateCandidateMetricsById,
  getCandidateMetricSnapshot,
  rankCandidateMetricRows,
  type CandidateMetricSnapshot,
} from './candidateMetrics'

describe('candidate metrics', () => {
  it('covers every research candidate exactly once', () => {
    const expected = RESEARCH_CANDIDATES.map((candidate) => candidate.id).sort()
    const actual = CANDIDATE_METRICS.map((snapshot) => snapshot.candidateId).sort()

    expect(actual).toEqual(expected)
    expect(new Set(actual).size).toBe(actual.length)
  })

  it('keeps observations, release scenarios, notes, and sources valid', () => {
    for (const snapshot of CANDIDATE_METRICS) {
      expect(snapshot.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(snapshot.notes.length).toBeGreaterThan(0)
      expect(snapshot.sourceUrls.length).toBeGreaterThan(0)
      for (const sourceUrl of snapshot.sourceUrls) {
        expect(new URL(sourceUrl).protocol).toBe('https:')
      }

      expect(snapshot.buyback.usd).toBeGreaterThanOrEqual(0)
      expect(snapshot.buyback.periodDays).toBeGreaterThan(0)
      expect(snapshot.buyback.note.trim()).not.toBe('')
      expect(snapshot.buyback.periodStart).not.toBeNull()
      expect(snapshot.buyback.periodEnd).not.toBeNull()

      const periodStart = Date.parse(snapshot.buyback.periodStart!)
      const periodEnd = Date.parse(snapshot.buyback.periodEnd!)
      const inclusiveDays = Math.round((periodEnd - periodStart) / 86_400_000) + 1
      expect(Number.isFinite(periodStart)).toBe(true)
      expect(Number.isFinite(periodEnd)).toBe(true)
      expect(inclusiveDays).toBe(snapshot.buyback.periodDays)
      expect(periodEnd).toBeLessThanOrEqual(Date.parse(snapshot.asOfDate))

      let previousRelease = -1
      for (const horizon of [7, 30, 90, 180, 365] as const) {
        const release = snapshot.releaseUsd[horizon]
        expect(release.usd).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(release.usd)).toBe(true)
        expect(release.usd!).toBeGreaterThanOrEqual(previousRelease)
        previousRelease = release.usd!
        expect(release.note.trim()).not.toBe('')
      }
    }
  })

  it('scales an executed observation to the selected window', () => {
    const pump = getCandidateMetricSnapshot('pump-fun')!

    expect(calculateCandidateMetrics(pump, 365, 2_715_613_594)).toMatchObject({
      buybackUsd: 347_997_769.2863614,
      buybackQuality: 'verified',
      unlockUsd: 466_785_000,
    })
    expect(calculateCandidateMetrics(pump, 30, 2_715_613_594).buybackUsd)
      .toBeCloseTo(347_997_769.2863614 * 30 / 365, 6)
  })

  it('keeps incomplete forward schedules visibly estimated', () => {
    for (const candidateId of ['hyperliquid', 'pump-fun', 'lighter', 'banana-gun', 'gmx']) {
      const snapshot = getCandidateMetricSnapshot(candidateId)!
      for (const horizon of [7, 30, 90, 180, 365] as const) {
        expect(snapshot.releaseUsd[horizon].quality).toBe('estimate')
      }
    }
  })

  it('treats UNI growth-budget transfers as discrete estimated pressure', () => {
    const uniswap = getCandidateMetricSnapshot('uniswap')!

    expect([7, 30, 90, 180, 365].map((horizon) => (
      uniswap.releaseUsd[horizon as 7 | 30 | 90 | 180 | 365].usd
    ))).toEqual([
      45_350_000,
      45_350_000,
      45_350_000,
      90_700_000,
      181_400_000,
    ])
    for (const horizon of [7, 30, 90, 180, 365] as const) {
      expect(uniswap.releaseUsd[horizon].quality).toBe('estimate')
      expect(uniswap.releaseUsd[horizon].note).toContain('not continuous issuance')
      expect(uniswap.releaseUsd[horizon].note).toContain('does not imply a sale')
    }
  })

  it('uses gross recurring value return without applying a destination discount', () => {
    const cake = calculateCandidateMetricsById('pancakeswap', 30, 864_027_941)!
    const cow = calculateCandidateMetricsById('cow-protocol', 365, 94_518_301)!
    const aster = calculateCandidateMetricsById('aster', 30, 2_032_639_834)!

    expect(cake.buybackUsd).toBeCloseTo(7_175_921.95160294 * 30 / 31, 6)
    expect(cow.buybackUsd).toBeCloseTo(13_217_380.802516 * 365 / 752, 6)
    expect(aster.buybackUsd).toBeCloseTo(3_226_264.03794175 * 2, 6)
  })

  it('calculates net USD and market-cap percentage for the selected window', () => {
    const result = calculateCandidateMetricsById('uniswap', 30, 5_480_112_183)!
    const expectedBuyback = 25_600_000 * 30 / 203
    const expectedNet = expectedBuyback - 45_350_000

    expect(result.buybackUsd).toBeCloseTo(expectedBuyback, 6)
    expect(result.netUsd).toBeCloseTo(expectedNet, 6)
    expect(result.netPct).toBeCloseTo(expectedNet / 5_480_112_183 * 100, 10)
    expect(result.netQuality).toBe('estimate')
  })

  it('returns undefined for an unknown candidate', () => {
    expect(calculateCandidateMetricsById('not-a-token', 90, 1_000_000)).toBeUndefined()
  })

  it('rejects invalid market caps', () => {
    const sky = getCandidateMetricSnapshot('sky')!

    expect(() => calculateCandidateMetrics(sky, 30, 0)).toThrow(RangeError)
    expect(() => calculateCandidateMetrics(sky, 30, Number.NaN)).toThrow(RangeError)
  })

  it('marks a null release and its net result unavailable regardless of source label', () => {
    const sky = getCandidateMetricSnapshot('sky')!
    const incomplete: CandidateMetricSnapshot = {
      ...sky,
      releaseUsd: {
        ...sky.releaseUsd,
        7: { usd: null, quality: 'verified', note: 'Intentionally incomplete test fixture.' },
      },
    }

    expect(calculateCandidateMetrics(incomplete, 7, 1_000_000)).toMatchObject({
      unlockUsd: null,
      unlockQuality: 'unavailable',
      netUsd: null,
      netPct: null,
      netQuality: 'unavailable',
    })
  })

  it('ranks descending net values and leaves missing metrics unranked at the bottom', () => {
    const ranked = rankCandidateMetricRows([
      { candidateId: 'lighter', netPct: -1.5 },
      { candidateId: 'banana-gun', netPct: 2.25 },
      { candidateId: 'missing-market-cap', netPct: null },
      { candidateId: 'invalid-metric', netPct: Number.NaN },
    ])

    expect(ranked.map(({ candidateId, rank }) => [candidateId, rank])).toEqual([
      ['banana-gun', 1],
      ['lighter', 2],
      ['invalid-metric', null],
      ['missing-market-cap', null],
    ])

    expect(rankCandidateMetricRows([
      { candidateId: 'banana-gun', netPct: -3 },
      { candidateId: 'lighter', netPct: 4 },
    ]).map(({ candidateId, rank }) => [candidateId, rank])).toEqual([
      ['lighter', 1],
      ['banana-gun', 2],
    ])
  })
})
