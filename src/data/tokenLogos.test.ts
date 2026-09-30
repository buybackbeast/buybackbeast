import { describe, expect, it } from 'vitest'

import { RESEARCH_CANDIDATES } from './researchCandidates'
import { getTokenLogoUrl, TOKEN_LOGOS } from './tokenLogos'

describe('token logos', () => {
  it('covers every tracked research candidate', () => {
    for (const candidate of RESEARCH_CANDIDATES) {
      expect(getTokenLogoUrl(candidate), candidate.symbol).toMatch(/^https:\/\//)
    }
  })

  it('keeps logo identities and URLs unique', () => {
    expect(new Set(TOKEN_LOGOS.map((logo) => logo.id)).size).toBe(TOKEN_LOGOS.length)
    expect(new Set(TOKEN_LOGOS.map((logo) => logo.symbol)).size).toBe(TOKEN_LOGOS.length)
    expect(new Set(TOKEN_LOGOS.map((logo) => logo.url)).size).toBe(TOKEN_LOGOS.length)
  })

  it('resolves known symbols for imported ranking rows', () => {
    expect(getTokenLogoUrl({ name: 'Uniswap', symbol: 'uni' })).toContain('/7083.png')
  })

  it('leaves unknown tokens to the monogram fallback', () => {
    expect(getTokenLogoUrl({ name: 'Example token', symbol: 'NEW' })).toBeUndefined()
  })
})
