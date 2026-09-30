export const BUYBACK_DESTINATIONS = [
  'burn',
  'lock',
  'treasury',
  'recycled',
] as const

export type BuybackDestination = (typeof BUYBACK_DESTINATIONS)[number]

export const EVIDENCE_LEVELS = [
  'onchain',
  'official',
  'third_party',
  'estimate',
  'announcement',
] as const

export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number]

export const PROGRAM_STATUSES = [
  'active',
  'paused',
  'proposed',
  'ended',
] as const

export type ProgramStatus = (typeof PROGRAM_STATUSES)[number]

/** All monetary values are USD values measured at the supplied data date. */
export interface TokenValueCaptureInput {
  id?: string
  name: string
  symbol: string
  circulatingMarketCapUsd: number
  fdvUsd: number
  /** Observation window for the three recurring capture fields, from 1 to 365. */
  capturePeriodDays: number
  /** Strictly executed buybacks during capturePeriodDays. */
  executedBuybacksUsdInPeriod: number
  /** Recurring direct burns, excluding any tokens funded by executed buybacks. */
  recurringDirectBurnsUsdInPeriod: number
  /** Cash or revenue distributions paid to holders during capturePeriodDays. */
  holderDistributionsUsdInPeriod: number
  /** Informational subset of executed buybacks; never added to capture again. */
  boughtAndBurnedUsdInPeriod?: number
  /** Announced or unexecuted budget. Context only and excluded from ranking. */
  announcedBuybacksUsd: number
  /** Non-recurring burns. Context only and excluded from the recurring run-rate. */
  oneOffBurnsUsd: number
  /** Null means the forward unlock value is unknown. Numeric zero means verified zero. */
  unlockUsd365d: number | null
  /** Null means forward inflationary emissions are unknown. Zero means verified zero. */
  inflationaryEmissionsUsd365d: number | null
  buybackDestination: BuybackDestination
  evidenceLevel: EvidenceLevel
  programStatus: ProgramStatus
  dataDate: string
  sourceUrls: string[]
}

export interface AdjustmentFactors {
  destination: Readonly<Record<BuybackDestination, number>>
}

export interface AdjustmentFactorOverrides {
  destination?: Partial<Record<BuybackDestination, number>>
}

export type AnnualizationStatus = 'actual_365d' | 'provisional_annualized'

export type MetricFormulaKey =
  | 'annualizedGrossCaptureUsd'
  | 'annualizedEffectiveCaptureUsd'
  | 'grossCaptureYieldPct'
  | 'effectiveCaptureYieldPct'
  | 'unlockDilutionPct'
  | 'emissionsDilutionPct'
  | 'totalReleasePressureUsd'
  | 'releasePressureYieldPct'
  | 'netCaptureUsd'
  | 'netCaptureYieldPct'
  | 'coverageRatio'
  | 'fdvPremiumPct'

export interface CalculationFormula {
  label: string
  expression: string
  substituted: string
  result: number | null
}

export type CalculationFormulaMap = Record<
  MetricFormulaKey,
  CalculationFormula
>

export interface TokenMetrics {
  capturePeriodGrossUsd: number
  annualizationFactor: number
  annualizationStatus: AnnualizationStatus
  annualizedExecutedBuybacksUsd: number
  annualizedRecurringDirectBurnsUsd: number
  annualizedHolderDistributionsUsd: number
  annualizedGrossCaptureUsd: number
  annualizedEffectiveCaptureUsd: number
  grossCaptureYieldPct: number
  effectiveCaptureYieldPct: number
  unlockDilutionPct: number | null
  emissionsDilutionPct: number | null
  totalReleasePressureUsd: number | null
  releasePressureYieldPct: number | null
  netCaptureUsd: number | null
  netCaptureYieldPct: number | null
  /** Null means either missing release data or verified zero release pressure. */
  coverageRatio: number | null
  fdvPremiumPct: number
  appliedDestinationFactor: number
  rankable: boolean
  unrankedReason: string | null
  formulas: CalculationFormulaMap
}

export interface RankedToken {
  /** Incomplete forward release data produces an unranked row with rank null. */
  rank: number | null
  input: TokenValueCaptureInput
  metrics: TokenMetrics
}
