import { calculateTokenMetrics } from './calculations'
import type {
  AdjustmentFactorOverrides,
  RankedToken,
  TokenValueCaptureInput,
} from './types'
import { parseTokenInputs } from './validation'

function descending(left: number, right: number): number {
  return right - left
}

function coverageSortValue(value: number | null): number {
  return value ?? Number.NEGATIVE_INFINITY
}

/**
 * Ranking order is intentionally explicit: net capture yield first, then
 * unlock coverage, then gross capture yield. Symbol is only a deterministic
 * final ordering rule for otherwise identical rows.
 */
export function rankTokens(
  unparsedInputs: TokenValueCaptureInput[],
  overrides: AdjustmentFactorOverrides = {},
): RankedToken[] {
  const inputs = parseTokenInputs(unparsedInputs)
  const rows = inputs.map((input) => ({
    input,
    metrics: calculateTokenMetrics(input, overrides),
  }))

  rows.sort((left, right) => {
    if (left.metrics.rankable !== right.metrics.rankable) {
      return left.metrics.rankable ? -1 : 1
    }

    if (!left.metrics.rankable && !right.metrics.rankable) {
      return left.input.symbol.localeCompare(right.input.symbol)
    }

    const netYieldOrder = descending(
      left.metrics.netCaptureYieldPct!,
      right.metrics.netCaptureYieldPct!,
    )
    if (netYieldOrder !== 0) return netYieldOrder

    const coverageOrder = descending(
      left.metrics.totalReleasePressureUsd === 0
        ? Number.POSITIVE_INFINITY
        : coverageSortValue(left.metrics.coverageRatio),
      right.metrics.totalReleasePressureUsd === 0
        ? Number.POSITIVE_INFINITY
        : coverageSortValue(right.metrics.coverageRatio),
    )
    if (coverageOrder !== 0) return coverageOrder

    const grossYieldOrder = descending(
      left.metrics.effectiveCaptureYieldPct,
      right.metrics.effectiveCaptureYieldPct,
    )
    if (grossYieldOrder !== 0) return grossYieldOrder

    return left.input.symbol.localeCompare(right.input.symbol)
  })

  let rankedCount = 0
  return rows.map((row) => {
    if (row.metrics.rankable) rankedCount += 1

    return {
      rank: row.metrics.rankable ? rankedCount : null,
      ...row,
    }
  })
}
