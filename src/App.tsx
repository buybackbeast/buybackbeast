import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  Edit3,
  FileJson,
  FileSpreadsheet,
  Gauge,
  Info,
  Layers3,
  Plus,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  BUYBACK_DESTINATIONS,
  DEFAULT_ADJUSTMENT_FACTORS,
  EVIDENCE_LEVELS,
  PROGRAM_STATUSES,
  RELEASE_HORIZONS,
  calculateTokenMetrics,
  parseAdjustmentFactors,
  parseReleaseHorizonDays,
  parseTokenInputs,
  rankTokens,
  type AdjustmentFactors,
  type BuybackDestination,
  type EvidenceLevel,
  type ProgramStatus,
  type RankedToken,
  type ReleaseHorizonDays,
  type TokenMetrics,
  type TokenValueCaptureInput,
} from './lib'

type Drawer = 'token' | 'methodology' | 'factors' | 'import' | null
type DatasetType = 'illustrative' | 'custom'
type SortKey =
  | 'rank'
  | 'token'
  | 'effectiveCapture'
  | 'releasePressure'
  | 'grossYield'
  | 'netYield'
  | 'coverage'
type SortDirection = 'asc' | 'desc'

interface StoredState {
  version: 2
  datasetType: DatasetType
  tokens: TokenValueCaptureInput[]
  factors: AdjustmentFactors
  releaseHorizonDays: ReleaseHorizonDays
}

interface StoredStateInput {
  version?: unknown
  datasetType?: unknown
  tokens?: unknown
  factors?: unknown
  releaseHorizonDays?: unknown
}

interface SortState {
  key: SortKey
  direction: SortDirection
}

const STORAGE_KEY = 'valuebeast:v2'
const LEGACY_STORAGE_KEY = 'valuebeast:v1'

const SAMPLE_TOKENS: TokenValueCaptureInput[] = [
  {
    id: 'sample-atlas',
    name: 'Atlas Protocol',
    symbol: 'ATL',
    circulatingMarketCapUsd: 840_000_000,
    fdvUsd: 1_050_000_000,
    capturePeriodDays: 365,
    executedBuybacksUsdInPeriod: 54_000_000,
    recurringDirectBurnsUsdInPeriod: 8_000_000,
    holderDistributionsUsdInPeriod: 12_500_000,
    boughtAndBurnedUsdInPeriod: 38_000_000,
    announcedBuybacksUsd: 18_000_000,
    oneOffBurnsUsd: 0,
    unlockUsd90d: 1_500_000,
    inflationaryEmissionsUsd90d: 1_500_000,
    unlockUsd180d: 4_000_000,
    inflationaryEmissionsUsd180d: 3_000_000,
    unlockUsd365d: 9_000_000,
    inflationaryEmissionsUsd365d: 6_000_000,
    buybackDestination: 'burn',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    dataDate: '2026-09-30',
    sourceUrls: ['https://example.com/atlas-evidence'],
  },
  {
    id: 'sample-nova',
    name: 'Nova Exchange',
    symbol: 'NOVA',
    circulatingMarketCapUsd: 1_550_000_000,
    fdvUsd: 2_800_000_000,
    capturePeriodDays: 365,
    executedBuybacksUsdInPeriod: 92_000_000,
    recurringDirectBurnsUsdInPeriod: 0,
    holderDistributionsUsdInPeriod: 24_000_000,
    boughtAndBurnedUsdInPeriod: 0,
    announcedBuybacksUsd: 40_000_000,
    oneOffBurnsUsd: 0,
    unlockUsd90d: 8_000_000,
    inflationaryEmissionsUsd90d: 4_000_000,
    unlockUsd180d: 18_000_000,
    inflationaryEmissionsUsd180d: 9_000_000,
    unlockUsd365d: 36_000_000,
    inflationaryEmissionsUsd365d: 18_000_000,
    buybackDestination: 'lock',
    evidenceLevel: 'official',
    programStatus: 'active',
    dataDate: '2026-09-30',
    sourceUrls: ['https://example.com/nova-report'],
  },
  {
    id: 'sample-ember',
    name: 'Ember Network',
    symbol: 'EMB',
    circulatingMarketCapUsd: 410_000_000,
    fdvUsd: 1_480_000_000,
    capturePeriodDays: 180,
    executedBuybacksUsdInPeriod: 14_000_000,
    recurringDirectBurnsUsdInPeriod: 2_200_000,
    holderDistributionsUsdInPeriod: 0,
    boughtAndBurnedUsdInPeriod: 11_000_000,
    announcedBuybacksUsd: 30_000_000,
    oneOffBurnsUsd: 45_000_000,
    unlockUsd90d: 30_000_000,
    inflationaryEmissionsUsd90d: 6_000_000,
    unlockUsd180d: 55_000_000,
    inflationaryEmissionsUsd180d: 12_000_000,
    unlockUsd365d: 92_000_000,
    inflationaryEmissionsUsd365d: 24_000_000,
    buybackDestination: 'burn',
    evidenceLevel: 'third_party',
    programStatus: 'active',
    dataDate: '2026-09-30',
    sourceUrls: ['https://example.com/ember-research'],
  },
  {
    id: 'sample-cascade',
    name: 'Cascade Finance',
    symbol: 'CSD',
    circulatingMarketCapUsd: 2_100_000_000,
    fdvUsd: 2_340_000_000,
    capturePeriodDays: 365,
    executedBuybacksUsdInPeriod: 126_000_000,
    recurringDirectBurnsUsdInPeriod: 0,
    holderDistributionsUsdInPeriod: 48_000_000,
    boughtAndBurnedUsdInPeriod: 0,
    announcedBuybacksUsd: 0,
    oneOffBurnsUsd: 0,
    unlockUsd90d: 3_000_000,
    inflationaryEmissionsUsd90d: 800_000,
    unlockUsd180d: 7_000_000,
    inflationaryEmissionsUsd180d: 1_700_000,
    unlockUsd365d: 14_000_000,
    inflationaryEmissionsUsd365d: 3_500_000,
    buybackDestination: 'treasury',
    evidenceLevel: 'onchain',
    programStatus: 'active',
    dataDate: '2026-09-30',
    sourceUrls: ['https://example.com/cascade-dashboard'],
  },
  {
    id: 'sample-orbit',
    name: 'Orbit Markets',
    symbol: 'ORB',
    circulatingMarketCapUsd: 690_000_000,
    fdvUsd: 1_900_000_000,
    capturePeriodDays: 90,
    executedBuybacksUsdInPeriod: 9_800_000,
    recurringDirectBurnsUsdInPeriod: 0,
    holderDistributionsUsdInPeriod: 4_500_000,
    boughtAndBurnedUsdInPeriod: 0,
    announcedBuybacksUsd: 25_000_000,
    oneOffBurnsUsd: 0,
    unlockUsd90d: 20_000_000,
    inflationaryEmissionsUsd90d: 5_000_000,
    unlockUsd180d: 35_000_000,
    inflationaryEmissionsUsd180d: 10_000_000,
    unlockUsd365d: 58_000_000,
    inflationaryEmissionsUsd365d: 21_000_000,
    buybackDestination: 'recycled',
    evidenceLevel: 'estimate',
    programStatus: 'paused',
    dataDate: '2026-09-30',
    sourceUrls: ['https://example.com/orbit-estimate'],
  },
  {
    id: 'sample-prism',
    name: 'Prism Labs',
    symbol: 'PRSM',
    circulatingMarketCapUsd: 275_000_000,
    fdvUsd: 860_000_000,
    capturePeriodDays: 365,
    executedBuybacksUsdInPeriod: 7_500_000,
    recurringDirectBurnsUsdInPeriod: 1_400_000,
    holderDistributionsUsdInPeriod: 0,
    boughtAndBurnedUsdInPeriod: 5_800_000,
    announcedBuybacksUsd: 12_000_000,
    oneOffBurnsUsd: 0,
    unlockUsd90d: null,
    inflationaryEmissionsUsd90d: null,
    unlockUsd180d: null,
    inflationaryEmissionsUsd180d: null,
    unlockUsd365d: null,
    inflationaryEmissionsUsd365d: null,
    buybackDestination: 'burn',
    evidenceLevel: 'announcement',
    programStatus: 'proposed',
    dataDate: '2026-09-30',
    sourceUrls: ['https://example.com/prism-announcement'],
  },
]

