export interface CoinMarketCapSnapshot {
  candidateId: string
  provider: 'coinmarketcap'
  coinMarketCapId: number
  coinMarketCapSlug: string
  circulatingMarketCapUsd: number
  asOfTimestamp: string
  sourceUrl: string
}

interface RemoteMarketCapSnapshot {
  candidateId: string
  coinMarketCapId: number
  circulatingMarketCapUsd: number
}

interface RemoteMarketCapPayload {
  schemaVersion: 1
  provider: 'coinmarketcap'
  asOfTimestamp: string
  snapshots: RemoteMarketCapSnapshot[]
}

export const COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP = '2026-09-30T18:59:00Z'

/**
 * Dated circulating-market-cap snapshots from CoinMarketCap. Market data is
 * intentionally separate from mechanism qualification and release schedules.
 */
export const COIN_MARKET_CAP_SNAPSHOTS = [
  {
    candidateId: 'uniswap',
    provider: 'coinmarketcap',
    coinMarketCapId: 7083,
    coinMarketCapSlug: 'uniswap',
    circulatingMarketCapUsd: 5_480_112_183,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/uniswap/',
  },
  {
    candidateId: 'hyperliquid',
    provider: 'coinmarketcap',
    coinMarketCapId: 32196,
    coinMarketCapSlug: 'hyperliquid',
    circulatingMarketCapUsd: 22_439_602_562,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/hyperliquid/',
  },
  {
    candidateId: 'pump-fun',
    provider: 'coinmarketcap',
    coinMarketCapId: 36507,
    coinMarketCapSlug: 'pump-fun',
    circulatingMarketCapUsd: 2_715_613_594,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/pump-fun/',
  },
  {
    candidateId: 'pancakeswap',
    provider: 'coinmarketcap',
    coinMarketCapId: 7186,
    coinMarketCapSlug: 'pancakeswap',
    circulatingMarketCapUsd: 864_027_941,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/pancakeswap/',
  },
  {
    candidateId: 'injective',
    provider: 'coinmarketcap',
    coinMarketCapId: 7226,
    coinMarketCapSlug: 'injective',
    circulatingMarketCapUsd: 734_314_623,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/injective/',
  },
  {
    candidateId: 'lighter',
    provider: 'coinmarketcap',
    coinMarketCapId: 39125,
    coinMarketCapSlug: 'lighter',
    circulatingMarketCapUsd: 986_618_464,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/lighter/',
  },
  {
    candidateId: 'aster',
    provider: 'coinmarketcap',
    coinMarketCapId: 36341,
    coinMarketCapSlug: 'aster',
    circulatingMarketCapUsd: 2_032_639_834,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/aster/',
  },
  {
    candidateId: 'sky',
    provider: 'coinmarketcap',
    coinMarketCapId: 33038,
    coinMarketCapSlug: 'sky',
    circulatingMarketCapUsd: 1_817_181_714,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/sky/',
  },
  {
    candidateId: 'pendle',
    provider: 'coinmarketcap',
    coinMarketCapId: 9481,
    coinMarketCapSlug: 'pendle',
    circulatingMarketCapUsd: 408_465_245,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/pendle/',
  },
  {
    candidateId: 'banana-gun',
    provider: 'coinmarketcap',
    coinMarketCapId: 28066,
    coinMarketCapSlug: 'banana-gun',
    circulatingMarketCapUsd: 16_186_971,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/banana-gun/',
  },
  {
    candidateId: 'beefy',
    provider: 'coinmarketcap',
    coinMarketCapId: 7311,
    coinMarketCapSlug: 'beefy-finance',
    circulatingMarketCapUsd: 5_812_702.72,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/beefy-finance/',
  },
  {
    candidateId: 'dydx',
    provider: 'coinmarketcap',
    coinMarketCapId: 28324,
    coinMarketCapSlug: 'dydx-chain',
    circulatingMarketCapUsd: 121_378_874.49,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/dydx-chain/',
  },
  {
    candidateId: 'gmx',
    provider: 'coinmarketcap',
    coinMarketCapId: 11857,
    coinMarketCapSlug: 'gmx',
    circulatingMarketCapUsd: 82_159_856.01,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/gmx/',
  },
  {
    candidateId: 'jupiter',
    provider: 'coinmarketcap',
    coinMarketCapId: 29210,
    coinMarketCapSlug: 'jupiter-ag',
    circulatingMarketCapUsd: 1_082_101_572.5,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/jupiter-ag/',
  },
  {
    candidateId: 'raydium',
    provider: 'coinmarketcap',
    coinMarketCapId: 8526,
    coinMarketCapSlug: 'raydium',
    circulatingMarketCapUsd: 536_006_601.4,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/raydium/',
  },
  {
    candidateId: 'chainlink',
    provider: 'coinmarketcap',
    coinMarketCapId: 1975,
    coinMarketCapSlug: 'chainlink',
    circulatingMarketCapUsd: 10_708_841_727,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/chainlink/',
  },
  {
    candidateId: 'maple-finance',
    provider: 'coinmarketcap',
    coinMarketCapId: 33824,
    coinMarketCapSlug: 'maple-finance',
    circulatingMarketCapUsd: 270_935_884,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/maple-finance/',
  },
  {
    candidateId: 'cow-protocol',
    provider: 'coinmarketcap',
    coinMarketCapId: 19269,
    coinMarketCapSlug: 'cow-protocol',
    circulatingMarketCapUsd: 94_518_301,
    asOfTimestamp: COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
    sourceUrl: 'https://coinmarketcap.com/currencies/cow-protocol/',
  },
] as const satisfies readonly CoinMarketCapSnapshot[]

