import { describe, expect, it } from 'vitest'

import { RESEARCH_CANDIDATES } from './researchCandidates'
import {
  COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
  COIN_MARKET_CAP_SNAPSHOTS,
  getCoinMarketCapSnapshot,
} from './marketSnapshots'

describe('CoinMarketCap snapshots', () => {
  it('covers every research candidate exactly once', () => {
    const candidateIds = RESEARCH_CANDIDATES.map((candidate) => candidate.id)
    const snapshotIds = COIN_MARKET_CAP_SNAPSHOTS.map((snapshot) => snapshot.candidateId)

    expect(new Set(snapshotIds).size).toBe(snapshotIds.length)
    expect([...snapshotIds].sort()).toEqual([...candidateIds].sort())
  })

  it('uses unique CoinMarketCap identifiers and canonical source links', () => {
    const cmcIds = COIN_MARKET_CAP_SNAPSHOTS.map((snapshot) => snapshot.coinMarketCapId)
    const slugs = COIN_MARKET_CAP_SNAPSHOTS.map((snapshot) => snapshot.coinMarketCapSlug)

    expect(new Set(cmcIds).size).toBe(cmcIds.length)
    expect(new Set(slugs).size).toBe(slugs.length)

    for (const snapshot of COIN_MARKET_CAP_SNAPSHOTS) {
      expect(snapshot.provider).toBe('coinmarketcap')
      expect(snapshot.coinMarketCapId).toBeGreaterThan(0)
      expect(snapshot.circulatingMarketCapUsd).toBeGreaterThan(0)
      expect(Number.isFinite(snapshot.circulatingMarketCapUsd)).toBe(true)
      expect(snapshot.asOfTimestamp).toBe(COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP)
      expect(snapshot.sourceUrl).toBe(
        `https://coinmarketcap.com/currencies/${snapshot.coinMarketCapSlug}/`,
      )
    }
  })

  it('returns a matching snapshot without inventing unknown assets', () => {
    expect(getCoinMarketCapSnapshot('uniswap')).toMatchObject({
      coinMarketCapId: 7083,
      circulatingMarketCapUsd: 5_480_112_183,
    })
    expect(getCoinMarketCapSnapshot('unknown')).toBeUndefined()
  })
})
