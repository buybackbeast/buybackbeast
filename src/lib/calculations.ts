import Decimal from 'decimal.js'

import type {
  AdjustmentFactorOverrides,
  AdjustmentFactors,
  CalculationFormulaMap,
  ReleaseHorizonDays,
  TokenMetrics,
  TokenValueCaptureInput,
} from './types'
import { parseAdjustmentFactors, parseTokenInput } from './validation'

export const DEFAULT_ADJUSTMENT_FACTORS: AdjustmentFactors = Object.freeze({
  destination: Object.freeze({
    burn: 1,
    lock: 1,
    treasury: 0,
    recycled: 0,
  }),
})

interface RawMetricValues {
  capturePeriodGrossUsd: Decimal
  annualizationFactor: Decimal
  horizonCaptureFactor: Decimal
  annualizedExecutedBuybacksUsd: Decimal
  annualizedRecurringDirectBurnsUsd: Decimal
  annualizedHolderDistributionsUsd: Decimal
  annualizedGrossCaptureUsd: Decimal
  annualizedEffectiveCaptureUsd: Decimal
  horizonEffectiveCaptureUsd: Decimal
  horizonEffectiveCaptureYieldPct: Decimal
  grossCaptureYieldPct: Decimal
  effectiveCaptureYieldPct: Decimal
  unlockDilutionPct: Decimal | null
  emissionsDilutionPct: Decimal | null
  totalReleasePressureUsd: Decimal | null
  releasePressureYieldPct: Decimal | null
  netCaptureUsd: Decimal | null
  netCaptureYieldPct: Decimal | null
  coverageRatio: Decimal | null
  fdvPremiumPct: Decimal
  appliedDestinationFactor: Decimal
  rankable: boolean
  unrankedReason: string | null
}

interface ReleaseInputs {
  unlockUsd: number | null
  emissionsUsd: number | null
}

const decimal = (value: number): Decimal => new Decimal(value)
const number = (value: Decimal): number => value.toNumber()
const numberOrNull = (value: Decimal | null): number | null =>
  value === null ? null : number(value)
const plain = (value: number | Decimal): string =>
  new Decimal(value).toSignificantDigits(15).toString()

export function resolveAdjustmentFactors(
  overrides: AdjustmentFactorOverrides = {},
): AdjustmentFactors {
  return parseAdjustmentFactors({
    destination: {
      ...DEFAULT_ADJUSTMENT_FACTORS.destination,
      ...overrides.destination,
    },
  })
}

function getReleaseInputs(
  input: TokenValueCaptureInput,
  releaseHorizonDays: ReleaseHorizonDays,
): ReleaseInputs {
  if (releaseHorizonDays === 90) {
    return {
      unlockUsd: input.unlockUsd90d,
      emissionsUsd: input.inflationaryEmissionsUsd90d,
    }
  }

  if (releaseHorizonDays === 180) {
    return {
      unlockUsd: input.unlockUsd180d,
      emissionsUsd: input.inflationaryEmissionsUsd180d,
    }
  }

  return {
    unlockUsd: input.unlockUsd365d,
    emissionsUsd: input.inflationaryEmissionsUsd365d,
  }
}

function getUnrankedReason(
  releaseInputs: ReleaseInputs,
  releaseHorizonDays: ReleaseHorizonDays,
): string | null {
  const missing: string[] = []
  if (releaseInputs.unlockUsd === null) missing.push('forward unlock value')
  if (releaseInputs.emissionsUsd === null) {
    missing.push('forward inflationary emissions')
  }

  return missing.length === 0
    ? null
    : `Missing ${releaseHorizonDays}-day ${missing.join(' and ')}`
}

