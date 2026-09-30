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
  unlockUsd90d: 8_000_000,
  inflationaryEmissionsUsd90d: 2_000_000,
  unlockUsd180d: 20_000_000,
  inflationaryEmissionsUsd180d: 3_000_000,
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
    expect(metrics.releaseHorizonDays).toBe(365)
  })

  it('uses exact cumulative release inputs for each selected horizon', () => {
    const ninetyDay = calculateTokenMetrics(base, {}, 90)
    const oneEightyDay = calculateTokenMetrics(base, {}, 180)
    const defaultHorizon = calculateTokenMetrics(base)

    expect(ninetyDay.totalReleasePressureUsd).toBe(10_000_000)
    expect(ninetyDay.horizonEffectiveCaptureUsd).toBeCloseTo(23_424_657.53)
    expect(ninetyDay.netCaptureYieldPct).toBeCloseTo(1.34246575)
    expect(oneEightyDay.totalReleasePressureUsd).toBe(23_000_000)
    expect(oneEightyDay.horizonEffectiveCaptureUsd).toBeCloseTo(46_849_315.07)
    expect(oneEightyDay.netCaptureYieldPct).toBeCloseTo(2.38493151)
    expect(defaultHorizon.totalReleasePressureUsd).toBe(50_000_000)
    expect(defaultHorizon.netCaptureYieldPct).toBe(4.5)
    expect(ninetyDay.annualizedEffectiveCaptureUsd).toBe(95_000_000)
    expect(ninetyDay.horizonCaptureFactor).toBeCloseTo(90 / 365)
    expect(ninetyDay.formulas.totalReleasePressureUsd.expression).toContain(
      'next 90d',
    )
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

  it('makes missing data horizon-specific', () => {
    const metrics = calculateTokenMetrics(
      { ...base, unlockUsd90d: null },
      {},
      90,
    )

    expect(metrics.rankable).toBe(false)
    expect(metrics.netCaptureYieldPct).toBeNull()
    expect(metrics.unrankedReason).toContain('90-day forward unlock value')
    expect(calculateTokenMetrics({ ...base, unlockUsd90d: null }).rankable).toBe(
      true,
    )
  })

  it('accepts verified zero release pressure as rankable', () => {
    const metrics = calculateTokenMetrics({
      ...base,
      unlockUsd90d: 0,
      inflationaryEmissionsUsd90d: 0,
      unlockUsd180d: 0,
      inflationaryEmissionsUsd180d: 0,
      unlockUsd365d: 0,
      inflationaryEmissionsUsd365d: 0,
    })

    expect(metrics.rankable).toBe(true)
    expect(metrics.releasePressureYieldPct).toBe(0)
    expect(metrics.coverageRatio).toBeNull()
  })
})
