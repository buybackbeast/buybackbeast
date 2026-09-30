import type {
  BuybackDestination,
  EvidenceLevel,
  ProgramStatus,
} from '../lib'

export interface ResearchCandidate {
  id: string
  name: string
  symbol: string
  mechanismLabel: string
  mechanismSummary: string
  mechanismTooltip: string
  buybackDestination: BuybackDestination
  evidenceLevel: EvidenceLevel
  programStatus: ProgramStatus
  verifiedOn: string
  recurringEvidence: string
  excludedOneOff: string
  releaseCaveat: string
  sources: readonly {
    label: string
    url: string
  }[]
}

/**
 * Mechanism-qualified research leads. These records intentionally contain no
 * rankable market-cap, capture, unlock, or emissions inputs.
 */
export const RESEARCH_CANDIDATES = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    mechanismLabel: 'Protocol fee-funded burn-to-claim',
    mechanismSummary:
      'Protocol fees accrue in TokenJar contracts. A permissionless caller burns a threshold amount of UNI through the configured releaser to withdraw eligible accumulated fee assets.',
    mechanismTooltip:
      'Protocol fees collect in TokenJar. Anyone can burn the required UNI to claim the eligible fee assets, permanently removing that UNI from supply.',
    buybackDestination: 'burn',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'In a July 18, 2026 update, Uniswap Labs reported that protocol fees had funded about 7.5M UNI (about $25.6M) of burns since fee activation in late December 2025.',
    excludedOneOff:
      'The 100M UNI retroactive treasury burn is non-recurring and must remain outside the recurring score.',
    releaseCaveat:
      'DefiLlama marks the original UNI allocation vesting 100% unlocked. At the September 30 snapshot, the separate growth-budget contract still had a 5M UNI quarterly amount and 25M UNI allowance. Its allowance can be revoked, so scheduled tranches are forward pressure, not guaranteed sales.',
    sources: [
      {
        label: 'Executed UNIfication proposal',
        url: 'https://vote.uniswapfoundation.org/proposals/93',
      },
      {
        label: 'Protocol fee mechanics',
        url: 'https://developers.uniswap.org/docs/protocols/protocol-fee/overview',
      },
      {
        label: 'Executed v4 fee activation',
        url: 'https://vote.uniswapfoundation.org/proposals/100',
      },
      {
        label: 'July 2026 burn disclosure',
        url: 'https://gov.uniswap.org/t/temp-check-activate-v4-protocol-fees/26162',
      },
      {
        label: 'Uniswap Labs UNI burn tracker',
        url: 'https://dune.com/uniswaplabs/uni-burn-tracker-l1l2',
      },
      {
        label: 'DUNI year-end financial statement',
        url: 'https://vote.uniswapfoundation.org/forums/7/duni-q4-and-year-end-2025-financial-statements-and-tax-update',
      },
      {
        label: 'UNIVesting contract',
        url: 'https://github.com/Uniswap/protocol-fees/blob/main/src/UNIVesting.sol',
      },
      {
        label: 'DefiLlama UNI unlock schedule',
        url: 'https://defillama.com/unlocks/uniswap',
      },
      {
        label: 'Official UNI token supply documentation',
        url: 'https://developers.uniswap.org/docs/ecosystem/governance/uni',
      },
    ],
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    symbol: 'HYPE',
    mechanismLabel: 'Automated fee buyback and burn',
    mechanismSummary:
      'The Assistance Fund automatically converts Hyperliquid trading fees into HYPE as part of L1 execution, then burns the acquired HYPE from circulating and total supply.',
    mechanismTooltip:
      'Trading fees are automatically converted into HYPE by the Assistance Fund. The purchased HYPE is permanently burned.',
    buybackDestination: 'burn',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Official documentation identifies the system Assistance Fund address and describes the conversion and permanent burn as fully automated.',
    excludedOneOff:
      'Count the fee-funded purchase and subsequent burn once. HyperEVM gas burns are a separate stream and must not be duplicated.',
    releaseCaveat:
      'Staking rewards come from the future-emissions reserve, and contributor or community releases must be included in forward pressure.',
    sources: [
      {
        label: 'Official trading fee mechanics',
        url: 'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees',
      },
      {
        label: 'Official HYPE staking emissions',
        url: 'https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/staking',
      },
      {
        label: 'HyperEVM fee burns',
        url: 'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm',
      },
    ],
  },
  {
    id: 'pump-fun',
    name: 'Pump.fun',
    symbol: 'PUMP',
    mechanismLabel: 'Daily revenue buyback and burn',
    mechanismSummary:
      'Pump.fun uses qualifying platform revenue for daily open-market PUMP purchases and permanently burns the acquired tokens.',
    mechanismTooltip:
      'Qualifying platform revenue funds daily open-market PUMP purchases. Every purchased token is permanently burned.',
    buybackDestination: 'burn',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'The official dashboard showed 443 daily records by September 30, including 187.1M PUMP burned with 8.5K SOL on September 29.',
    excludedOneOff:
      'The dashboard notes that custom-pair revenue and buybacks may not be fully reflected, so do not extrapolate missing activity.',
    releaseCaveat:
      'The 50% qualifying-revenue commitment is locked for one year from April 28, 2026. The official page does not provide a complete release schedule for the gap between circulating and total supply.',
    sources: [
      {
        label: 'Official PUMP dashboard and token page',
        url: 'https://pump.fun/pump-token',
      },
      {
        label: 'April 28 revenue commitment',
        url: 'https://pump.fun/docs/april-28-announcement',
      },
    ],
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    symbol: 'CAKE',
    mechanismLabel: 'Protocol revenue buyback and burn',
    mechanismSummary:
      'Trading and product fees fund recurring CAKE buybacks and burns. Tokenomics 3.0 redirected the prior v3 revenue-share allocation into burns.',
    mechanismTooltip:
      'Trading and product fees fund recurring CAKE purchases and burns. The former v3 revenue share is also directed into burns.',
    buybackDestination: 'burn',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'The August 2026 report showed 2,746,334 CAKE burned against 674,316 minted, the 36th consecutive month of net supply reduction.',
    excludedOneOff:
      'Use only fee-funded executed purchases for capture. Do not count gross token burns again or treat net supply change as cash flow.',
    releaseCaveat:
      'CAKE continues minting for farms, products, and ecosystem incentives. Gross burn must be measured alongside emissions even under the 400M maximum supply.',
    sources: [
      {
        label: 'CAKE Tokenomics 3.0 implementation',
        url: 'https://blog.pancakeswap.finance/articles/implementation-of-cake-tokenomics-3-0-what-you-need-to-know',
      },
      {
        label: 'August 2026 burn report',
        url: 'https://blog.pancakeswap.finance/articles/august-cake-burn-report',
      },
      {
        label: 'Official CAKE burn dashboard',
        url: 'https://pancakeswap.finance/burn-dashboard',
      },
    ],
  },
  {
    id: 'injective',
    name: 'Injective',
    symbol: 'INJ',
    mechanismLabel: 'Revenue basket buyback and burn',
    mechanismSummary:
      'The monthly Community BuyBack lets participants commit INJ for a pro-rata basket of ecosystem revenue. The committed INJ is permanently burned.',
    mechanismTooltip:
      'Users commit INJ for a share of a monthly basket of protocol revenue assets. The committed INJ is permanently burned.',
    buybackDestination: 'burn',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Injective reported four completed rounds by March 10, 2026, with 178,338.03 INJ burned and $776,344.28 of revenue assets distributed.',
    excludedOneOff:
      'Do not count both the revenue basket distributed and the corresponding INJ burn as separate capture.',
    releaseCaveat:
      'Continuing staking issuance is the material release pressure. IIP-617 reduces new issuance but does not eliminate it.',
    sources: [
      {
        label: 'Community BuyBack guide',
        url: 'https://injective.com/blog/2026-injective-community-buy-back-guide',
      },
      {
        label: 'September 2026 program update',
        url: 'https://injective.com/blog/introducing-injective-stockdrop-a-new-age-of-tokenized-stocks-onchain',
      },
      {
        label: 'INJ Supply Squeeze',
        url: 'https://injective.com/blog/introducing-the-inj-supply-squeeze',
      },
    ],
  },
  {
    id: 'lighter',
    name: 'Lighter',
    symbol: 'LIT',
    mechanismLabel: 'Daily fee-funded TWAP buyback',
    mechanismSummary:
      'Trading-fee revenue funds programmatic LIT purchases through daily 24-hour TWAPs. Official material does not describe the repurchased tokens as burned.',
    mechanismTooltip:
      'Trading-fee revenue funds daily 24-hour TWAP purchases of LIT. The repurchased tokens are not confirmed as burned.',
    buybackDestination: 'treasury',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Lighter reported on September 11, 2026 that 17.5M LIT had been programmatically repurchased since TGE.',
    excludedOneOff:
      'Treasury-held LIT is not a burn and receives the default zero destination factor until its final disposition is verified.',
    releaseCaveat:
      'Team and investor allocations have a one-year cliff followed by three-year linear vesting. The cliff is near December 2026.',
    sources: [
      {
        label: 'LIT utility and buyback mechanics',
        url: 'https://docs.lighter.xyz/about-lighter/lit-utility',
      },
      {
        label: 'Official September buyback update',
        url: 'https://tg.me/lighter_announcements/432',
      },
      {
        label: 'Official allocation and vesting post',
        url: 'https://x.com/Lighter_xyz/status/2005862687331303804',
      },
    ],
  },
  {
    id: 'aster',
    name: 'Aster',
    symbol: 'ASTER',
    mechanismLabel: '99% fee buyback and staker distribution',
    mechanismSummary:
      'Aster uses 99% of daily fees for TWAP purchases distributed to veASTER stakers and separately burns an equal amount from reserves on a biweekly cycle.',
    mechanismTooltip:
      'Aster uses 99% of daily fees to buy ASTER for veASTER stakers, then separately burns an equal amount of reserve tokens every two weeks.',
    buybackDestination: 'recycled',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'For September 7 to 21, 2026, Aster reported 4,166,388.85 ASTER bought for stakers and the same reserve amount burned.',
    excludedOneOff:
      'The matching reserve burn is non-cash supply reduction. Do not add it to the fee-funded staker distribution in the same score.',
    releaseCaveat:
      'Airdrop supply releases over 80 months. Team vesting starts after a September 2026 cliff at 10M ASTER per month for 40 months.',
    sources: [
      {
        label: 'ASTER tokenomics',
        url: 'https://docs.asterdex.com/usdaster-token/tokenomics',
      },
      {
        label: 'September 7-21 execution report',
        url: 'https://x.com/Aster_DEX/status/2101932486364455037',
      },
      {
        label: 'August 24-September 7 execution report',
        url: 'https://x.com/Aster_DEX/status/2096881611241566594',
      },
    ],
  },
  {
    id: 'sky',
    name: 'Sky',
    symbol: 'SKY',
    mechanismLabel: 'Surplus buyback and staker distribution',
    mechanismSummary:
      'The Smart Burn Engine deploys protocol surplus into open-market SKY purchases. August 2026 parameters route 55% of each cycle to buybacks and 45% as USDS to lsSKY stakers.',
    mechanismTooltip:
      'Protocol surplus funds open-market SKY purchases. Current parameters route 55% to the buyback flow and 45% as USDS rewards to lsSKY stakers.',
    buybackDestination: 'burn',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'The SBE BEAM runs a recurring monthly settlement cycle under current governance parameters, with a 350M USDS annual-rate guardrail.',
    excludedOneOff:
      'Migration-offset and one-time treasury burns stay outside recurring capture. Governance can change the 55/45 allocation.',
    releaseCaveat:
      'New SKY emissions are disabled under current documentation, but MKR-to-SKY migration remains open under a rising delayed-upgrade penalty.',
    sources: [
      {
        label: 'Understanding the SKY token',
        url: 'https://sky.money/blog/understanding-the-sky-token',
      },
      {
        label: 'August 2026 SBE executive vote',
        url: 'https://vote.sky.money/executive/template-executive-vote-initialize-sbe-beam-monthly-settlement-cycle-for-july-2026-lssky-sky-rewards-normalization-increase-buybacks-and-reactivate-lssky-usds-farm-adjust-grove-and-osero-dc-iam-parameters-rename-osero-chainlog-keys-update-safe-harbor-agreement-prime-agent-proxy-spells-august-13-2026',
      },
      {
        label: 'Official MKR to SKY upgrade portal',
        url: 'https://upgrademkrtosky.sky.money/',
      },
    ],
  },
  {
    id: 'pendle',
    name: 'Pendle',
    symbol: 'PENDLE',
    mechanismLabel: '80% fee buyback for sPENDLE',
    mechanismSummary:
      'Eighty percent of retained V2 swap and YT fees funds biweekly PENDLE purchases, executed through one-hour TWAPs and distributed to active sPENDLE holders.',
    mechanismTooltip:
      'Eighty percent of retained swap and yield-token fees buys PENDLE every two weeks and distributes it to active sPENDLE holders.',
    buybackDestination: 'recycled',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Official documentation publishes the buyback contract and the biweekly fee-harvest, one-week execution, and distribution cadence.',
    excludedOneOff:
      'Points and airdrops distributed in kind are not fee-funded capture. Do not count gross fees and the resulting purchased-token distribution twice.',
    releaseCaveat:
      'Team and investor vesting completed in September 2024. Tokenomics specifies terminal 2% annual incentive inflation from April 2026, subject to governance.',
    sources: [
      {
        label: 'sPENDLE mechanism',
        url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Mechanisms/sPENDLE',
      },
      {
        label: 'Protocol fee routing',
        url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Mechanisms/Fees',
      },
      {
        label: 'PENDLE tokenomics',
        url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Mechanisms/Tokenomics',
      },
    ],
  },
  {
    id: 'banana-gun',
    name: 'Banana Gun',
    symbol: 'BANANA',
    mechanismLabel: '40% bot-revenue holder distribution',
    mechanismSummary:
      'Forty percent of bot revenue after referrals is distributed to eligible BANANA holders. EVM claims can be ETH or market-bought BANANA, while Solana claims are SOL.',
    mechanismTooltip:
      'Forty percent of bot revenue after referrals goes to eligible BANANA holders, paid in ETH, bought-back BANANA, or SOL depending on the network.',
    buybackDestination: 'recycled',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Official documentation and weekly reports describe the active claim flow and recurring 40% holder allocation.',
    excludedOneOff:
      'The historical 1.1M BANANA burn and Banana Credits utility burns are not part of the recurring revenue-share flow.',
    releaseCaveat:
      'Treasury and team allocations remain a source of releases, while Banana Bonus emissions use treasury tokens under an adjustable multiplier.',
    sources: [
      {
        label: 'BANANA holder rewards',
        url: 'https://docs.bananagun.io/banana-token/rewards',
      },
      {
        label: 'BANANA tokenomics',
        url: 'https://docs.bananagun.io/banana-token/tokenomics',
      },
      {
        label: 'September 2026 official product update',
        url: 'https://blog.bananagun.io/blog/token-discovery-tools-what-are-they',
      },
    ],
  },
  {
    id: 'beefy',
    name: 'Beefy Finance',
    symbol: 'BIFI',
    mechanismLabel: 'Vault-fee buyback and staker distribution',
    mechanismSummary:
      'A share of vault revenue funds holder incentives. BIFI Maxi buys BIFI and compounds it for stakers, while the alternative BIFI Pool can distribute ETH.',
    mechanismTooltip:
      'A share of vault revenue rewards holders. One pool buys and compounds BIFI, while the alternative pool can distribute ETH.',
    buybackDestination: 'recycled',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'The official API exposes daily chain-level buyback token and USD amounts, while protocol docs describe the active staker incentive flow.',
    excludedOneOff:
      'The separate BIP-99 discretionary fair-value buyback authority has no verified execution here and is excluded from recurring capture.',
    releaseCaveat:
      'BIFI has a fixed 80,000 supply, no mint or burn functions, and was fully distributed by July 2022. Treasury-held tokens can still recirculate through governance.',
    sources: [
      {
        label: 'BIFI token and holder incentives',
        url: 'https://docs.beefy.finance/ecosystem/bifi-token',
      },
      {
        label: 'Beefy protocol revenue routing',
        url: 'https://docs.beefy.finance/ecosystem/protocol',
      },
      {
        label: 'Official Beefy API',
        url: 'https://docs.beefy.finance/developer-documentation/beefy-api',
      },
    ],
  },
  {
    id: 'dydx',
    name: 'dYdX',
    symbol: 'DYDX',
    mechanismLabel: '75% net-fee buyback and stake',
    mechanismSummary:
      'The active governance program allocates 75% of net protocol fees to recurring open-market DYDX purchases, then stakes the acquired tokens to validators.',
    mechanismTooltip:
      'Seventy-five percent of net protocol fees funds recurring DYDX purchases. The DAO then stakes the acquired tokens to validators.',
    buybackDestination: 'treasury',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'The August 2026 Treasury SubDAO report recorded 1,152,868 DYDX bought across 4,208 orders for 128,016.09 USDT, with purchases continuing in September.',
    excludedOneOff:
      'Staked tokens are DAO-controlled and could later be unstaked or redeployed. They are not burned.',
    releaseCaveat:
      'Original Community Treasury vesting ended in August 2026, but governance can enact annual inflation, so actual minting must be verified before entering zero.',
    sources: [
      {
        label: 'Official dYdX buyback tracker',
        url: 'https://buyback.dydx.trade/',
      },
      {
        label: 'August 2026 Treasury SubDAO report',
        url: 'https://dydx.forum/t/dydx-treasury-subdao-community-update-august-2026/5151',
      },
      {
        label: 'DYDX token allocation',
        url: 'https://docs.dydx.community/dydx/start-here/dydx-token-allocation',
      },
    ],
  },
  {
    id: 'gmx',
    name: 'GMX',
    symbol: 'GMX',
    mechanismLabel: '27% fee buyback to treasury',
    mechanismSummary:
      'Twenty-seven percent of protocol fees funds open-market GMX purchases. Rewards distribution is currently suspended, so acquired GMX accumulates in the treasury.',
    mechanismTooltip:
      'Twenty-seven percent of protocol fees buys GMX on the market. With rewards paused, the purchased GMX currently accumulates in the treasury.',
    buybackDestination: 'treasury',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Official updates reported more than 2M GMX repurchased through March 4, 2026 and another 168,500 GMX purchased after March 5 by the May update.',
    excludedOneOff:
      'The contingent plan to distribute treasury GMX to stakers is not current holder capture and must not be counted before execution.',
    releaseCaveat:
      'Existing esGMX converts into GMX over 365 days. Minting above the forecast 13.25M maximum requires governance.',
    sources: [
      {
        label: 'GMX tokenomics',
        url: 'https://docs.gmx.io/docs/tokenomics/gmx-token/',
      },
      {
        label: 'GMX rewards and buyback treatment',
        url: 'https://docs.gmx.io/docs/tokenomics/rewards/',
      },
      {
        label: 'Official weekly statistics API',
        url: 'https://docs.gmx.io/docs/api/gmx-api/get-weekly-stats/',
      },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    symbol: 'JUP',
    mechanismLabel: 'Revenue-funded Litterbox buyback',
    mechanismSummary:
      'Fifty percent of protocol revenue funds daily open-market JUP purchases that accumulate in the Litterbox Trust. Current purchases are not automatically burned.',
    mechanismTooltip:
      'Fifty percent of protocol revenue funds daily JUP purchases held in the Litterbox Trust. Current purchases are not automatically burned.',
    buybackDestination: 'treasury',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'The official feed reported 8,504,064 JUP added during September 2026 and 173,128,517 JUP accumulated in total by September 30.',
    excludedOneOff:
      'A historical burn of roughly 135M Litterbox JUP is not evidence that current purchases are burned. Proposed 70% buyback-and-burn changes are also excluded.',
    releaseCaveat:
      'ASR continues at 50M JUP per quarter from already circulating unclaimed tokens, while team and community schedules remain governance-sensitive.',
    sources: [
      {
        label: 'Net-Zero Emissions proposal',
        url: 'https://discuss.jup.ag/t/proposal-net-zero-emissions/39948',
      },
      {
        label: 'Token Transparency Framework',
        url: 'https://impressive-horses-5641a8b530.media.strapiapp.com/Jupiter_Token_Transparency_Framework_Q2_2025_6351fa32d7.pdf',
      },
      {
        label: 'Official Litterbox feed',
        url: 'https://x.com/litterboxtrust',
      },
    ],
  },
  {
    id: 'raydium',
    name: 'Raydium',
    symbol: 'RAY',
    mechanismLabel: '12% trading-fee buyback',
    mechanismSummary:
      'Supported Raydium pools route 12% of trading fees to recurring RAY purchases. Acquired tokens remain in the disclosed buyback holding wallet rather than being burned.',
    mechanismTooltip:
      'Supported pools direct 12% of trading fees to recurring RAY purchases. The tokens remain in a disclosed holding wallet and are not burned.',
    buybackDestination: 'treasury',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Official documentation exposes the collection accounts and public holding wallet so recurring buyback transactions can be audited onchain.',
    excludedOneOff:
      'Wallet accumulation is not permanent supply removal and receives the default zero treasury destination factor.',
    releaseCaveat:
      'Team and seed vesting completed in February 2024, but the mining reserve continues to emit roughly 1.9M RAY annually.',
    sources: [
      {
        label: 'RAY buybacks',
        url: 'https://docs.raydium.io/ray/ray-buybacks',
      },
      {
        label: 'Protocol fee routing',
        url: 'https://docs.raydium.io/ray/protocol-fees',
      },
      {
        label: 'RAY token details',
        url: 'https://docs.raydium.io/ray',
      },
    ],
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    mechanismLabel: 'Revenue-funded strategic reserve',
    mechanismSummary:
      'Payment Abstraction converts onchain service fees and offchain enterprise revenue into LINK held by the Chainlink Reserve. It is not a burn or holder distribution.',
    mechanismTooltip:
      'Service fees and enterprise revenue are converted into LINK for the Chainlink Reserve. The LINK is neither burned nor distributed to holders.',
    buybackDestination: 'treasury',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'Chainlink reported more than 1.44M LINK accumulated in Q2 2026 and more than 4.5M LINK held by the reserve in total.',
    excludedOneOff:
      'Reserve balances remain protocol-controlled and receive the default zero treasury destination factor despite a multi-day withdrawal timelock.',
    releaseCaveat:
      'Supply is capped at 1B LINK, but the official circulating-supply page states a current release schedule of 7% of total supply per year.',
    sources: [
      {
        label: 'Q2 2026 quarterly review',
        url: 'https://chain.link/blog/quarterly-review-q2-2026',
      },
      {
        label: 'Chainlink Reserve launch',
        url: 'https://chain.link/blog/chainlink-reserve-strategic-link-reserve',
      },
      {
        label: 'Official circulating supply schedule',
        url: 'https://chain.link/circulating-supply',
      },
    ],
  },
  {
    id: 'maple-finance',
    name: 'Maple Finance',
    symbol: 'SYRUP',
    mechanismLabel: 'Revenue-scaled monthly buyback',
    mechanismSummary:
      'MIP-021 scales monthly SYRUP purchases to 10%, 20%, or 30% of net revenue depending on the revenue tier. Acquired tokens remain in the Syrup Strategic Fund.',
    mechanismTooltip:
      'Monthly SYRUP purchases use 10%, 20%, or 30% of net revenue depending on the revenue tier, then remain in the Strategic Fund.',
    buybackDestination: 'treasury',
    evidenceLevel: 'official',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'The official transparency table reports $136,768 of July 2026 purchases and $147,098 of August purchases under the active framework.',
    excludedOneOff:
      'SSF holdings are not burned and may be redeployed for liquidity, growth, or strategic activity. Do not count the total fund balance as period capture.',
    releaseCaveat:
      'Final legacy MIP-009 and MIP-010 issuance runs through October 2026, while repurchased SSF tokens may later return to circulation.',
    sources: [
      {
        label: 'MIP-021 revenue-scaled buyback',
        url: 'https://community.maple.finance/t/mip-021-a-rules-based-buyback-that-scales-with-revenue/1153',
      },
      {
        label: 'Official Maple transparency table',
        url: 'https://maple.finance/transparency',
      },
      {
        label: 'MIP-010 SYRUP issuance',
        url: 'https://community.maple.finance/t/mip-010-syrup-token-launch-and-mpl-syrup-conversion/334',
      },
    ],
  },
  {
    id: 'cow-protocol',
    name: 'CoW Protocol',
    symbol: 'COW',
    mechanismLabel: 'Revenue buyback against solver emissions',
    mechanismSummary:
      'Weekly revenue-funded TWAP purchases target 120% of weekly COW solver rewards. Bought tokens remain in DAO-controlled safes and can fund later solver payouts.',
    mechanismTooltip:
      'Weekly revenue-funded purchases target 120% of solver reward emissions. The COW remains DAO-controlled and may fund future rewards.',
    buybackDestination: 'recycled',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    verifiedOn: '2026-09-30',
    recurringEvidence:
      'By May 8, 2026, CoW DAO reported 78,616,859 COW bought versus 66,588,732 COW of solver emissions since the program began.',
    excludedOneOff:
      'The proposed 60M to 85M COW burn trial and flexible future mandate are not executed and remain outside current capture.',
    releaseCaveat:
      'Solver rewards, team compensation, and grants continue to emit COW. The current target offsets solver emissions, not necessarily every DAO release.',
    sources: [
      {
        label: 'CoW value-distribution review',
        url: 'https://forum.cow.fi/t/cow-daos-path-to-value-distribution-core-team-view/3454',
      },
      {
        label: 'One year of executed COW buybacks',
        url: 'https://forum.cow.fi/t/cow-token-buyback-an-update-on-1-year-of-execution/3168',
      },
      {
        label: 'May 2026 CoW DAO recap',
        url: 'https://forum.cow.fi/t/cow-dao-monthly-recap-may-2026/3463',
      },
    ],
  },
] as const satisfies readonly ResearchCandidate[]
