import type { TokenValueCaptureInput } from '../lib'

type SnapshotPrefill = Pick<
  TokenValueCaptureInput,
  | 'circulatingMarketCapUsd'
  | 'fdvUsd'
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
  tokenPriceUsd: number
  prefill: SnapshotPrefill
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
 * Dated, reviewable inputs are kept separate from mechanism qualification.
 * The snapshot can prefill an editor, but it never enters the ranking by itself.
 */
export const SOURCED_CANDIDATE_SNAPSHOTS = [
  {
    id: 'uniswap-2026-09-30',
    candidateId: 'uniswap',
    asOfDate: '2026-09-30',
    tokenPriceUsd: UNISWAP_PRICE_USD,
    prefill: {
      circulatingMarketCapUsd: 5_627_000_000,
      // Provider-convention proxy: $9.07 × DefiLlama's reported 1B max supply.
      fdvUsd: 9_070_000_000,
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
      'Uses the half-open interval (snapshot date, horizon end]. At Ethereum block 26,091,194 the contract still had a 5M UNI quarterly amount, a July 1 last-unlock boundary, and 25M UNI of owner allowance. The $9.07 snapshot price values every forward tranche. Releases remain revocable; the $9.07B FDV is a provider-convention proxy, not a hard-cap claim.',
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
        label: 'DefiLlama UNI unlocks and market data',
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
        url: 'https://github.com/valuebeast/valuebeast/blob/main/docs/evidence/uniswap-univesting-2026-09-30.json',
      },
    ],
  },
] as const satisfies readonly SourcedCandidateSnapshot[]

export function getSourcedCandidateSnapshot(candidateId: string): SourcedCandidateSnapshot | undefined {
  return SOURCED_CANDIDATE_SNAPSHOTS.find((snapshot) => snapshot.candidateId === candidateId)
}