export function getCoinMarketCapSnapshot(candidateId: string): CoinMarketCapSnapshot | undefined {
  return COIN_MARKET_CAP_SNAPSHOTS.find((snapshot) => snapshot.candidateId === candidateId)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isIsoUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return false
  }
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return false
  const normalized = value.includes('.') ? value : value.replace('Z', '.000Z')
  return new Date(timestamp).toISOString() === normalized
}

export function parseCoinMarketCapPayload(value: unknown): CoinMarketCapSnapshot[] {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || value.provider !== 'coinmarketcap'
    || !isIsoUtcTimestamp(value.asOfTimestamp)
    || !Array.isArray(value.snapshots)) {
    throw new Error('Invalid CoinMarketCap payload')
  }

  const payload = value as unknown as RemoteMarketCapPayload
  const staticByCandidate = new Map<string, CoinMarketCapSnapshot>(
    COIN_MARKET_CAP_SNAPSHOTS.map((snapshot) => [snapshot.candidateId, snapshot]),
  )
  const updates = new Map<string, RemoteMarketCapSnapshot>()

  for (const snapshot of payload.snapshots) {
    if (!isRecord(snapshot)
      || typeof snapshot.candidateId !== 'string'
      || !Number.isInteger(snapshot.coinMarketCapId)
      || typeof snapshot.circulatingMarketCapUsd !== 'number'
      || !Number.isFinite(snapshot.circulatingMarketCapUsd)
      || snapshot.circulatingMarketCapUsd <= 0) {
      throw new Error('Invalid CoinMarketCap snapshot')
    }

    const staticSnapshot = staticByCandidate.get(snapshot.candidateId)
    if (!staticSnapshot || staticSnapshot.coinMarketCapId !== snapshot.coinMarketCapId) {
      throw new Error(`Unexpected CoinMarketCap asset: ${snapshot.candidateId}`)
    }
    if (updates.has(snapshot.candidateId)) {
      throw new Error(`Duplicate CoinMarketCap asset: ${snapshot.candidateId}`)
    }
    updates.set(snapshot.candidateId, snapshot as RemoteMarketCapSnapshot)
  }

  if (updates.size !== COIN_MARKET_CAP_SNAPSHOTS.length) {
    throw new Error('CoinMarketCap payload does not cover every candidate')
  }

  return COIN_MARKET_CAP_SNAPSHOTS.map((snapshot) => ({
    ...snapshot,
    circulatingMarketCapUsd: updates.get(snapshot.candidateId)!.circulatingMarketCapUsd,
    asOfTimestamp: payload.asOfTimestamp,
  }))
}

export async function loadLatestCoinMarketCapSnapshots(
  signal?: AbortSignal,
): Promise<CoinMarketCapSnapshot[]> {
  const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000))
  const url = `${import.meta.env.BASE_URL}data/market-caps.json?v=${cacheBucket}`
  const response = await fetch(url, { cache: 'no-store', signal })
  if (!response.ok) throw new Error(`Unable to load CMC snapshots: HTTP ${response.status}`)
  return parseCoinMarketCapPayload(await response.json())
}