function calculateRawMetrics(
  input: TokenValueCaptureInput,
  factors: AdjustmentFactors,
  releaseHorizonDays: ReleaseHorizonDays,
): RawMetricValues {
  const marketCap = decimal(input.circulatingMarketCapUsd)
  const annualizationFactor = decimal(365).div(input.capturePeriodDays)
  const annualizedExecutedBuybacksUsd = decimal(
    input.executedBuybacksUsdInPeriod,
  ).times(annualizationFactor)
  const annualizedRecurringDirectBurnsUsd = decimal(
    input.recurringDirectBurnsUsdInPeriod,
  ).times(annualizationFactor)
  const annualizedHolderDistributionsUsd = decimal(
    input.holderDistributionsUsdInPeriod,
  ).times(annualizationFactor)
  const capturePeriodGrossUsd = decimal(input.executedBuybacksUsdInPeriod)
    .plus(input.recurringDirectBurnsUsdInPeriod)
    .plus(input.holderDistributionsUsdInPeriod)
  const annualizedGrossCaptureUsd = annualizedExecutedBuybacksUsd
    .plus(annualizedRecurringDirectBurnsUsd)
    .plus(annualizedHolderDistributionsUsd)
  const appliedDestinationFactor = decimal(
    factors.destination[input.buybackDestination],
  )
  const annualizedEffectiveCaptureUsd = annualizedExecutedBuybacksUsd
    .times(appliedDestinationFactor)
    .plus(annualizedRecurringDirectBurnsUsd)
    .plus(annualizedHolderDistributionsUsd)
  const horizonCaptureFactor = decimal(releaseHorizonDays).div(365)
  const horizonEffectiveCaptureUsd = annualizedEffectiveCaptureUsd.times(
    horizonCaptureFactor,
  )

  const releaseInputs = getReleaseInputs(input, releaseHorizonDays)
  const unlockValue =
    releaseInputs.unlockUsd === null ? null : decimal(releaseInputs.unlockUsd)
  const emissionsValue =
    releaseInputs.emissionsUsd === null
      ? null
      : decimal(releaseInputs.emissionsUsd)
  const hasCompleteReleaseData = unlockValue !== null && emissionsValue !== null
  const totalReleasePressureUsd = hasCompleteReleaseData
    ? unlockValue.plus(emissionsValue)
    : null
  const netCaptureUsd =
    totalReleasePressureUsd === null
      ? null
      : horizonEffectiveCaptureUsd.minus(totalReleasePressureUsd)
  const coverageRatio =
    totalReleasePressureUsd === null || totalReleasePressureUsd.isZero()
      ? null
      : horizonEffectiveCaptureUsd.div(totalReleasePressureUsd)
  const unrankedReason = getUnrankedReason(releaseInputs, releaseHorizonDays)

  return {
    capturePeriodGrossUsd,
    annualizationFactor,
    horizonCaptureFactor,
    annualizedExecutedBuybacksUsd,
    annualizedRecurringDirectBurnsUsd,
    annualizedHolderDistributionsUsd,
    annualizedGrossCaptureUsd,
    annualizedEffectiveCaptureUsd,
    horizonEffectiveCaptureUsd,
    horizonEffectiveCaptureYieldPct: horizonEffectiveCaptureUsd
      .div(marketCap)
      .times(100),
    grossCaptureYieldPct: annualizedGrossCaptureUsd.div(marketCap).times(100),
    effectiveCaptureYieldPct: annualizedEffectiveCaptureUsd
      .div(marketCap)
      .times(100),
    unlockDilutionPct:
      unlockValue === null ? null : unlockValue.div(marketCap).times(100),
    emissionsDilutionPct:
      emissionsValue === null ? null : emissionsValue.div(marketCap).times(100),
    totalReleasePressureUsd,
    releasePressureYieldPct:
      totalReleasePressureUsd === null
        ? null
        : totalReleasePressureUsd.div(marketCap).times(100),
    netCaptureUsd,
    netCaptureYieldPct:
      netCaptureUsd === null ? null : netCaptureUsd.div(marketCap).times(100),
    coverageRatio,
    fdvPremiumPct: decimal(input.fdvUsd)
      .div(marketCap)
      .minus(1)
      .times(100),
    appliedDestinationFactor,
    rankable: hasCompleteReleaseData,
    unrankedReason,
  }
}

function missingReleaseText(releaseInputs: ReleaseInputs): string {
  const missing: string[] = []
  if (releaseInputs.unlockUsd === null) missing.push('unlock')
  if (releaseInputs.emissionsUsd === null) missing.push('emissions')
  return `NR: missing ${missing.join(' and ')} data`
}

