import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const payloadPath = resolve(projectRoot, 'public/data/market-caps.json')
const temporaryPayloadPath = resolve(projectRoot, 'public/data/market-caps.tmp.json')
const endpoint = 'https://pro-api.coinmarketcap.com/public-api/v2/simple/price'

function asRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function assertSeedPayload(value) {
  const payload = asRecord(value)
  if (!payload || payload.schemaVersion !== 1 || payload.provider !== 'coinmarketcap') {
    throw new Error('Invalid market-cap seed payload')
  }
  if (!Array.isArray(payload.snapshots) || payload.snapshots.length === 0) {
    throw new Error('Market-cap seed payload has no snapshots')
  }
  const candidateIds = new Set()
  const cmcIds = new Set()
  for (const value of payload.snapshots) {
    const snapshot = asRecord(value)
    if (!snapshot
      || typeof snapshot.candidateId !== 'string'
      || !Number.isInteger(snapshot.coinMarketCapId)
      || typeof snapshot.circulatingMarketCapUsd !== 'number'
      || !Number.isFinite(snapshot.circulatingMarketCapUsd)
      || snapshot.circulatingMarketCapUsd <= 0) {
      throw new Error('Invalid asset in market-cap seed payload')
    }
    if (candidateIds.has(snapshot.candidateId) || cmcIds.has(snapshot.coinMarketCapId)) {
      throw new Error('Duplicate asset in market-cap seed payload')
    }
    candidateIds.add(snapshot.candidateId)
    cmcIds.add(snapshot.coinMarketCapId)
  }
  return payload
}

function getUsdQuote(record) {
  if (Array.isArray(record.quotes)) {
    const matches = record.quotes.filter((quote) => asRecord(quote)?.symbol === 'USD')
    return matches.length === 1 ? matches[0] : undefined
  }

  const quote = asRecord(record.quote)
  return quote ? quote.USD : undefined
}

export function buildMarketCapPayload(seedValue, responseValue, currentTime = Date.now()) {
  const seed = assertSeedPayload(seedValue)
  const response = asRecord(responseValue)
  const status = asRecord(response?.status)
  const errorCode = status?.error_code
  if (!response || !status || errorCode === undefined || Number(errorCode) !== 0) {
    throw new Error(`CoinMarketCap returned an error: ${String(status?.error_message ?? errorCode)}`)
  }

  const records = Array.isArray(response.data) ? response.data : null
  if (!records) throw new Error('CoinMarketCap response is missing its data array')

  const recordsById = new Map()
  for (const value of records) {
    const record = asRecord(value)
    if (record && Number.isInteger(record.id)) {
      if (recordsById.has(record.id)) throw new Error(`Duplicate CoinMarketCap ID ${record.id}`)
      recordsById.set(record.id, record)
    }
  }

  const quoteTimestamps = []
  const snapshots = seed.snapshots.map((seedValue) => {
    const seedSnapshot = asRecord(seedValue)
    if (!seedSnapshot || typeof seedSnapshot.candidateId !== 'string' || !Number.isInteger(seedSnapshot.coinMarketCapId)) {
      throw new Error('Invalid asset in market-cap seed payload')
    }

    const record = recordsById.get(seedSnapshot.coinMarketCapId)
    if (!record) throw new Error(`CoinMarketCap omitted ID ${seedSnapshot.coinMarketCapId}`)
    const quote = asRecord(getUsdQuote(record))
    const marketCap = quote?.market_cap
    if (typeof marketCap !== 'number' || !Number.isFinite(marketCap) || marketCap <= 0) {
      throw new Error(`Invalid market cap for CoinMarketCap ID ${seedSnapshot.coinMarketCapId}`)
    }
    if (typeof quote.last_updated !== 'string' || !Number.isFinite(Date.parse(quote.last_updated))) {
      throw new Error(`Invalid quote timestamp for CoinMarketCap ID ${seedSnapshot.coinMarketCapId}`)
    }
    quoteTimestamps.push(quote.last_updated)

    return {
      candidateId: seedSnapshot.candidateId,
      coinMarketCapId: seedSnapshot.coinMarketCapId,
      circulatingMarketCapUsd: marketCap,
    }
  })

  const asOfTimestamp = quoteTimestamps.sort((a, b) => Date.parse(a) - Date.parse(b))[0]
  if (!asOfTimestamp) throw new Error('CoinMarketCap response has no valid timestamp')
  const quoteTime = Date.parse(asOfTimestamp)
  if (quoteTime < currentTime - 6 * 60 * 60 * 1000) {
    throw new Error('CoinMarketCap quotes are more than six hours old')
  }
  if (quoteTime > currentTime + 10 * 60 * 1000) {
    throw new Error('CoinMarketCap quotes are unexpectedly in the future')
  }

  return {
    schemaVersion: 1,
    provider: 'coinmarketcap',
    asOfTimestamp: new Date(asOfTimestamp).toISOString(),
    snapshots,
  }
}

class NonRetryableHttpError extends Error {}

export async function fetchJsonWithRetry(url, options = {}) {
  const {
    attempts = 5,
    fetchImpl = fetch,
    wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds)),
    timeoutMs = 20_000,
  } = options
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (response.ok) return await response.json()
      const error = new Error(`CoinMarketCap request failed with HTTP ${response.status}`)
      if (response.status !== 429 && response.status < 500) {
        throw new NonRetryableHttpError(error.message)
      }
      lastError = error
    } catch (error) {
      if (error instanceof NonRetryableHttpError) throw error
      lastError = error
    }

    if (attempt < attempts - 1) {
      await wait(2 ** attempt * 1000)
    }
  }
  throw lastError ?? new Error('CoinMarketCap request failed')
}

export async function updateMarketCaps() {
  const seed = JSON.parse(await readFile(payloadPath, 'utf8'))
  const validatedSeed = assertSeedPayload(seed)
  const ids = validatedSeed.snapshots.map((value) => asRecord(value)?.coinMarketCapId)
  if (ids.some((id) => !Number.isInteger(id))) throw new Error('Seed payload contains an invalid CMC ID')

  const url = new URL(endpoint)
  url.searchParams.set('id', ids.join(','))
  url.searchParams.set('convert', 'USD')
  url.searchParams.set('include_market_cap', 'true')
  url.searchParams.set('include_last_updated', 'true')
  url.searchParams.set('skip_invalid', 'false')

  const response = await fetchJsonWithRetry(url)
  const payload = buildMarketCapPayload(seed, response)
  await writeFile(temporaryPayloadPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  await rename(temporaryPayloadPath, payloadPath)
  console.log(`Updated ${payload.snapshots.length} CMC market caps at ${payload.asOfTimestamp}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  updateMarketCaps().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