const EMPTY_TOKEN: TokenValueCaptureInput = {
  name: '',
  symbol: '',
  circulatingMarketCapUsd: 0,
  fdvUsd: 0,
  capturePeriodDays: 365,
  executedBuybacksUsdInPeriod: 0,
  recurringDirectBurnsUsdInPeriod: 0,
  holderDistributionsUsdInPeriod: 0,
  boughtAndBurnedUsdInPeriod: 0,
  announcedBuybacksUsd: 0,
  oneOffBurnsUsd: 0,
  unlockUsd90d: null,
  inflationaryEmissionsUsd90d: null,
  unlockUsd180d: null,
  inflationaryEmissionsUsd180d: null,
  unlockUsd365d: null,
  inflationaryEmissionsUsd365d: null,
  buybackDestination: 'burn',
  evidenceLevel: 'official',
  programStatus: 'active',
  dataDate: '2026-09-30',
  sourceUrls: [''],
}

const DESTINATION_LABELS: Record<BuybackDestination, string> = {
  burn: 'Burn',
  lock: 'Irrevocable lock',
  treasury: 'Treasury',
  recycled: 'Recycled',
}

const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  onchain: 'Onchain',
  official: 'Official',
  third_party: 'Third party',
  estimate: 'Estimate',
  announcement: 'Announcement',
}

const STATUS_LABELS: Record<ProgramStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  proposed: 'Proposed',
  ended: 'Ended',
}

const CSV_FIELDS: Array<keyof TokenValueCaptureInput> = [
  'id',
  'name',
  'symbol',
  'circulatingMarketCapUsd',
  'fdvUsd',
  'capturePeriodDays',
  'executedBuybacksUsdInPeriod',
  'recurringDirectBurnsUsdInPeriod',
  'holderDistributionsUsdInPeriod',
  'boughtAndBurnedUsdInPeriod',
  'announcedBuybacksUsd',
  'oneOffBurnsUsd',
  'unlockUsd90d',
  'inflationaryEmissionsUsd90d',
  'unlockUsd180d',
  'inflationaryEmissionsUsd180d',
  'unlockUsd365d',
  'inflationaryEmissionsUsd365d',
  'buybackDestination',
  'evidenceLevel',
  'programStatus',
  'dataDate',
  'sourceUrls',
]

const NUMERIC_FIELDS = new Set<keyof TokenValueCaptureInput>([
  'circulatingMarketCapUsd',
  'fdvUsd',
  'capturePeriodDays',
  'executedBuybacksUsdInPeriod',
  'recurringDirectBurnsUsdInPeriod',
  'holderDistributionsUsdInPeriod',
  'boughtAndBurnedUsdInPeriod',
  'announcedBuybacksUsd',
  'oneOffBurnsUsd',
  'unlockUsd90d',
  'inflationaryEmissionsUsd90d',
  'unlockUsd180d',
  'inflationaryEmissionsUsd180d',
  'unlockUsd365d',
  'inflationaryEmissionsUsd365d',
])

const NULLABLE_NUMERIC_FIELDS = new Set<keyof TokenValueCaptureInput>([
  'unlockUsd90d',
  'inflationaryEmissionsUsd90d',
  'unlockUsd180d',
  'inflationaryEmissionsUsd180d',
  'unlockUsd365d',
  'inflationaryEmissionsUsd365d',
])

function cloneSample(): TokenValueCaptureInput[] {
  return SAMPLE_TOKENS.map((token) => ({ ...token, sourceUrls: [...token.sourceUrls] }))
}

