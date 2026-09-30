import { describe, expect, it, vi } from 'vitest'

import { buildMarketCapPayload, fetchJsonWithRetry } from './update-market-caps.mjs'

const seed = {
  schemaVersion: 1,
  provider: 'coinmarketcap',
  asOfTimestamp: '2026-09-30T18:59:00Z',
  snapshots: [
    { candidateId: 'uniswap', coinMarketCapId: 7083, circulatingMarketCapUsd: 1 },
    { candidateId: 'hyperliquid', coinMarketCapId: 32196, circulatingMarketCapUsd: 1 },
  ],
}

function response() {
  return {
    data: [
      {
        id: 7083,
        quotes: [{ symbol: 'USD', market_cap: 5_500_000_000, last_updated: '2026-10-01T02:16:30Z' }],
      },
      {
        id: 32196,
        quotes: [{ symbol: 'USD', market_cap: 22_500_000_000, last_updated: '2026-10-01T02:16:31Z' }],
      },
    ],
    status: {
      timestamp: '2026-10-01T02:17:00Z',
      error_code: 0,
      error_message: '',
    },
  }
}

const responseTime = Date.parse('2026-10-01T02:17:00Z')

describe('hourly CoinMarketCap payload builder', () => {
  it('maps every CMC ID and uses the oldest underlying quote timestamp', () => {
    expect(buildMarketCapPayload(seed, response(), responseTime)).toEqual({
      schemaVersion: 1,
      provider: 'coinmarketcap',
      asOfTimestamp: '2026-10-01T02:16:30.000Z',
      snapshots: [
        { candidateId: 'uniswap', coinMarketCapId: 7083, circulatingMarketCapUsd: 5_500_000_000 },
        { candidateId: 'hyperliquid', coinMarketCapId: 32196, circulatingMarketCapUsd: 22_500_000_000 },
      ],
    })
  })

  it('fails closed when an asset is omitted or has an invalid market cap', () => {
    const omitted = response()
    omitted.data.pop()
    expect(() => buildMarketCapPayload(seed, omitted, responseTime)).toThrow(/omitted ID 32196/)

    const invalid = response()
    invalid.data[0].quotes[0].market_cap = 0
    expect(() => buildMarketCapPayload(seed, invalid, responseTime)).toThrow(/Invalid market cap/)
  })

  it('fails closed on an API error envelope', () => {
    const failed = response()
    failed.status.error_code = 429
    failed.status.error_message = 'rate limited'
    expect(() => buildMarketCapPayload(seed, failed, responseTime)).toThrow(/rate limited/)
  })

  it('rejects stale or future quote timestamps', () => {
    expect(() => buildMarketCapPayload(
      seed,
      response(),
      Date.parse('2026-10-01T09:00:00Z'),
    )).toThrow(/more than six hours old/)

    expect(() => buildMarketCapPayload(
      seed,
      response(),
      Date.parse('2026-10-01T02:00:00Z'),
    )).toThrow(/unexpectedly in the future/)
  })

  it('does not retry a non-retryable 4xx response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400 })
    await expect(fetchJsonWithRetry('https://example.test', {
      attempts: 3,
      fetchImpl,
      wait: vi.fn(),
    })).rejects.toThrow(/HTTP 400/)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('retries rate limits and malformed successful responses', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new Error('bad json') } })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: [] }) })
    const wait = vi.fn().mockResolvedValue(undefined)

    await expect(fetchJsonWithRetry('https://example.test', {
      attempts: 3,
      fetchImpl,
      wait,
    })).resolves.toEqual({ data: [] })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(wait).toHaveBeenCalledTimes(2)
  })
})
