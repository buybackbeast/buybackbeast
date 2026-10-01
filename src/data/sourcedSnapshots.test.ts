import { describe, expect, it } from 'vitest'

import uniswapVestingEvidence from '../../docs/evidence/uniswap-univesting-2026-09-30.json'
import { SOURCED_CANDIDATE_SNAPSHOTS, getSourcedCandidateSnapshot } from './sourcedSnapshots'

describe('sourced candidate snapshots', () => {
  it('keeps snapshot identifiers unique', () => {
    const ids = SOURCED_CANDIDATE_SNAPSHOTS.map((snapshot) => snapshot.id)
    const candidateIds = SOURCED_CANDIDATE_SNAPSHOTS.map((snapshot) => snapshot.candidateId)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(candidateIds).size).toBe(candidateIds.length)
  })

  it('keeps UNI release data separate from market-cap snapshots', () => {
    const snapshot = getSourcedCandidateSnapshot('uniswap')

    expect(snapshot).toBeDefined()
    expect(snapshot?.valuationPriceUsd).toBe(9.07)
    expect(snapshot?.releaseData).toMatchObject({
      dataDate: '2026-09-30',
    })
    expect(snapshot?.releaseData).not.toHaveProperty('circulatingMarketCapUsd')
    expect(snapshot?.releaseData).not.toHaveProperty('fdvUsd')
    expect(snapshot?.releaseData.unlockUsd7d).toBe(5_000_000 * 9.07)
    expect(snapshot?.releaseData.unlockUsd30d).toBe(5_000_000 * 9.07)
    expect(snapshot?.releaseData.unlockUsd90d).toBe(5_000_000 * 9.07)
    expect(snapshot?.releaseData.unlockUsd180d).toBe(10_000_000 * 9.07)
    expect(snapshot?.releaseData.unlockUsd365d).toBe(20_000_000 * 9.07)
    expect(snapshot?.summary).toContain('allocation vesting ended in September 2025')
    expect(snapshot?.summary).toContain('same October 1 event')
    expect(snapshot?.summary).toContain('not continuous minting')
    expect(snapshot?.methodology).toContain('no amount is prorated by day')
    expect(snapshot?.sources.map((source) => source.url)).toEqual(expect.arrayContaining([
      'https://defillama.com/unlocks/uniswap',
      'https://dune.com/uniswaplabs/uni-burn-tracker-l1l2',
    ]))
  })

  it('records verified inactive inflation separately from treasury releases', () => {
    const emissions = getSourcedCandidateSnapshot('uniswap')?.releaseData

    expect(emissions?.inflationaryEmissionsUsd7d).toBe(0)
    expect(emissions?.inflationaryEmissionsUsd30d).toBe(0)
    expect(emissions?.inflationaryEmissionsUsd90d).toBe(0)
    expect(emissions?.inflationaryEmissionsUsd180d).toBe(0)
    expect(emissions?.inflationaryEmissionsUsd365d).toBe(0)
  })

  it('records the onchain state used to project the conditional treasury releases', () => {
    const verification = getSourcedCandidateSnapshot('uniswap')?.onchainVerification

    expect(verification).toMatchObject({
      contractAddress: '0xCa046A83EDB78F74aE338bb5A291bF6FdAc9e1D2',
      blockNumber: 26_091_194,
      blockHash: '0x1b3d77c29efe1675a7d6fba69351dea581129a660c1bd8c7b8c577257aee7693',
      blockTimestamp: '2026-09-30T15:28:47Z',
      quarterlyAmountTokens: 5_000_000,
      remainingAllowanceTokens: 25_000_000,
      lastUnlockDate: '2026-07-01',
    })
    expect(verification?.remainingAllowanceTokens).toBeGreaterThanOrEqual(20_000_000)

    const quarterlyAmountCall = uniswapVestingEvidence.ethCalls.find(
      (call) => call.name === 'quarterlyVestingAmount',
    )
    const allowanceCall = uniswapVestingEvidence.ethCalls.find(
      (call) => call.name === 'allowance',
    )
    const lastUnlockCall = uniswapVestingEvidence.ethCalls.find(
      (call) => call.name === 'lastUnlockTimestamp',
    )

    expect(uniswapVestingEvidence.block.number).toBe(verification?.blockNumber)
    expect(uniswapVestingEvidence.block.hash).toBe(verification?.blockHash)
    expect(uniswapVestingEvidence.block.timestamp).toBe(verification?.blockTimestamp)
    expect(uniswapVestingEvidence.contracts.uniVesting).toBe(verification?.contractAddress)
    expect(BigInt(quarterlyAmountCall?.result ?? 0) / 10n ** 18n).toBe(5_000_000n)
    expect(BigInt(allowanceCall?.result ?? 0) / 10n ** 18n).toBe(25_000_000n)
    expect(new Date(Number(BigInt(lastUnlockCall?.result ?? 0)) * 1000).toISOString()).toBe(
      '2026-07-01T00:00:00.000Z',
    )
    expect(allowanceCall?.data.toLowerCase()).toContain(
      uniswapVestingEvidence.contracts.owner.slice(2).toLowerCase(),
    )
    expect(allowanceCall?.data.toLowerCase()).toContain(
      uniswapVestingEvidence.contracts.uniVesting.slice(2).toLowerCase(),
    )
  })
})