function formatUsd(value: number | null | undefined, compact = true): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Unknown'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value)
}

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'NR'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatRatio(value: number | null | undefined, rankable: boolean): string {
  if (!rankable) return 'NR'
  if (value === null || value === undefined) return 'No releases'
  return `${value.toFixed(2)}×`
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle] ?? null
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function downloadFile(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function csvEscape(value: unknown): string {
  const normalized = Array.isArray(value) ? value.join('|') : String(value ?? '')
  return /[",\n]/.test(normalized) ? `"${normalized.replaceAll('"', '""')}"` : normalized
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const next = text[index + 1]
    if (character === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1
      row.push(cell)
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  row.push(cell)
  if (row.some((value) => value.trim() !== '')) rows.push(row)
  return rows
}

function tokensFromCsv(text: string): TokenValueCaptureInput[] {
  const [headerRow, ...dataRows] = parseCsv(text)
  if (!headerRow) throw new Error('The CSV file is empty.')
  const headers = headerRow.map((header) => header.trim())
  const tokens = dataRows.map((row) => {
    const record: Record<string, unknown> = {}
    headers.forEach((header, index) => {
      if (!CSV_FIELDS.includes(header as keyof TokenValueCaptureInput)) return
      const key = header as keyof TokenValueCaptureInput
      const value = row[index]?.trim() ?? ''
      if (key === 'sourceUrls') {
        record[key] = value.split('|').map((url) => url.trim()).filter(Boolean)
      } else if (NUMERIC_FIELDS.has(key)) {
        record[key] = value === '' && NULLABLE_NUMERIC_FIELDS.has(key)
          ? null
          : Number(value)
      } else if (key !== 'id' || value !== '') {
        record[key] = value
      }
    })
    return record
  })
  return parseTokenInputs(tokens)
}

function encodeShareState(state: StoredState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function decodeShareState(value: string): StoredStateInput {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as StoredStateInput
}

function normalizeStoredState(input: StoredStateInput): StoredState {
  let releaseHorizonDays: ReleaseHorizonDays = 365
  if (input.releaseHorizonDays !== undefined) {
    try {
      releaseHorizonDays = parseReleaseHorizonDays(input.releaseHorizonDays)
    } catch {
      releaseHorizonDays = 365
    }
  }

  return {
    version: 2,
    datasetType: input.datasetType === 'custom' ? 'custom' : 'illustrative',
    tokens: parseTokenInputs(input.tokens),
    factors: parseAdjustmentFactors(input.factors),
    releaseHorizonDays,
  }
}

function readInitialState(): StoredState {
  try {
    const hash = new URLSearchParams(window.location.hash.slice(1)).get('data')
    if (hash) {
      return normalizeStoredState(decodeShareState(hash))
    }
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (stored) {
      return normalizeStoredState(JSON.parse(stored) as StoredStateInput)
    }
  } catch {
    // Corrupt state falls back to the bundled illustrative dataset.
  }
  return {
    version: 2,
    datasetType: 'illustrative',
    tokens: cloneSample(),
    factors: DEFAULT_ADJUSTMENT_FACTORS,
    releaseHorizonDays: 365,
  }
}

function getSortValue(row: RankedToken, key: SortKey): number | string {
  switch (key) {
    case 'rank': return row.rank ?? Number.POSITIVE_INFINITY
    case 'token': return row.input.symbol
    case 'effectiveCapture': return row.metrics.horizonEffectiveCaptureUsd
    case 'releasePressure': return row.metrics.totalReleasePressureUsd ?? Number.NEGATIVE_INFINITY
    case 'grossYield': return row.metrics.horizonEffectiveCaptureYieldPct
    case 'netYield': return row.metrics.netCaptureYieldPct ?? Number.NEGATIVE_INFINITY
    case 'coverage': return row.metrics.coverageRatio ?? (row.metrics.rankable ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY)
  }
}

function sortRows(rows: RankedToken[], sort: SortState): RankedToken[] {
  return [...rows].sort((left, right) => {
    const a = getSortValue(left, sort.key)
    const b = getSortValue(right, sort.key)
    const comparison = typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b)
      : Number(a) - Number(b)
    return sort.direction === 'asc' ? comparison : -comparison
  })
}

function monogram(symbol: string): string {
  return symbol.slice(0, 3).toUpperCase()
}

function evidenceTone(evidence: EvidenceLevel): string {
  if (evidence === 'onchain') return 'verified'
  if (evidence === 'official' || evidence === 'third_party') return 'documented'
  return 'claimed'
}

function sortAria(sort: SortState, key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sort.key !== key) return 'none'
  return sort.direction === 'asc' ? 'ascending' : 'descending'
}

interface SortButtonProps {
  label: string
  sortKey: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
}

function SortButton({ label, sortKey, sort, onSort }: SortButtonProps) {
  const active = sort.key === sortKey
  return (
    <button
      className={cx('sort-button', active && 'active')}
      type="button"
      onClick={() => onSort(sortKey)}
    >
      {label}
      {active
        ? sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        : <ArrowUpDown size={11} />}
    </button>
  )
}

interface TokenDrawerProps {
  token: TokenValueCaptureInput
  editingId: string | undefined
  factors: AdjustmentFactors
  releaseHorizonDays: ReleaseHorizonDays
  onClose: () => void
  onSave: (token: TokenValueCaptureInput) => void
}

function TokenDrawer({ token, editingId, factors, releaseHorizonDays, onClose, onSave }: TokenDrawerProps) {
  const [draft, setDraft] = useState<TokenValueCaptureInput>(() => ({ ...token, sourceUrls: [...token.sourceUrls] }))
  const [error, setError] = useState('')
  const [sources, setSources] = useState(token.sourceUrls.join('\n'))

  const preview = useMemo<TokenMetrics | null>(() => {
    try {
      return calculateTokenMetrics(
        { ...draft, sourceUrls: sources.split('\n').map((url) => url.trim()).filter(Boolean) },
        { destination: factors.destination },
        releaseHorizonDays,
      )
    } catch {
      return null
    }
  }, [draft, factors, releaseHorizonDays, sources])

  const setNumber = (key: keyof TokenValueCaptureInput, value: string) => {
    setDraft((current) => ({ ...current, [key]: Number(value) }))
  }

  const setNullableNumber = (key: keyof TokenValueCaptureInput, value: string) => {
    setDraft((current) => ({ ...current, [key]: value === '' ? null : Number(value) }))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const parsed = parseTokenInputs([{
        ...draft,
        id: editingId ?? `token-${Date.now()}`,
        symbol: draft.symbol.toUpperCase(),
        sourceUrls: sources.split('\n').map((url) => url.trim()).filter(Boolean),
      }])[0]
      if (!parsed) throw new Error('Token input could not be parsed.')
      onSave(parsed)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Check the highlighted data and try again.')
    }
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="drawer drawer-wide" aria-label={editingId ? 'Edit token' : 'Add token'} onSubmit={submit}>
        <div className="drawer-header">
          <div>
            <h2>{editingId ? 'Edit token' : 'Add token'}</h2>
            <div className="drawer-kicker">Capture inputs · USD</div>
          </div>
          <button className="button icon-button button-ghost" type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <section className="drawer-section">
            <div className="section-title">Identity <span>Required</span></div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="token-name">Project name</label>
                <input id="token-name" className="input" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Example Protocol" />
              </div>
              <div className="field">
                <label htmlFor="token-symbol">Token symbol</label>
                <input id="token-symbol" className="input" required value={draft.symbol} onChange={(event) => setDraft({ ...draft, symbol: event.target.value.toUpperCase() })} placeholder="EXM" maxLength={20} />
              </div>
              <div className="field">
                <label htmlFor="market-cap">Circulating market cap</label>
                <input id="market-cap" className="input" type="number" min="1" required value={draft.circulatingMarketCapUsd || ''} onChange={(event) => setNumber('circulatingMarketCapUsd', event.target.value)} placeholder="500000000" />
              </div>
              <div className="field">
                <label htmlFor="fdv">Fully diluted value</label>
                <input id="fdv" className="input" type="number" min="0" required value={draft.fdvUsd || ''} onChange={(event) => setNumber('fdvUsd', event.target.value)} placeholder="900000000" />
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <div className="section-title">Executed recurring capture <span>Annualized by engine</span></div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="period-days">Observed period, days</label>
                <input id="period-days" className="input" type="number" min="90" max="365" required value={draft.capturePeriodDays} onChange={(event) => setNumber('capturePeriodDays', event.target.value)} />
                <p className="field-hint">Periods below 365 days are marked Provisional.</p>
              </div>
              <div className="field">
                <label htmlFor="buybacks">Executed buybacks in period</label>
                <input id="buybacks" className="input" type="number" min="0" required value={draft.executedBuybacksUsdInPeriod || ''} onChange={(event) => setNumber('executedBuybacksUsdInPeriod', event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="direct-burns">Recurring direct burns in period</label>
                <input id="direct-burns" className="input" type="number" min="0" required value={draft.recurringDirectBurnsUsdInPeriod || ''} onChange={(event) => setNumber('recurringDirectBurnsUsdInPeriod', event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="distributions">Holder distributions in period</label>
                <input id="distributions" className="input" type="number" min="0" required value={draft.holderDistributionsUsdInPeriod || ''} onChange={(event) => setNumber('holderDistributionsUsdInPeriod', event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="destination">Buyback destination</label>
                <select id="destination" className="select" value={draft.buybackDestination} onChange={(event) => setDraft({ ...draft, buybackDestination: event.target.value as BuybackDestination })}>
                  {BUYBACK_DESTINATIONS.map((destination) => <option key={destination} value={destination}>{DESTINATION_LABELS[destination]}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="bought-burned">Bought and burned subset</label>
                <input id="bought-burned" className="input" type="number" min="0" value={draft.boughtAndBurnedUsdInPeriod || ''} onChange={(event) => setNumber('boughtAndBurnedUsdInPeriod', event.target.value)} />
                <p className="field-hint">Context only. Already included in buybacks.</p>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <div className="section-title">Forward release pressure <span>Blank means unknown</span></div>
            <p className="field-hint release-hint">Values are cumulative from the data date. Enter 0 only when zero has been verified.</p>
            <div className="release-grid" role="group" aria-label="Cumulative release values by horizon">
              <div className="release-grid-heading">Horizon</div>
              <div className="release-grid-heading">Unlocks</div>
              <div className="release-grid-heading">Emissions</div>
              <div className="release-horizon-label">90d</div>
              <div className="field">
                <label className="sr-only" htmlFor="unlocks-90">Next 90d unlock value</label>
                <input id="unlocks-90" className="input" type="number" min="0" value={draft.unlockUsd90d ?? ''} onChange={(event) => setNullableNumber('unlockUsd90d', event.target.value)} placeholder="Unknown" />
              </div>
              <div className="field">
                <label className="sr-only" htmlFor="emissions-90">Next 90d inflationary emissions</label>
                <input id="emissions-90" className="input" type="number" min="0" value={draft.inflationaryEmissionsUsd90d ?? ''} onChange={(event) => setNullableNumber('inflationaryEmissionsUsd90d', event.target.value)} placeholder="Unknown" />
              </div>
              <div className="release-horizon-label">180d</div>
              <div className="field">
                <label className="sr-only" htmlFor="unlocks-180">Next 180d unlock value</label>
                <input id="unlocks-180" className="input" type="number" min="0" value={draft.unlockUsd180d ?? ''} onChange={(event) => setNullableNumber('unlockUsd180d', event.target.value)} placeholder="Unknown" />
              </div>
              <div className="field">
                <label className="sr-only" htmlFor="emissions-180">Next 180d inflationary emissions</label>
                <input id="emissions-180" className="input" type="number" min="0" value={draft.inflationaryEmissionsUsd180d ?? ''} onChange={(event) => setNullableNumber('inflationaryEmissionsUsd180d', event.target.value)} placeholder="Unknown" />
              </div>
              <div className="release-horizon-label">365d</div>
              <div className="field">
                <label className="sr-only" htmlFor="unlocks-365">Next 365d unlock value</label>
                <input id="unlocks-365" className="input" type="number" min="0" value={draft.unlockUsd365d ?? ''} onChange={(event) => setNullableNumber('unlockUsd365d', event.target.value)} placeholder="Unknown" />
              </div>
              <div className="field">
                <label className="sr-only" htmlFor="emissions-365">Next 365d inflationary emissions</label>
                <input id="emissions-365" className="input" type="number" min="0" value={draft.inflationaryEmissionsUsd365d ?? ''} onChange={(event) => setNullableNumber('inflationaryEmissionsUsd365d', event.target.value)} placeholder="Unknown" />
              </div>
            </div>
            <p className="field-hint">A token is ranked only when both values exist for the selected horizon.</p>
            <div className="form-grid contextual-grid">
              <div className="field">
                <label htmlFor="announced-buybacks">Announced buybacks</label>
                <input id="announced-buybacks" className="input" type="number" min="0" required value={draft.announcedBuybacksUsd || ''} onChange={(event) => setNumber('announcedBuybacksUsd', event.target.value)} />
                <p className="field-hint">Shown as context and excluded from rank.</p>
              </div>
              <div className="field">
                <label htmlFor="one-off-burns">One-off burns</label>
                <input id="one-off-burns" className="input" type="number" min="0" required value={draft.oneOffBurnsUsd || ''} onChange={(event) => setNumber('oneOffBurnsUsd', event.target.value)} />
                <p className="field-hint">Non-recurring events are excluded from rank.</p>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <div className="section-title">Evidence <span>Does not change the rank</span></div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="evidence">Evidence level</label>
                <select id="evidence" className="select" value={draft.evidenceLevel} onChange={(event) => setDraft({ ...draft, evidenceLevel: event.target.value as EvidenceLevel })}>
                  {EVIDENCE_LEVELS.map((level) => <option key={level} value={level}>{EVIDENCE_LABELS[level]}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">Program status</label>
                <select id="status" className="select" value={draft.programStatus} onChange={(event) => setDraft({ ...draft, programStatus: event.target.value as ProgramStatus })}>
                  {PROGRAM_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="data-date">Data date</label>
                <input id="data-date" className="input" type="date" required value={draft.dataDate} onChange={(event) => setDraft({ ...draft, dataDate: event.target.value })} />
              </div>
              <div className="field full">
                <label htmlFor="sources">Source URLs</label>
                <textarea id="sources" className="textarea" required value={sources} onChange={(event) => setSources(event.target.value)} placeholder="https://...&#10;One URL per line" />
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <div className="section-title">Live preview <span>Current factors</span></div>
            <div className="preview-card">
              <div className="preview-metric"><small>{releaseHorizonDays}d effective capture</small><strong>{formatUsd(preview?.horizonEffectiveCaptureUsd)}</strong></div>
              <div className="preview-metric"><small>{releaseHorizonDays}d release pressure</small><strong>{formatUsd(preview?.totalReleasePressureUsd)}</strong></div>
              <div className="preview-metric"><small>{releaseHorizonDays}d net yield</small><strong className={cx((preview?.netCaptureYieldPct ?? 0) >= 0 ? 'positive-text' : 'negative-text')}>{formatPct(preview?.netCaptureYieldPct)}</strong></div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
          </section>
        </div>

        <div className="drawer-actions">
          <button className="button" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="submit">{editingId ? 'Save changes' : 'Add token'}</button>
        </div>
      </form>
    </div>
  )
}

interface MethodologyDrawerProps {
  factors: AdjustmentFactors
  releaseHorizonDays: ReleaseHorizonDays
  onClose: () => void
  onOpenFactors: () => void
}

function MethodologyDrawer({ factors, releaseHorizonDays, onClose, onOpenFactors }: MethodologyDrawerProps) {
  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" aria-label="Methodology">
        <div className="drawer-header">
          <div><h2>How ranking works</h2><div className="drawer-kicker">Methodology · v1.0</div></div>
          <button className="button icon-button button-ghost" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="drawer-body">
          <p className="method-intro">
            VALUEBEAST compares executed recurring value capture with token releases over the same {releaseHorizonDays}-day window. The primary rank is net capture yield relative to circulating market cap.
          </p>
          <div className="formula-block">annualized effective capture = annualized buybacks × destination factor + annualized recurring burns + annualized holder distributions{`\n`}{releaseHorizonDays}d effective capture = annualized effective capture × {releaseHorizonDays} ÷ 365{`\n`}{releaseHorizonDays}d release pressure = unlocks + inflationary emissions{`\n`}net capture yield = ({releaseHorizonDays}d effective capture − {releaseHorizonDays}d release pressure) ÷ circulating market cap</div>
          <ul className="method-list">
            <li><b>01</b><span>Only executed recurring capture enters the calculation. Announced buybacks and one-off burns remain visible context.</span></li>
            <li><b>02</b><span>Evidence and program-status labels never add a hidden multiplier. Use filters to set your own research standard.</span></li>
            <li><b>03</b><span>A period shorter than 365 days is annualized and marked Provisional so the extrapolation stays visible.</span></li>
            <li><b>04</b><span>Missing unlock or emission data produces NR. A verified zero must be entered explicitly.</span></li>
            <li><b>05</b><span>Bought-and-burned amounts are a subset of buybacks and are never counted twice.</span></li>
            <li><b>06</b><span>Release inputs are cumulative from the data date and are never estimated from another horizon.</span></li>
          </ul>
          <div className="section-title">Current destination factors <span>Applied to buybacks</span></div>
          <div className="factor-list">
            {BUYBACK_DESTINATIONS.map((destination) => (
              <div className="factor-row" key={destination}>
                <div><div className="factor-name">{DESTINATION_LABELS[destination]}</div><div className="factor-description">Executed buyback value retained at {(factors.destination[destination] * 100).toFixed(0)}%.</div></div>
                <strong className="mono-value">{factors.destination[destination].toFixed(2)}×</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="drawer-actions">
          <button className="button" type="button" onClick={onClose}>Close</button>
          <button className="button button-primary" type="button" onClick={onOpenFactors}><Settings2 size={15} /> Open factor settings</button>
        </div>
      </aside>
    </div>
  )
}

interface FactorsDrawerProps {
  factors: AdjustmentFactors
  onClose: () => void
  onApply: (factors: AdjustmentFactors) => void
}

function FactorsDrawer({ factors, onClose, onApply }: FactorsDrawerProps) {
  const [draft, setDraft] = useState<AdjustmentFactors>(() => ({ destination: { ...factors.destination } }))
  const update = (destination: BuybackDestination, value: number) => {
    setDraft({ destination: { ...draft.destination, [destination]: Math.max(0, Math.min(1, value)) } })
  }
  const setPreset = (preset: 'strict' | 'balanced' | 'default') => {
    if (preset === 'default') setDraft({ destination: { ...DEFAULT_ADJUSTMENT_FACTORS.destination } })
    if (preset === 'strict') setDraft({ destination: { burn: 1, lock: 1, treasury: 0, recycled: 0 } })
    if (preset === 'balanced') setDraft({ destination: { burn: 1, lock: 0.75, treasury: 0.25, recycled: 0.1 } })
  }
  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" aria-label="Factor settings">
        <div className="drawer-header">
          <div><h2>Destination factors</h2><div className="drawer-kicker">Transparent adjustments</div></div>
          <button className="button icon-button button-ghost" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="drawer-body">
          <p className="method-intro">Set how much of an executed buyback counts as effective capture based on where the purchased tokens go. Direct burns and holder distributions remain at full value.</p>
          <div className="factor-presets" aria-label="Factor presets">
            <button className="chip" type="button" onClick={() => setPreset('default')}>Default</button>
            <button className="chip" type="button" onClick={() => setPreset('strict')}>Strict</button>
            <button className="chip" type="button" onClick={() => setPreset('balanced')}>Balanced</button>
          </div>
          <div className="factor-list" style={{ marginTop: 16 }}>
            {BUYBACK_DESTINATIONS.map((destination) => (
              <div className="factor-row" key={destination}>
                <div><div className="factor-name">{DESTINATION_LABELS[destination]}</div><div className="factor-description">0% excludes it; 100% counts the full executed amount.</div></div>
                <div className="factor-input-wrap">
                  <input className="input" aria-label={`${DESTINATION_LABELS[destination]} factor`} type="number" min="0" max="100" step="5" value={Math.round(draft.destination[destination] * 100)} onChange={(event) => update(destination, Number(event.target.value) / 100)} />
                  <span>%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="drawer-actions">
          <button className="button" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="button" onClick={() => onApply(draft)}>Apply factors</button>
        </div>
      </aside>
    </div>
  )
}

interface ImportDrawerProps {
  onClose: () => void
  onImport: (
    tokens: TokenValueCaptureInput[],
    factors?: AdjustmentFactors,
    releaseHorizonDays?: ReleaseHorizonDays,
  ) => void
}

function ImportDrawer({ onClose, onImport }: ImportDrawerProps) {
  const [error, setError] = useState('')
  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      if (file.name.toLowerCase().endsWith('.csv')) {
        onImport(tokensFromCsv(text))
        return
      }
      const parsed = JSON.parse(text) as unknown
      if (Array.isArray(parsed)) {
        onImport(parseTokenInputs(parsed))
        return
      }
      const state = parsed as StoredStateInput
      onImport(
        parseTokenInputs(state.tokens),
        state.factors ? parseAdjustmentFactors(state.factors) : undefined,
        state.releaseHorizonDays === undefined
          ? 365
          : parseReleaseHorizonDays(state.releaseHorizonDays),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to read this file.')
    }
  }
  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" aria-label="Import data">
        <div className="drawer-header">
          <div><h2>Import dataset</h2><div className="drawer-kicker">CSV or VALUEBEAST JSON</div></div>
          <button className="button icon-button button-ghost" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="drawer-body">
          <label className="import-zone">
            <div><Upload size={24} /><strong>Choose a CSV or JSON file</strong><span>Your current dataset will be replaced after validation.</span></div>
            <input type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => void handleFile(event.target.files?.[0])} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="formula-block" style={{ marginTop: 18 }}>CSV uses one token per row. Keep blank unlock or emission cells when the value is unknown; enter 0 only for a verified zero. Separate multiple source URLs with |.</div>
          <a className="button" href={`${import.meta.env.BASE_URL}valuebeast-template.csv`} download>
            <FileSpreadsheet size={15} /> Download CSV template
          </a>
        </div>
      </aside>
    </div>
  )
}

function App() {
  const initial = useRef(readInitialState()).current
  const [tokens, setTokens] = useState(initial.tokens)
  const [factors, setFactors] = useState<AdjustmentFactors>(initial.factors)
  const [datasetType, setDatasetType] = useState<DatasetType>(initial.datasetType)
  const [releaseHorizonDays, setReleaseHorizonDays] =
    useState<ReleaseHorizonDays>(initial.releaseHorizonDays)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [editingToken, setEditingToken] = useState<TokenValueCaptureInput | null>(null)
  const [search, setSearch] = useState('')
  const [mechanismFilter, setMechanismFilter] = useState<'all' | BuybackDestination>('all')
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | EvidenceLevel>('all')
  const [sort, setSort] = useState<SortState>({ key: 'rank', direction: 'asc' })
  const [exportOpen, setExportOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const state: StoredState = {
      version: 2,
      datasetType,
      tokens,
      factors,
      releaseHorizonDays,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [datasetType, factors, releaseHorizonDays, tokens])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawer(null)
        setExportOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ranked = useMemo(
    () => rankTokens(tokens, { destination: factors.destination }, releaseHorizonDays),
    [factors, releaseHorizonDays, tokens],
  )

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = ranked.filter((row) => {
      const matchesSearch = term === '' || row.input.name.toLowerCase().includes(term) || row.input.symbol.toLowerCase().includes(term)
      const matchesMechanism = mechanismFilter === 'all' || row.input.buybackDestination === mechanismFilter
      const matchesEvidence = evidenceFilter === 'all' || row.input.evidenceLevel === evidenceFilter
      return matchesSearch && matchesMechanism && matchesEvidence
    })
    return sortRows(filtered, sort)
  }, [evidenceFilter, mechanismFilter, ranked, search, sort])

  const metrics = useMemo(() => {
    const rankable = ranked.filter((row) => row.metrics.rankable)
    const totalCapture = rankable.reduce((sum, row) => sum + row.metrics.horizonEffectiveCaptureUsd, 0)
    const totalPressure = rankable.reduce((sum, row) => sum + (row.metrics.totalReleasePressureUsd ?? 0), 0)
    const netYields = rankable.map((row) => row.metrics.netCaptureYieldPct).filter((value): value is number => value !== null)
    const highEvidence = ranked.filter((row) => row.input.evidenceLevel === 'onchain' || row.input.evidenceLevel === 'official').length
    return {
      rankable: rankable.length,
      totalCapture,
      medianYield: median(netYields),
      aggregateCoverage: totalPressure === 0 ? null : totalCapture / totalPressure,
      evidenceCoverage: ranked.length === 0 ? 0 : (highEvidence / ranked.length) * 100,
    }
  }, [ranked])

  const changeSort = (key: SortKey) => {
    setSort((current) => current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: key === 'token' || key === 'rank' ? 'asc' : 'desc' })
  }

  const openAdd = () => {
    setEditingToken(null)
    setDrawer('token')
  }

  const openEdit = (token: TokenValueCaptureInput) => {
    setEditingToken(token)
    setDrawer('token')
  }

  const saveToken = (token: TokenValueCaptureInput) => {
    setTokens((current) => editingToken?.id
      ? current.map((item) => item.id === editingToken.id ? token : item)
      : [...current, token])
    setDatasetType('custom')
    setDrawer(null)
    setToast(editingToken ? `${token.symbol} updated` : `${token.symbol} added`)
  }

  const deleteToken = (token: TokenValueCaptureInput) => {
    if (!window.confirm(`Delete ${token.name} (${token.symbol}) from this local dataset?`)) return
    setTokens((current) => current.filter((item) => item.id !== token.id))
    setDatasetType('custom')
    setToast(`${token.symbol} removed`)
  }

  const restoreSample = () => {
    setTokens(cloneSample())
    setFactors(DEFAULT_ADJUSTMENT_FACTORS)
    setReleaseHorizonDays(365)
    setDatasetType('illustrative')
    setToast('Illustrative dataset restored')
  }

  const exportJson = () => {
    const state: StoredState = {
      version: 2,
      datasetType,
      tokens,
      factors,
      releaseHorizonDays,
    }
    downloadFile('valuebeast-dataset.json', JSON.stringify(state, null, 2), 'application/json')
    setExportOpen(false)
    setToast('JSON exported')
  }

  const exportCsv = () => {
    const header = CSV_FIELDS.join(',')
    const rows = tokens.map((token) => CSV_FIELDS.map((field) => csvEscape(token[field])).join(','))
    downloadFile('valuebeast-tokens.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8')
    setExportOpen(false)
    setToast('CSV exported')
  }

  const copyShareLink = async () => {
    const state: StoredState = {
      version: 2,
      datasetType,
      tokens,
      factors,
      releaseHorizonDays,
    }
    const url = new URL(window.location.href)
    url.hash = `data=${encodeShareState(state)}`
    try {
      await navigator.clipboard.writeText(url.toString())
      setToast('Share link copied. Anyone with it can see this dataset.')
    } catch {
      window.prompt('Copy this share link', url.toString())
    }
  }

  const importTokens = (
    nextTokens: TokenValueCaptureInput[],
    nextFactors?: AdjustmentFactors,
    nextReleaseHorizonDays?: ReleaseHorizonDays,
  ) => {
    setTokens(nextTokens)
    if (nextFactors) setFactors(nextFactors)
    if (nextReleaseHorizonDays) setReleaseHorizonDays(nextReleaseHorizonDays)
    setDatasetType('custom')
    setDrawer(null)
    setToast(`${nextTokens.length} tokens imported`)
  }

  const activeFilters = (mechanismFilter === 'all' ? 0 : 1) + (evidenceFilter === 'all' ? 0 : 1) + (search ? 1 : 0)

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Terminal size={17} strokeWidth={2.2} /></div>
          <div><div className="brand-name">VALUEBEAST</div><div className="brand-subtitle">TOKEN VALUE-CAPTURE RANKER</div></div>
        </div>
        <div className="top-actions">
          <button className="button" type="button" onClick={() => setDrawer('import')}><Upload size={15} /><span>Import</span></button>
          <div className="dropdown-wrap">
            <button className="button" type="button" aria-expanded={exportOpen} onClick={() => setExportOpen((open) => !open)}><Download size={15} /><span>Export</span><ChevronDown size={13} className="desktop-only" /></button>
            {exportOpen && (
              <div className="menu">
                <button type="button" onClick={exportJson}><FileJson size={15} /> Export JSON</button>
                <button type="button" onClick={exportCsv}><FileSpreadsheet size={15} /> Export CSV</button>
              </div>
            )}
          </div>
          <button className="button" type="button" onClick={() => void copyShareLink()}><Share2 size={15} /><span>Share</span></button>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">Open research workspace</div>
          <h1>Track value capture.<br />Price the dilution.</h1>
          <p className="hero-copy">Rank tokens by executed, recurring economic value returned against the next {releaseHorizonDays} days of unlocks and inflationary emissions. Capture and releases use the same window.</p>
        </div>
        <div className="hero-side">
          {datasetType === 'illustrative' && <span className="sample-badge">Illustrative sample data</span>}
          <button className="button button-ghost" type="button" onClick={() => setDrawer('methodology')}><CircleHelp size={15} /> Methodology</button>
        </div>
      </section>

      {datasetType === 'illustrative' && bannerVisible && (
        <div className="sample-banner">
          <div><strong>Demo dataset.</strong> Every project and figure below is fictional and exists only to demonstrate ranking behavior. Import researched data before drawing conclusions.</div>
          <button type="button" aria-label="Dismiss sample data message" onClick={() => setBannerVisible(false)}><X size={15} /></button>
        </div>
      )}

      <section className="metrics-grid" aria-label="Dataset metrics">
        <article className="metric-card">
          <div className="metric-label"><span>Tokens ranked</span><Layers3 size={15} /></div>
          <div className="metric-value">{metrics.rankable}<span style={{ color: 'var(--muted-2)', fontSize: '0.52em' }}> / {ranked.length}</span></div>
          <div className="metric-note">Complete forward release data</div>
        </article>
        <article className="metric-card">
          <div className="metric-label"><span>Effective capture</span><Activity size={15} /></div>
          <div className="metric-value">{formatUsd(metrics.totalCapture)}</div>
          <div className="metric-note">{releaseHorizonDays}d recurring run rate</div>
        </article>
        <article className="metric-card">
          <div className="metric-label"><span>Median net yield</span><Gauge size={15} /></div>
          <div className={cx('metric-value', (metrics.medianYield ?? 0) >= 0 ? 'positive' : 'negative')}>{formatPct(metrics.medianYield)}</div>
          <div className="metric-note">After {releaseHorizonDays}d unlocks and emissions</div>
        </article>
        <article className="metric-card">
          <div className="metric-label"><span>Research coverage</span><ShieldCheck size={15} /></div>
          <div className="metric-value">{metrics.evidenceCoverage.toFixed(0)}%</div>
          <div className="metric-note">Onchain or official evidence · aggregate {metrics.aggregateCoverage === null ? 'n/a' : `${metrics.aggregateCoverage.toFixed(2)}×`} coverage</div>
        </article>
      </section>

      <section className="workspace-card" aria-label="Token rankings">
        <div className="workspace-toolbar">
          <div className="filter-group">
            <div className="horizon-control" role="radiogroup" aria-label="Release window">
              <span className="horizon-label">Release window</span>
              <div className="horizon-options">
                {RELEASE_HORIZONS.map((days) => (
                  <button
                    className={cx('horizon-option', releaseHorizonDays === days && 'active')}
                    type="button"
                    role="radio"
                    aria-checked={releaseHorizonDays === days}
                    key={days}
                    onClick={() => setReleaseHorizonDays(days)}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
            <div className="search-wrap">
              <Search size={15} />
              <input className="input search-input" type="search" aria-label="Search tokens" placeholder="Search project or symbol" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="select compact-select" aria-label="Filter by destination" value={mechanismFilter} onChange={(event) => setMechanismFilter(event.target.value as 'all' | BuybackDestination)}>
              <option value="all">All destinations</option>
              {BUYBACK_DESTINATIONS.map((destination) => <option key={destination} value={destination}>{DESTINATION_LABELS[destination]}</option>)}
            </select>
            <select className="select compact-select" aria-label="Filter by evidence" value={evidenceFilter} onChange={(event) => setEvidenceFilter(event.target.value as 'all' | EvidenceLevel)}>
              <option value="all">All evidence</option>
              {EVIDENCE_LEVELS.map((level) => <option key={level} value={level}>{EVIDENCE_LABELS[level]}</option>)}
            </select>
          </div>
          <div className="control-actions">
            {activeFilters > 0 && <button className="button button-ghost" type="button" onClick={() => { setSearch(''); setMechanismFilter('all'); setEvidenceFilter('all') }}>Clear {activeFilters}</button>}
            <button className="button button-ghost desktop-only" type="button" onClick={restoreSample}>{datasetType === 'illustrative' ? 'Reset sample' : 'Load sample'}</button>
            <button className="button" type="button" onClick={() => setDrawer('factors')}><SlidersHorizontal size={15} /> Factors</button>
            <button className="button button-primary desktop-only" type="button" onClick={openAdd}><Plus size={15} /> Add token</button>
          </div>
        </div>

        {visibleRows.length > 0 ? (
          <>
            <div className="table-scroll">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th aria-sort={sortAria(sort, 'rank')}><SortButton label="Rank" sortKey="rank" sort={sort} onSort={changeSort} /></th>
                    <th className="sticky-cell" aria-sort={sortAria(sort, 'token')}><SortButton label="Token" sortKey="token" sort={sort} onSort={changeSort} /></th>
                    <th>Destination</th>
                    <th>Evidence</th>
                    <th className="numeric" aria-sort={sortAria(sort, 'effectiveCapture')}><SortButton label={`${releaseHorizonDays}d capture`} sortKey="effectiveCapture" sort={sort} onSort={changeSort} /></th>
                    <th className="numeric" aria-sort={sortAria(sort, 'releasePressure')}><SortButton label={`${releaseHorizonDays}d pressure`} sortKey="releasePressure" sort={sort} onSort={changeSort} /></th>
                    <th className="numeric" aria-sort={sortAria(sort, 'grossYield')}><SortButton label={`${releaseHorizonDays}d capture yield`} sortKey="grossYield" sort={sort} onSort={changeSort} /></th>
                    <th className="numeric" aria-sort={sortAria(sort, 'netYield')}><SortButton label={`${releaseHorizonDays}d net yield`} sortKey="netYield" sort={sort} onSort={changeSort} /></th>
                    <th className="numeric" aria-sort={sortAria(sort, 'coverage')}><SortButton label="Coverage" sortKey="coverage" sort={sort} onSort={changeSort} /></th>
                    <th className="numeric">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const netYield = row.metrics.netCaptureYieldPct
                    const provisional = row.input.capturePeriodDays < 365
                    return (
                      <tr key={row.input.id ?? row.input.symbol}>
                        <td><span className={cx('rank-badge', row.rank !== null && row.rank <= 3 && 'top-three')}>{row.rank ?? 'NR'}</span></td>
                        <td className="sticky-cell">
                          <div className="token-cell">
                            <div className="token-monogram">{monogram(row.input.symbol)}</div>
                            <div><div className="token-name">{row.input.name}</div><div className="token-symbol">{row.input.symbol}{provisional ? ' · provisional' : ''}</div></div>
                          </div>
                        </td>
                        <td><span className="mechanism-pill">{DESTINATION_LABELS[row.input.buybackDestination]}</span></td>
                        <td><span className={cx('evidence-pill', evidenceTone(row.input.evidenceLevel))}>{EVIDENCE_LABELS[row.input.evidenceLevel]}</span></td>
                        <td className="numeric mono-value">{formatUsd(row.metrics.horizonEffectiveCaptureUsd)}</td>
                        <td className="numeric mono-value" title={row.metrics.unrankedReason ?? undefined}>{formatUsd(row.metrics.totalReleasePressureUsd)}</td>
                        <td className="numeric mono-value">{formatPct(row.metrics.horizonEffectiveCaptureYieldPct)}</td>
                        <td className={cx('numeric', 'mono-value', 'yield-cell', netYield === null ? 'neutral-text' : netYield >= 0 ? 'positive-text' : 'negative-text')} title={row.metrics.unrankedReason ?? undefined}>
                          {formatPct(netYield)}
                          {netYield !== null && <div className="yield-bar"><span style={{ width: `${Math.min(100, Math.abs(netYield) * 6)}%` }} /></div>}
                        </td>
                        <td className="numeric mono-value" title={row.metrics.unrankedReason ?? undefined}>{formatRatio(row.metrics.coverageRatio, row.metrics.rankable)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="row-action" type="button" aria-label={`Edit ${row.input.symbol}`} onClick={() => openEdit(row.input)}><Edit3 size={14} /></button>
                            <button className="row-action" type="button" aria-label={`Delete ${row.input.symbol}`} onClick={() => deleteToken(row.input)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {visibleRows.map((row) => (
                <article className="mobile-rank-card" key={`mobile-${row.input.id ?? row.input.symbol}`}>
                  <div className="mobile-rank-head">
                    <div className="mobile-rank-token">
                      <span className={cx('rank-badge', row.rank !== null && row.rank <= 3 && 'top-three')}>{row.rank ?? 'NR'}</span>
                      <div className="token-monogram">{monogram(row.input.symbol)}</div>
                      <div><div className="token-name">{row.input.name}</div><div className="token-symbol">{row.input.symbol}{row.input.capturePeriodDays < 365 ? ' · provisional' : ''}</div></div>
                    </div>
                    <div className={cx('mobile-score', (row.metrics.netCaptureYieldPct ?? 0) < 0 && 'negative-text')}><small>{releaseHorizonDays}d net yield</small>{formatPct(row.metrics.netCaptureYieldPct)}</div>
                  </div>
                  <div className="mobile-rank-meta">
                    <div><small>Capture · {releaseHorizonDays}d</small><strong>{formatUsd(row.metrics.horizonEffectiveCaptureUsd)}</strong></div>
                    <div><small>Pressure · {releaseHorizonDays}d</small><strong>{formatUsd(row.metrics.totalReleasePressureUsd)}</strong></div>
                    <div><small>Coverage</small><strong>{formatRatio(row.metrics.coverageRatio, row.metrics.rankable)}</strong></div>
                  </div>
                  <div className="mobile-card-actions">
                    <div className="tag-row"><span className="mechanism-pill">{DESTINATION_LABELS[row.input.buybackDestination]}</span><span className={cx('evidence-pill', evidenceTone(row.input.evidenceLevel))}>{EVIDENCE_LABELS[row.input.evidenceLevel]}</span></div>
                    <div className="row-actions"><button className="row-action" type="button" aria-label={`Edit ${row.input.symbol}`} onClick={() => openEdit(row.input)}><Edit3 size={14} /></button><button className="row-action" type="button" aria-label={`Delete ${row.input.symbol}`} onClick={() => deleteToken(row.input)}><Trash2 size={14} /></button></div>
                  </div>
                  {!row.metrics.rankable && <p className="field-hint" style={{ marginTop: 10 }}><Info size={11} style={{ verticalAlign: -2, marginRight: 5 }} />{row.metrics.unrankedReason}</p>}
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state"><Search size={24} /><h3>No matching tokens</h3><p>Clear the active filters or add a new token to this dataset.</p></div>
        )}

        <footer className="workspace-footer">
          <div className="save-state">Saved locally in this browser</div>
          <div>{visibleRows.length} visible · {ranked.filter((row) => !row.metrics.rankable).length} unranked · {releaseHorizonDays}d horizon · factors are user-adjustable</div>
        </footer>
      </section>

      <button className="button button-primary mobile-add" type="button" onClick={openAdd}><Plus size={16} /> Add token</button>

      {drawer === 'token' && (
        <TokenDrawer token={editingToken ?? EMPTY_TOKEN} editingId={editingToken?.id} factors={factors} releaseHorizonDays={releaseHorizonDays} onClose={() => setDrawer(null)} onSave={saveToken} />
      )}
      {drawer === 'methodology' && (
        <MethodologyDrawer factors={factors} releaseHorizonDays={releaseHorizonDays} onClose={() => setDrawer(null)} onOpenFactors={() => setDrawer('factors')} />
      )}
      {drawer === 'factors' && (
        <FactorsDrawer factors={factors} onClose={() => setDrawer(null)} onApply={(next) => { setFactors(next); setDrawer(null); setToast('Destination factors applied') }} />
      )}
      {drawer === 'import' && <ImportDrawer onClose={() => setDrawer(null)} onImport={importTokens} />}

      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </main>
  )
}

export default App
