import { describe, expect, it } from 'vitest'

import { calculateTokenMetrics, DEFAULT_ADJUSTMENT_FACTORS } from './calculations'
import type { TokenValueCaptureInput } from './types'

const base: TokenValueCaptureInput = {
  id: 'alpha',
  name: 'Alpha Protocol',
  symbol: 'ALPHA',
  circulatingMarketCapUsd: 1_000_000_000,
  fdvUsd: 1_600_000_000,
  capturePeriodDays: 365,
  executedBuybacksUsdInPeriod: 80_000_000,
  recurringDirectBurnsUsdInPeriod: 5_000_000,
  holderDistributionsUsdInPeriod: 10_000_000,
  boughtAndBurnedUsdInPeriod: 80_000_000,
  announcedBuybacksUsd: 25_000_000,
  oneOffBurnsUsd: 100_000_000,
  unlockUsd365d: 45_000_000,
  inflationaryEmissionsUsd365d: 5_000_000,
  buybackDestination: 'burn',
  evidenceLevel: 'onchain',
  programStatus: 'active',
  dataDate: '2026-09-30',
  sourceUrls: ['https://example.com/alpha'],
}

describe('calculateTokenMetrics', () => {
  it('calculates transparent capture and release metrics', () => {
    const metrics = calculateTokenMetrics(base)

    expect(metrics.annualizedGrossCaptureUsd).toBe(95_000_000)
    expect(metrics.annualizedEffectiveCaptureUsd).toBe(95_000_000)
    expect(metrics.totalReleasePressureUsd).toBe(50_000_000)
    expect(metrics.grossCaptureYieldPct).toBe(9.5)
    expect(metrics.releasePressureYieldPct).toBe(5)
    expect(metrics.netCaptureUsd).toBe(45_000_000)
    expect(metrics.netCaptureYieldPct).toBe(4.5)
    expect(metrics.coverageRatio).toBe(1.9)
    expect(metrics.fdvPremiumPct).toBe(60)
    expect(metrics.rankable).toBe(true)
  })

  it('does not double count bought-and-burned value or contextual amounts', () => {
    const metrics = calculateTokenMetrics(base)

    expect(metrics.annualizedGrossCaptureUsd).toBe(95_000_000)
    expect(metrics.formulas.annualizedGrossCaptureUsd.substituted).toContain(
      'one-off burns 100000000 are excluded',
    )
  })

  it('uses strict defaults for treasury and recycled buybacks', () => {
    expect(DEFAULT_ADJUSTMENT_FACTORS.destination.treasury).toBe(0)
    expect(DEFAULT_ADJUSTMENT_FACTORS.destination.recycled).toBe(0)

    const treasury = calculateTokenMetrics({
      ...base,
      buybackDestination: 'treasury',
    })
    expect(treasury.annualizedEffectiveCaptureUsd).toBe(15_000_000)
    expect(treasury.netCaptureYieldPct).toBe(-3.5)
  })

  it('annualizes a 90-day recurring window and labels it provisional', () => {
    const metrics = calculateTokenMetrics({
      ...base,
      capturePeriodDays: 90,
      executedBuybacksUsdInPeriod: 9_000_000,
      recurringDirectBurnsUsdInPeriod: 0,
      holderDistributionsUsdInPeriod: 0,
      boughtAndBurnedUsdInPeriod: 9_000_000,
    })

    expect(metrics.annualizedExecutedBuybacksUsd).toBe(36_500_000)
    expect(metrics.annualizationStatus).toBe('provisional_annualized')
  })

  it('marks missing release data unranked instead of zero', () => {
    const metrics = calculateTokenMetrics({ ...base, unlockUsd365d: null })

    expect(metrics.rankable).toBe(false)
    expect(metrics.netCaptureYieldPct).toBeNull()
    expect(metrics.unrankedReason).toContain('forward unlock value')
  })

  it('accepts verified zero release pressure as rankable', () => {
    const metrics = calculateTokenMetrics({
      ...base,
      unlockUsd365d: 0,
      inflationaryEmissionsUsd365d: 0,
    })

    expect(metrics.rankable).toBe(true)
    expect(metrics.releasePressureYieldPct).toBe(0)
    expect(metrics.coverageRatio).toBeNull()
  })
})
