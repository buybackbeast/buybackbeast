import Decimal from 'decimal.js'

import type {
  AdjustmentFactorOverrides,
  AdjustmentFactors,
  CalculationFormulaMap,
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
  annualizedExecutedBuybacksUsd: Decimal
  annualizedRecurringDirectBurnsUsd: Decimal
  annualizedHolderDistributionsUsd: Decimal
  annualizedGrossCaptureUsd: Decimal
  annualizedEffectiveCaptureUsd: Decimal
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

function getUnrankedReason(input: TokenValueCaptureInput): string | null {
  const missing: string[] = []
  if (input.unlockUsd365d === null) missing.push('forward unlock value')
  if (input.inflationaryEmissionsUsd365d === null) {
    missing.push('forward inflationary emissions')
  }

  return missing.length === 0 ? null : `Missing ${missing.join(' and ')}`
}

function calculateRawMetrics(
  input: TokenValueCaptureInput,
  factors: AdjustmentFactors,
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

  const unlockValue =
    input.unlockUsd365d === null ? null : decimal(input.unlockUsd365d)
  const emissionsValue =
    input.inflationaryEmissionsUsd365d === null
      ? null
      : decimal(input.inflationaryEmissionsUsd365d)
  const hasCompleteReleaseData = unlockValue !== null && emissionsValue !== null
  const totalReleasePressureUsd = hasCompleteReleaseData
    ? unlockValue.plus(emissionsValue)
    : null
  const netCaptureUsd =
    totalReleasePressureUsd === null
      ? null
      : annualizedEffectiveCaptureUsd.minus(totalReleasePressureUsd)
  const coverageRatio =
    totalReleasePressureUsd === null || totalReleasePressureUsd.isZero()
      ? null
      : annualizedEffectiveCaptureUsd.div(totalReleasePressureUsd)
  const unrankedReason = getUnrankedReason(input)

  return {
    capturePeriodGrossUsd,
    annualizationFactor,
    annualizedExecutedBuybacksUsd,
    annualizedRecurringDirectBurnsUsd,
    annualizedHolderDistributionsUsd,
    annualizedGrossCaptureUsd,
    annualizedEffectiveCaptureUsd,
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

function missingReleaseText(input: TokenValueCaptureInput): string {
  const missing: string[] = []
  if (input.unlockUsd365d === null) missing.push('unlock')
  if (input.inflationaryEmissionsUsd365d === null) missing.push('emissions')
  return `NR: missing ${missing.join(' and ')} data`
}

function buildFormulaMap(
  input: TokenValueCaptureInput,
  values: RawMetricValues,
): CalculationFormulaMap {
  const marketCap = plain(input.circulatingMarketCapUsd)
  const annualization = plain(values.annualizationFactor)
  const gross = plain(values.annualizedGrossCaptureUsd)
  const effective = plain(values.annualizedEffectiveCaptureUsd)
  const destinationFactor = plain(values.appliedDestinationFactor)
  const release =
    values.totalReleasePressureUsd === null
      ? null
      : plain(values.totalReleasePressureUsd)
  const missing = missingReleaseText(input)

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
      label: 'Forward unlock pressure',
      expression: 'next 365d unlock value ÷ circulating market cap × 100',
      substituted:
        input.unlockUsd365d === null
          ? 'NR: missing unlock data'
          : `${plain(input.unlockUsd365d)} ÷ ${marketCap} × 100 = ${plain(values.unlockDilutionPct!)}%`,
      result: numberOrNull(values.unlockDilutionPct),
    },
    emissionsDilutionPct: {
      label: 'Forward emissions pressure',
      expression:
        'next 365d inflationary emissions value ÷ circulating market cap × 100',
      substituted:
        input.inflationaryEmissionsUsd365d === null
          ? 'NR: missing emissions data'
          : `${plain(input.inflationaryEmissionsUsd365d)} ÷ ${marketCap} × 100 = ${plain(values.emissionsDilutionPct!)}%`,
      result: numberOrNull(values.emissionsDilutionPct),
    },
    totalReleasePressureUsd: {
      label: 'Total release pressure',
      expression: 'next 365d unlock value + next 365d inflationary emissions value',
      substituted:
        release === null
          ? missing
          : `${plain(input.unlockUsd365d!)} + ${plain(input.inflationaryEmissionsUsd365d!)} = ${release}`,
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
      expression: 'annualized effective capture − total release pressure',
      substituted:
        release === null
          ? missing
          : `${effective} − ${release} = ${plain(values.netCaptureUsd!)}`,
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
      expression: 'annualized effective capture ÷ total release pressure',
      substituted:
        release === null
          ? missing
          : values.coverageRatio === null
            ? `${effective} ÷ 0 = n/a (verified zero release pressure)`
            : `${effective} ÷ ${release} = ${plain(values.coverageRatio)}×`,
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
): CalculationFormulaMap {
  const input = parseTokenInput(unparsedInput)
  const factors = resolveAdjustmentFactors(overrides)
  const values = calculateRawMetrics(input, factors)
  return buildFormulaMap(input, values)
}

export function calculateTokenMetrics(
  unparsedInput: TokenValueCaptureInput,
  overrides: AdjustmentFactorOverrides = {},
): TokenMetrics {
  const input = parseTokenInput(unparsedInput)
  const factors = resolveAdjustmentFactors(overrides)
  const values = calculateRawMetrics(input, factors)

  return {
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
    formulas: buildFormulaMap(input, values),
  }
}