function buildFormulaMap(
  input: TokenValueCaptureInput,
  values: RawMetricValues,
  releaseHorizonDays: ReleaseHorizonDays,
): CalculationFormulaMap {
  const marketCap = plain(input.circulatingMarketCapUsd)
  const annualization = plain(values.annualizationFactor)
  const gross = plain(values.annualizedGrossCaptureUsd)
  const effective = plain(values.annualizedEffectiveCaptureUsd)
  const horizonEffective = plain(values.horizonEffectiveCaptureUsd)
  const destinationFactor = plain(values.appliedDestinationFactor)
  const release =
    values.totalReleasePressureUsd === null
      ? null
      : plain(values.totalReleasePressureUsd)
  const releaseInputs = getReleaseInputs(input, releaseHorizonDays)
  const missing = missingReleaseText(releaseInputs)

  return {
    annualizedGrossCaptureUsd: {
      label: 'Annualized gross recurring capture',
      expression:
        '(executed buybacks + recurring direct burns + holder distributions) × 365 ÷ capture days',
      substituted: `(${plain(input.executedBuybacksUsdInPeriod)} + ${plain(input.recurringDirectBurnsUsdInPeriod)} + ${plain(input.holderDistributionsUsdInPeriod)}) × ${annualization} = ${gross}; bought-and-burned ${plain(input.boughtAndBurnedUsdInPeriod ?? 0)} is already in buybacks; announced ${plain(input.announcedBuybacksUsd)} and one-off burns ${plain(input.oneOffBurnsUsd)} are excluded`,
      result: number(values.annualizedGrossCaptureUsd),
    },
    annualizedEffectiveCaptureUsd: {
      label: 'Annualized effective recurring capture',
      expression:
        'annualized executed buybacks × destination factor + annualized recurring direct burns + annualized holder distributions',
      substituted: `${plain(values.annualizedExecutedBuybacksUsd)} × ${destinationFactor} + ${plain(values.annualizedRecurringDirectBurnsUsd)} + ${plain(values.annualizedHolderDistributionsUsd)} = ${effective}; evidence and program status do not change dollars`,
      result: number(values.annualizedEffectiveCaptureUsd),
    },
    horizonEffectiveCaptureUsd: {
      label: `${releaseHorizonDays}-day effective recurring capture`,
      expression: `annualized effective capture × ${releaseHorizonDays} ÷ 365`,
      substituted: `${effective} × ${releaseHorizonDays} ÷ 365 = ${horizonEffective}`,
      result: number(values.horizonEffectiveCaptureUsd),
    },
    grossCaptureYieldPct: {
      label: 'Gross capture yield',
      expression: 'annualized gross capture ÷ circulating market cap × 100',
      substituted: `${gross} ÷ ${marketCap} × 100 = ${plain(values.grossCaptureYieldPct)}%`,
      result: number(values.grossCaptureYieldPct),
    },
    effectiveCaptureYieldPct: {
      label: 'Effective capture yield',
      expression: 'annualized effective capture ÷ circulating market cap × 100',
      substituted: `${effective} ÷ ${marketCap} × 100 = ${plain(values.effectiveCaptureYieldPct)}%`,
      result: number(values.effectiveCaptureYieldPct),
    },
    unlockDilutionPct: {
      label: `${releaseHorizonDays}-day forward unlock pressure`,
      expression: `next ${releaseHorizonDays}d unlock value ÷ circulating market cap × 100`,
      substituted:
        releaseInputs.unlockUsd === null
          ? 'NR: missing unlock data'
          : `${plain(releaseInputs.unlockUsd)} ÷ ${marketCap} × 100 = ${plain(values.unlockDilutionPct!)}%`,
      result: numberOrNull(values.unlockDilutionPct),
    },
    emissionsDilutionPct: {
      label: `${releaseHorizonDays}-day forward emissions pressure`,
      expression: `next ${releaseHorizonDays}d inflationary emissions value ÷ circulating market cap × 100`,
      substituted:
        releaseInputs.emissionsUsd === null
          ? 'NR: missing emissions data'
          : `${plain(releaseInputs.emissionsUsd)} ÷ ${marketCap} × 100 = ${plain(values.emissionsDilutionPct!)}%`,
      result: numberOrNull(values.emissionsDilutionPct),
    },
    totalReleasePressureUsd: {
      label: `${releaseHorizonDays}-day total release pressure`,
      expression: `next ${releaseHorizonDays}d unlock value + next ${releaseHorizonDays}d inflationary emissions value`,
      substituted:
        release === null
          ? missing
          : `${plain(releaseInputs.unlockUsd!)} + ${plain(releaseInputs.emissionsUsd!)} = ${release}`,
      result: numberOrNull(values.totalReleasePressureUsd),
    },
    releasePressureYieldPct: {
      label: 'Release pressure yield',
      expression: 'total release pressure ÷ circulating market cap × 100',
      substituted:
        release === null
          ? missing
          : `${release} ÷ ${marketCap} × 100 = ${plain(values.releasePressureYieldPct!)}%`,
      result: numberOrNull(values.releasePressureYieldPct),
    },
    netCaptureUsd: {
      label: 'Net capture',
      expression: `${releaseHorizonDays}-day effective capture − ${releaseHorizonDays}-day total release pressure`,
      substituted:
        release === null
          ? missing
          : `${horizonEffective} − ${release} = ${plain(values.netCaptureUsd!)}`,
      result: numberOrNull(values.netCaptureUsd),
    },
    netCaptureYieldPct: {
      label: 'Net capture yield',
      expression: 'net capture ÷ circulating market cap × 100',
      substituted:
        values.netCaptureYieldPct === null
          ? missing
          : `${plain(values.netCaptureUsd!)} ÷ ${marketCap} × 100 = ${plain(values.netCaptureYieldPct)}%`,
      result: numberOrNull(values.netCaptureYieldPct),
    },
    coverageRatio: {
      label: 'Release coverage',
      expression: `${releaseHorizonDays}-day effective capture ÷ ${releaseHorizonDays}-day total release pressure`,
      substituted:
        release === null
          ? missing
          : values.coverageRatio === null
            ? `${horizonEffective} ÷ 0 = n/a (verified zero release pressure)`
            : `${horizonEffective} ÷ ${release} = ${plain(values.coverageRatio)}×`,
      result: numberOrNull(values.coverageRatio),
    },
    fdvPremiumPct: {
      label: 'FDV premium',
      expression: '(FDV ÷ circulating market cap − 1) × 100',
      substituted: `(${plain(input.fdvUsd)} ÷ ${marketCap} − 1) × 100 = ${plain(values.fdvPremiumPct)}%`,
      result: number(values.fdvPremiumPct),
    },
  }
}

