import { afterEach, describe, expect, it, vi } from 'vitest'

import deployedMarketCaps from '../../public/data/market-caps.json'
import { RESEARCH_CANDIDATES } from './researchCandidates'
import {
  COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
  COIN_MARKET_CAP_SNAPSHOTS,
  getCoinMarketCapSnapshot,
  loadLatestCoinMarketCapSnapshots,
  parseCoinMarketCapPayload,
} from './marketSnapshots'

function makeRemotePayload(): {
  schemaVersion: number
  provider: string
  asOfTimestamp: string
  snapshots: Array<{
    candidateId: string
    coinMarketCapId: number
    circulatingMarketCapUsd: number
  }>
} {
  return {
    schemaVersion: 1,
    provider: 'coinmarketcap',
    asOfTimestamp: '2026-10-01T02:17:00.000Z',
    snapshots: COIN_MARKET_CAP_SNAPSHOTS.map((snapshot, index) => ({
      candidateId: snapshot.candidateId,
      coinMarketCapId: snapshot.coinMarketCapId,
      circulatingMarketCapUsd: snapshot.circulatingMarketCapUsd + index + 1,
    })),
  }
}

describe('CoinMarketCap snapshots', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

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

  it('keeps the deploy seed aligned with the typed fallback', () => {
    expect(deployedMarketCaps.schemaVersion).toBe(1)
    expect(deployedMarketCaps.provider).toBe('coinmarketcap')
    expect(() => parseCoinMarketCapPayload(deployedMarketCaps)).not.toThrow()
    expect(deployedMarketCaps.snapshots.map(({ candidateId, coinMarketCapId }) => ({
      candidateId,
      coinMarketCapId,
    }))).toEqual(
      COIN_MARKET_CAP_SNAPSHOTS.map((snapshot) => ({
        candidateId: snapshot.candidateId,
        coinMarketCapId: snapshot.coinMarketCapId,
      })),
    )
  })

  it('accepts a complete hourly payload and preserves canonical metadata', () => {
    const payload = makeRemotePayload()
    const snapshots = parseCoinMarketCapPayload(payload)

    expect(snapshots).toHaveLength(COIN_MARKET_CAP_SNAPSHOTS.length)
    expect(snapshots[0]).toMatchObject({
      candidateId: 'uniswap',
      coinMarketCapId: 7083,
      circulatingMarketCapUsd: 5_480_112_184,
      asOfTimestamp: payload.asOfTimestamp,
      sourceUrl: 'https://coinmarketcap.com/currencies/uniswap/',
    })
  })

  it('rejects incomplete, duplicated, mismatched, or non-positive hourly data', () => {
    const incomplete = makeRemotePayload()
    incomplete.snapshots.pop()
    expect(() => parseCoinMarketCapPayload(incomplete)).toThrow(/cover every candidate/)

    const duplicated = makeRemotePayload()
    duplicated.snapshots[1] = { ...duplicated.snapshots[0]! }
    expect(() => parseCoinMarketCapPayload(duplicated)).toThrow(/Duplicate CoinMarketCap asset/)

    const mismatched = makeRemotePayload()
    mismatched.snapshots[0]!.coinMarketCapId = 1
    expect(() => parseCoinMarketCapPayload(mismatched)).toThrow(/Unexpected CoinMarketCap asset/)

    const nonPositive = makeRemotePayload()
    nonPositive.snapshots[0]!.circulatingMarketCapUsd = 0
    expect(() => parseCoinMarketCapPayload(nonPositive)).toThrow(/Invalid CoinMarketCap snapshot/)
  })

  it('rejects invalid payload metadata', () => {
    expect(() => parseCoinMarketCapPayload({})).toThrow(/Invalid CoinMarketCap payload/)
    expect(() => parseCoinMarketCapPayload({
      ...makeRemotePayload(),
      asOfTimestamp: 'not-a-date',
    })).toThrow(/Invalid CoinMarketCap payload/)
    expect(() => parseCoinMarketCapPayload({
      ...makeRemotePayload(),
      asOfTimestamp: '2026-02-30T00:00:00Z',
    })).toThrow(/Invalid CoinMarketCap payload/)
  })

  it('loads the deployed payload with a shared five-minute cache bucket', async () => {
    const payload = makeRemotePayload()
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    })
    vi.stubGlobal('fetch', fetchMock)

    const snapshots = await loadLatestCoinMarketCapSnapshots()

    expect(snapshots).toHaveLength(18)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/data\/market-caps\.json\?v=6000000$/),
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('rejects a failed deployed-payload request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    await expect(loadLatestCoinMarketCapSnapshots()).rejects.toThrow(/HTTP 503/)
  })
})
