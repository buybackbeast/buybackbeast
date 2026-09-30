import type {
  BuybackDestination,
  EvidenceLevel,
  ProgramStatus,
  TokenValueCaptureInput,
} from '../lib'
import { getSourcedCandidateSnapshot } from './sourcedSnapshots'

type RecurringCaptureField =
  | 'executedBuybacksUsdInPeriod'
  | 'recurringDirectBurnsUsdInPeriod'
  | 'holderDistributionsUsdInPeriod'

type ReleasePressureCategory = 'unlocks' | 'inflationaryEmissions'

export interface ResearchCandidate {
  id: string
  name: string
  symbol: string
  mechanismLabel: string
  mechanismSummary: string
  buybackDestination: BuybackDestination
  evidenceLevel: EvidenceLevel
  programStatus: ProgramStatus
  verifiedOn: string
  recurringEvidence: string
  excludedOneOff: string
  releaseCaveat: string
  editorGuidance: string
  accounting: {
    recurringCaptureField: RecurringCaptureField
    oneOffContextField: 'oneOffBurnsUsd'
    releasePressureCategory: ReleasePressureCategory
  }
  sources: readonly {
    label: string
    url: string
  }[]
}

/**
 * Mechanism-qualified research leads. These records intentionally contain no
 * rankable market-cap, capture, unlock, or emissions inputs.
 */
export const RESEARCH_CANDIDATES = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    mechanismLabel: 'Protocol fee-funded burn-to-claim',
    mechanismSummary:
      'Protocol fees accrue in TokenJar contracts. A permissionless caller burns a threshold amount of UNI through the configured releaser to withdraw eligible accumulated fee assets.',
    buybackDestination: 'burn',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'In a July 18, 2026 update, Uniswap Labs reported that protocol fees had funded about 7.5M UNI (about $25.6M) of burns since fee activation in late December 2025.',
    excludedOneOff:
      'The 100M UNI retroactive treasury burn is non-recurring and must remain outside the recurring score.',
    releaseCaveat:
      'DefiLlama marks the original UNI allocation vesting 100% unlocked. At the September 30 snapshot, the separate growth-budget contract still had a 5M UNI quarterly amount and 25M UNI allowance. Its allowance can be revoked, so scheduled tranches are forward pressure, not guaranteed sales.',
    editorGuidance:
      'The dated market-cap and release snapshot is prefilled from DefiLlama plus the official UNIVesting schedule. Enter the USD value of UNI actually burned in executed releaser transactions under recurring direct burns, valued at each burn timestamp. Do not substitute gross fees or count the 100M treasury burn as recurring.',
    accounting: {
      recurringCaptureField: 'recurringDirectBurnsUsdInPeriod',
      oneOffContextField: 'oneOffBurnsUsd',
      releasePressureCategory: 'unlocks',
    },
    sources: [
      {
        label: 'Executed UNIfication proposal',
        url: 'https://vote.uniswapfoundation.org/proposals/93',
      },
      {
        label: 'Protocol fee mechanics',
        url: 'https://developers.uniswap.org/docs/protocols/protocol-fee/overview',
      },
      {
        label: 'Executed v4 fee activation',
        url: 'https://vote.uniswapfoundation.org/proposals/100',
      },
      {
        label: 'July 2026 burn disclosure',
        url: 'https://gov.uniswap.org/t/temp-check-activate-v4-protocol-fees/26162',
      },
      {
        label: 'Uniswap Labs UNI burn tracker',
        url: 'https://dune.com/uniswaplabs/uni-burn-tracker-l1l2',
      },
      {
        label: 'DUNI year-end financial statement',
        url: 'https://vote.uniswapfoundation.org/forums/7/duni-q4-and-year-end-2025-financial-statements-and-tax-update',
      },
      {
        label: 'UNIVesting contract',
        url: 'https://github.com/Uniswap/protocol-fees/blob/main/src/UNIVesting.sol',
      },
      {
        label: 'DefiLlama UNI unlock schedule',
        url: 'https://defillama.com/unlocks/uniswap',
      },
      {
        label: 'Official UNI token supply documentation',
        url: 'https://developers.uniswap.org/docs/ecosystem/governance/uni',
      },
    ],
  },
] as const satisfies readonly ResearchCandidate[]

export function createCandidateEditorSeed(candidate: ResearchCandidate): Pick<
  TokenValueCaptureInput,
  | 'name'
  | 'symbol'
  | 'circulatingMarketCapUsd'
  | 'fdvUsd'
  | 'unlockUsd90d'
  | 'inflationaryEmissionsUsd90d'
  | 'unlockUsd180d'
  | 'inflationaryEmissionsUsd180d'
  | 'unlockUsd365d'
  | 'inflationaryEmissionsUsd365d'
  | 'buybackDestination'
  | 'evidenceLevel'
  | 'programStatus'
  | 'dataDate'
  | 'sourceUrls'
> {
  const snapshot = getSourcedCandidateSnapshot(candidate.id)

  return {
    name: candidate.name,
    symbol: candidate.symbol,
    circulatingMarketCapUsd: snapshot?.prefill.circulatingMarketCapUsd ?? 0,
    fdvUsd: snapshot?.prefill.fdvUsd ?? 0,
    unlockUsd90d: snapshot?.prefill.unlockUsd90d ?? null,
    inflationaryEmissionsUsd90d: snapshot?.prefill.inflationaryEmissionsUsd90d ?? null,
    unlockUsd180d: snapshot?.prefill.unlockUsd180d ?? null,
    inflationaryEmissionsUsd180d: snapshot?.prefill.inflationaryEmissionsUsd180d ?? null,
    unlockUsd365d: snapshot?.prefill.unlockUsd365d ?? null,
    inflationaryEmissionsUsd365d: snapshot?.prefill.inflationaryEmissionsUsd365d ?? null,
    buybackDestination: candidate.buybackDestination,
    // Mechanism evidence does not prove every numeric snapshot input.
    evidenceLevel: 'estimate',
    programStatus: candidate.programStatus,
    dataDate: snapshot?.prefill.dataDate ?? '',
    sourceUrls: snapshot?.sources.map((source) => source.url) ?? [],
  }
}

export function getCandidateCaptureValidationError(
  candidate: ResearchCandidate,
  input: Pick<
    TokenValueCaptureInput,
    | 'capturePeriodDays'
    | 'executedBuybacksUsdInPeriod'
    | 'recurringDirectBurnsUsdInPeriod'
    | 'holderDistributionsUsdInPeriod'
  >,
): string | null {
  if (input.capturePeriodDays < 90 || input.capturePeriodDays > 365) {
    return 'Enter an observation window between 90 and 365 days.'
  }

  if (input[candidate.accounting.recurringCaptureField] <= 0) {
    return `Enter a positive executed capture amount for the verified ${candidate.symbol} mechanism.`
  }

  return null
}