export function formatCalculationFormula(
  unparsedInput: TokenValueCaptureInput,
  overrides: AdjustmentFactorOverrides = {},
  releaseHorizonDays: ReleaseHorizonDays = 365,
): CalculationFormulaMap {
  const input = parseTokenInput(unparsedInput)
  const factors = resolveAdjustmentFactors(overrides)
  const values = calculateRawMetrics(input, factors, releaseHorizonDays)
  return buildFormulaMap(input, values, releaseHorizonDays)
}

export function calculateTokenMetrics(
  unparsedInput: TokenValueCaptureInput,
  overrides: AdjustmentFactorOverrides = {},
  releaseHorizonDays: ReleaseHorizonDays = 365,
): TokenMetrics {
  const input = parseTokenInput(unparsedInput)
  const factors = resolveAdjustmentFactors(overrides)
  const values = calculateRawMetrics(input, factors, releaseHorizonDays)

  return {
    releaseHorizonDays,
    horizonCaptureFactor: number(values.horizonCaptureFactor),
    capturePeriodGrossUsd: number(values.capturePeriodGrossUsd),
    annualizationFactor: number(values.annualizationFactor),
    annualizationStatus:
      input.capturePeriodDays === 365 ? 'actual_365d' : 'provisional_annualized',
    annualizedExecutedBuybacksUsd: number(
      values.annualizedExecutedBuybacksUsd,
    ),
    annualizedRecurringDirectBurnsUsd: number(
      values.annualizedRecurringDirectBurnsUsd,
    ),
    annualizedHolderDistributionsUsd: number(
      values.annualizedHolderDistributionsUsd,
    ),
    annualizedGrossCaptureUsd: number(values.annualizedGrossCaptureUsd),
    annualizedEffectiveCaptureUsd: number(
      values.annualizedEffectiveCaptureUsd,
    ),
    horizonEffectiveCaptureUsd: number(values.horizonEffectiveCaptureUsd),
    horizonEffectiveCaptureYieldPct: number(
      values.horizonEffectiveCaptureYieldPct,
    ),
    grossCaptureYieldPct: number(values.grossCaptureYieldPct),
    effectiveCaptureYieldPct: number(values.effectiveCaptureYieldPct),
    unlockDilutionPct: numberOrNull(values.unlockDilutionPct),
    emissionsDilutionPct: numberOrNull(values.emissionsDilutionPct),
    totalReleasePressureUsd: numberOrNull(values.totalReleasePressureUsd),
    releasePressureYieldPct: numberOrNull(values.releasePressureYieldPct),
    netCaptureUsd: numberOrNull(values.netCaptureUsd),
    netCaptureYieldPct: numberOrNull(values.netCaptureYieldPct),
    coverageRatio: numberOrNull(values.coverageRatio),
    fdvPremiumPct: number(values.fdvPremiumPct),
    appliedDestinationFactor: number(values.appliedDestinationFactor),
    rankable: values.rankable,
    unrankedReason: values.unrankedReason,
    formulas: buildFormulaMap(input, values, releaseHorizonDays),
  }
}
