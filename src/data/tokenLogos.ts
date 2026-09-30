export interface TokenLogoIdentity {
  id?: string
  name?: string
  symbol: string
}

export interface TokenLogoEntry {
  id: string
  name: string
  symbol: string
  url: string
}

/**
 * Project-matched token artwork for the research universe.
 *
 * The image URLs were verified against the corresponding CoinMarketCap,
 * CoinGecko, or project media entry on 2026-09-30. Keeping identity data next
 * to each URL prevents colliding symbols from becoming the primary lookup.
 */
export const TOKEN_LOGOS: readonly TokenLogoEntry[] = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    symbol: 'HYPE',
    url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32196.png',
  },
  {
    id: 'pump-fun',
    name: 'Pump.fun',
    symbol: 'PUMP',
    url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36507.png',
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    symbol: 'CAKE',
    url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png',
  },
  {
    id: 'injective',
    name: 'Injective',
    symbol: 'INJ',
    url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7226.png',
  },
  {
    id: 'lighter',
    name: 'Lighter',
    symbol: 'LIT',
    url: 'https://coin-images.coingecko.com/coins/images/71121/large/lighter.png?1765888098',
  },
  {
    id: 'aster',
    name: 'Aster',
    symbol: 'ASTER',
    url: 'https://coin-images.coingecko.com/coins/images/69040/large/_ASTER.png?1757326782',
  },
  {
    id: 'sky',
    name: 'Sky',
    symbol: 'SKY',
    url: 'https://coin-images.coingecko.com/coins/images/39925/large/sky.jpg?1724827980',
  },
  {
    id: 'pendle',
    name: 'Pendle',
    symbol: 'PENDLE',
    url: 'https://coin-images.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png?1696514728',
  },
  {
    id: 'banana-gun',
    name: 'Banana Gun',
    symbol: 'BANANA',
    url: 'https://coin-images.coingecko.com/coins/images/31744/large/bg-logo-coingecko-200.png?1716971024',
  },
  {
    id: 'beefy',
    name: 'Beefy Finance',
    symbol: 'BIFI',
    url: 'https://beefy.com/d3a65a4f7107d2039fc05b7b775cd8d1.png',
  },
  {
    id: 'dydx',
    name: 'dYdX',
    symbol: 'DYDX',
    url: 'https://assets.coingecko.com/coins/images/32594/standard/dydx.png?1698673495=',
  },
  {
    id: 'gmx',
    name: 'GMX',
    symbol: 'GMX',
    url: 'https://assets.coingecko.com/coins/images/18323/standard/arbit.png?1696517814=',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    symbol: 'JUP',
    url: 'https://assets.coingecko.com/coins/images/34188/standard/jup.png?1704266489=',
  },
  {
    id: 'raydium',
    name: 'Raydium',
    symbol: 'RAY',
    url: 'https://assets.coingecko.com/coins/images/13928/standard/PSigc4ie_400x400.jpg?1696513668=',
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    url: 'https://coin-images.coingecko.com/coins/images/877/large/Chainlink_Logo_500.png?1760023405',
  },
  {
    id: 'maple-finance',
    name: 'Maple Finance',
    symbol: 'SYRUP',
    url: 'https://coin-images.coingecko.com/coins/images/51232/large/_syrup_token_logo.png?1747292046',
  },
  {
    id: 'cow-protocol',
    name: 'CoW Protocol',
    symbol: 'COW',
    url: 'https://coin-images.coingecko.com/coins/images/24384/large/CoW-token_logo.png?1719524382',
  },
]

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

const logosById = new Map(TOKEN_LOGOS.map((logo) => [normalize(logo.id), logo]))
const logosByIdentity = new Map(TOKEN_LOGOS.map((logo) => [`${normalize(logo.name)}:${normalize(logo.symbol)}`, logo]))
const logosBySymbol = new Map(TOKEN_LOGOS.map((logo) => [normalize(logo.symbol), logo]))

export function getTokenLogoUrl({ id, name, symbol }: TokenLogoIdentity): string | undefined {
  const idMatch = id ? logosById.get(normalize(id)) : undefined
  if (idMatch) return idMatch.url

  const identityMatch = name
    ? logosByIdentity.get(`${normalize(name)}:${normalize(symbol)}`)
    : undefined
  if (identityMatch) return identityMatch.url

  return logosBySymbol.get(normalize(symbol))?.url
}
