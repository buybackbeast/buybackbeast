import type {
  BuybackDestination,
  EvidenceLevel,
  ProgramStatus,
  TokenValueCaptureInput,
} from '../lib'

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
      'The executed proposal authorized up to 40M treasury UNI for a two-year vesting contract, initially 5M per quarter. Unvested UNI remains in treasury and the allowance can be revoked, so count only expected forward releases.',
    editorGuidance:
      'Enter the USD value of UNI actually burned in executed releaser transactions under recurring direct burns, valued at each burn timestamp. Do not substitute gross fees or enter the same activity as executed buybacks. Keep the 100M treasury burn under one-off burns.',
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
        label: 'DUNI year-end financial statement',
        url: 'https://vote.uniswapfoundation.org/forums/7/duni-q4-and-year-end-2025-financial-statements-and-tax-update',
      },
      {
        label: 'UNIVesting contract',
        url: 'https://github.com/Uniswap/protocol-fees/blob/main/src/UNIVesting.sol',
      },
    ],
  },
] as const satisfies readonly ResearchCandidate[]

export function createCandidateEditorSeed(candidate: ResearchCandidate): Pick<
  TokenValueCaptureInput,
  | 'name'
  | 'symbol'
  | 'buybackDestination'
  | 'evidenceLevel'
  | 'programStatus'
  | 'sourceUrls'
> {
  return {
    name: candidate.name,
    symbol: candidate.symbol,
    buybackDestination: candidate.buybackDestination,
    // Mechanism evidence does not prove every numeric snapshot input.
    evidenceLevel: 'estimate',
    programStatus: candidate.programStatus,
    // Mechanism references are not enough to source a quantitative snapshot.
    sourceUrls: [],
  }
}
