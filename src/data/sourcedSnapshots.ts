import type { TokenValueCaptureInput } from '../lib'

type ReleaseData = Pick<
  TokenValueCaptureInput,
  | 'unlockUsd90d'
  | 'inflationaryEmissionsUsd90d'
  | 'unlockUsd180d'
  | 'inflationaryEmissionsUsd180d'
  | 'unlockUsd365d'
  | 'inflationaryEmissionsUsd365d'
  | 'dataDate'
>

export interface SourcedCandidateSnapshot {
  id: string
  candidateId: string
  asOfDate: string
  valuationPriceUsd: number
  releaseData: ReleaseData
  summary: string
  methodology: string
  onchainVerification?: {
    contractAddress: string
    blockNumber: number
    blockHash: string
    blockTimestamp: string
    quarterlyAmountTokens: number
    remainingAllowanceTokens: number
    lastUnlockDate: string
  }
  sources: readonly {
    label: string
    url: string
  }[]
}

const UNISWAP_PRICE_USD = 9.07

/**
 * Dated, read-only release data is kept separate from mechanism qualification,
 * market-cap snapshots, and the editable ranking dataset.
 */
export const SOURCED_CANDIDATE_SNAPSHOTS = [
  {
    id: 'uniswap-2026-09-30',
    candidateId: 'uniswap',
    asOfDate: '2026-09-30',
    valuationPriceUsd: UNISWAP_PRICE_USD,
    releaseData: {
      // Verified growth-budget schedule after the snapshot: 5M / 10M / 20M UNI.
      unlockUsd90d: 5_000_000 * UNISWAP_PRICE_USD,
      unlockUsd180d: 10_000_000 * UNISWAP_PRICE_USD,
      unlockUsd365d: 20_000_000 * UNISWAP_PRICE_USD,
      // Governance can mint, but Uniswap's current documentation reports no active inflation.
      inflationaryEmissionsUsd90d: 0,
      inflationaryEmissionsUsd180d: 0,
      inflationaryEmissionsUsd365d: 0,
      dataDate: '2026-09-30',
    },
    summary:
      'DefiLlama marks the original UNI vesting schedule 100% unlocked. A separate onchain-verified UNIVesting growth budget schedules 5M, 10M, and 20M UNI, valued at $45.35M, $90.70M, and $181.40M across the next 90, 180, and 365 days.',
    methodology:
      'Uses the half-open interval (snapshot date, horizon end]. At Ethereum block 26,091,194 the contract still had a 5M UNI quarterly amount, a July 1 last-unlock boundary, and 25M UNI of owner allowance. The $9.07 valuation price is retained only to reproduce the forward release values. Releases remain revocable.',
    onchainVerification: {
      contractAddress: '0xCa046A83EDB78F74aE338bb5A291bF6FdAc9e1D2',
      blockNumber: 26_091_194,
      blockHash: '0x1b3d77c29efe1675a7d6fba69351dea581129a660c1bd8c7b8c577257aee7693',
      blockTimestamp: '2026-09-30T15:28:47Z',
      quarterlyAmountTokens: 5_000_000,
      remainingAllowanceTokens: 25_000_000,
      lastUnlockDate: '2026-07-01',
    },
    sources: [
      {
        label: 'Uniswap Labs UNI burn tracker',
        url: 'https://dune.com/uniswaplabs/uni-burn-tracker-l1l2',
      },
      {
        label: 'DefiLlama UNI unlock schedule',
        url: 'https://defillama.com/unlocks/uniswap',
      },
      {
        label: 'Official UNI token supply documentation',
        url: 'https://developers.uniswap.org/docs/ecosystem/governance/uni',
      },
      {
        label: 'Executed UNIfication proposal',
        url: 'https://vote.uniswapfoundation.org/proposals/93',
      },
      {
        label: 'UNIVesting contract',
        url: 'https://github.com/Uniswap/protocol-fees/blob/0c071d199dc32556365c78e03ec3f4d09b9fbf37/src/UNIVesting.sol',
      },
      {
        label: 'Official protocol-fee deployments',
        url: 'https://developers.uniswap.org/docs/protocols/protocol-fee/deployments',
      },
      {
        label: 'UNIVesting onchain state',
        url: 'https://etherscan.io/address/0xCa046A83EDB78F74aE338bb5A291bF6FdAc9e1D2#readContract',
      },
      {
        label: 'Pinned UNIVesting RPC evidence',
        url: 'https://github.com/buybackbeast/buybackbeast/blob/main/docs/evidence/uniswap-univesting-2026-09-30.json',
      },
    ],
  },
] as const satisfies readonly SourcedCandidateSnapshot[]

export function getSourcedCandidateSnapshot(candidateId: string): SourcedCandidateSnapshot | undefined {
  return SOURCED_CANDIDATE_SNAPSHOTS.find((snapshot) => snapshot.candidateId === candidateId)
}
