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
  ExternalLink,
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
import { createPortal } from 'react-dom'

import {
  RESEARCH_CANDIDATES,
  type ResearchCandidate,
} from './data/researchCandidates'
import {
  COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP,
  COIN_MARKET_CAP_SNAPSHOTS,
  loadLatestCoinMarketCapSnapshots,
  type CoinMarketCapSnapshot,
} from './data/marketSnapshots'
import { getSourcedCandidateSnapshot } from './data/sourcedSnapshots'
import { getTokenLogoUrl } from './data/tokenLogos'
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
  version: 3
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

const STORAGE_KEY = 'valuebeast:v3'
const LEGACY_STORAGE_KEYS = ['valuebeast:v2', 'valuebeast:v1']

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

function formatMarketSnapshotTime(timestamp: string): string {
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return 'CMC'
  const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date)
  return `CMC · ${day} ${time}Z`
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
    version: 3,
    tokens: parseTokenInputs(input.tokens),
    factors: parseAdjustmentFactors(input.factors),
    releaseHorizonDays,
  }
}

function readInitialState(): StoredState {
  try {
    const hash = new URLSearchParams(window.location.hash.slice(1)).get('data')
    if (hash) {
      const shared = decodeShareState(hash)
      const normalized = normalizeStoredState(shared)
      return shared.datasetType === 'illustrative'
        ? { ...normalized, tokens: [] }
        : normalized
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return normalizeStoredState(JSON.parse(stored) as StoredStateInput)
    }

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyStored = localStorage.getItem(legacyKey)
      if (!legacyStored) continue
      const parsed = JSON.parse(legacyStored) as StoredStateInput
      const migrated = normalizeStoredState(parsed)
      return parsed.datasetType === 'illustrative'
        ? { ...migrated, tokens: [] }
        : migrated
    }
  } catch {
    // Corrupt state falls back to a clean research workspace.
  }
  return {
    version: 3,
    tokens: [],
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

interface TokenLogoProps {
  id?: string
  name: string
  symbol: string
}

function TokenLogo({ id, name, symbol }: TokenLogoProps) {
  const logoUrl = getTokenLogoUrl({ id, name, symbol })
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!logoUrl || failedUrl === logoUrl) {
    return <div className="token-monogram" aria-hidden="true">{monogram(symbol)}</div>
  }

  return (
    <div className="token-logo" aria-hidden="true">
      <img
        src={logoUrl}
        alt=""
        width={34}
        height={34}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(logoUrl)}
      />
    </div>
  )
}

interface TooltipPosition {
  left: number
  top: number
  width: number
  arrowLeft: number
  placement: 'above' | 'below'
}

function getTooltipPosition(rect: DOMRect): TooltipPosition {
  const viewportWidth = document.documentElement.clientWidth
  const margin = 12
  const width = Math.min(360, viewportWidth - margin * 2)
  const triggerCenter = rect.left + rect.width / 2
  const left = Math.min(
    Math.max(margin, triggerCenter - width / 2),
    viewportWidth - width - margin,
  )
  const placement = rect.top >= 170 ? 'above' : 'below'

  return {
    left,
    top: placement === 'above' ? rect.top - 10 : rect.bottom + 10,
    width,
    arrowLeft: Math.min(width - 18, Math.max(18, triggerCenter - left)),
    placement,
  }
}

interface ValueCaptureInfoProps {
  candidate: ResearchCandidate
}

function ValueCaptureInfo({ candidate }: ValueCaptureInfoProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const hoveringRef = useRef(false)
  const pointerTypeRef = useRef<string | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const tooltipId = `${candidate.id}-capture-tooltip`

  const showTooltip = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    setPosition(getTooltipPosition(trigger.getBoundingClientRect()))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return

    const closeTooltip = () => setOpen(false)
    const handleOutsidePointer = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) closeTooltip()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      closeTooltip()
      triggerRef.current?.focus()
    }
    const handleResize = () => {
      const trigger = triggerRef.current
      if (trigger) setPosition(getTooltipPosition(trigger.getBoundingClientRect()))
    }

    document.addEventListener('pointerdown', handleOutsidePointer)
    document.addEventListener('scroll', closeTooltip, true)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer)
      document.removeEventListener('scroll', closeTooltip, true)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        className="capture-info-trigger"
        type="button"
        aria-label={`Explain ${candidate.symbol} value capture`}
        aria-describedby={open ? tooltipId : undefined}
        data-open={open}
        onPointerDown={(event) => { pointerTypeRef.current = event.pointerType }}
        onMouseEnter={() => {
          hoveringRef.current = true
          showTooltip()
        }}
        onMouseLeave={() => {
          hoveringRef.current = false
          if (document.activeElement !== triggerRef.current) setOpen(false)
        }}
        onFocus={() => {
          if (pointerTypeRef.current !== 'touch' && pointerTypeRef.current !== 'pen') showTooltip()
        }}
        onBlur={() => {
          pointerTypeRef.current = null
          if (!hoveringRef.current) setOpen(false)
        }}
        onClick={() => {
          if (pointerTypeRef.current === 'touch' || pointerTypeRef.current === 'pen') {
            if (open) setOpen(false)
            else showTooltip()
            return
          }
          showTooltip()
        }}
      >
        <Info size={13} strokeWidth={2.4} />
      </button>
      {open && position && createPortal(
        <div
          className={cx('capture-tooltip', position.placement)}
          id={tooltipId}
          role="tooltip"
          style={{
            left: position.left,
            top: position.top,
            width: position.width,
            transform: position.placement === 'above' ? 'translateY(-100%)' : undefined,
          }}
        >
          <div className="capture-tooltip-title">{candidate.mechanismLabel}</div>
          <p>{candidate.mechanismTooltip}</p>
          <span className="capture-tooltip-arrow" style={{ left: position.arrowLeft }} />
        </div>,
        document.body,
      )}
    </>
  )
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

interface ResearchCandidatesProps {
  candidates: readonly ResearchCandidate[]
  releaseHorizonDays: ReleaseHorizonDays
  onReleaseHorizonChange: (days: ReleaseHorizonDays) => void
}

function getCandidateSnapshotPressure(candidateId: string, horizon: ReleaseHorizonDays): number | null {
  const snapshot = getSourcedCandidateSnapshot(candidateId)
  if (!snapshot) return null
  const data = snapshot.releaseData
  const values = horizon === 90
    ? [data.unlockUsd90d, data.inflationaryEmissionsUsd90d]
    : horizon === 180
      ? [data.unlockUsd180d, data.inflationaryEmissionsUsd180d]
      : [data.unlockUsd365d, data.inflationaryEmissionsUsd365d]
  return values.some((value) => value === null) ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
}

function ResearchCandidates({ candidates, releaseHorizonDays, onReleaseHorizonChange }: ResearchCandidatesProps) {
  const [query, setQuery] = useState('')
  const [destination, setDestination] = useState<'all' | BuybackDestination>('all')
  const [evidence, setEvidence] = useState<'all' | EvidenceLevel>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [marketSnapshots, setMarketSnapshots] = useState<readonly CoinMarketCapSnapshot[]>(
    COIN_MARKET_CAP_SNAPSHOTS,
  )
  const [marketDataState, setMarketDataState] = useState<'loading' | 'live' | 'fallback' | 'stale'>('loading')
  const latestMarketTimestampRef = useRef(COIN_MARKET_CAP_SNAPSHOT_TIMESTAMP)
  const marketSnapshotsByCandidate = useMemo(
    () => new Map(marketSnapshots.map((snapshot) => [snapshot.candidateId, snapshot])),
    [marketSnapshots],
  )

  useEffect(() => {
    let active = true
    let requestController: AbortController | null = null
    const refreshMarketCaps = async () => {
      requestController?.abort()
      const currentController = new AbortController()
      requestController = currentController
      try {
        const snapshots = await loadLatestCoinMarketCapSnapshots(currentController.signal)
        if (active && !currentController.signal.aborted) {
          const nextTimestamp = snapshots[0]?.asOfTimestamp
          if (nextTimestamp
            && Date.parse(nextTimestamp) >= Date.parse(latestMarketTimestampRef.current)) {
            latestMarketTimestampRef.current = nextTimestamp
            setMarketSnapshots(snapshots)
            setMarketDataState('live')
          } else {
            setMarketDataState('stale')
          }
        }
      } catch {
        if (active && !currentController.signal.aborted) {
          setMarketDataState((current) => current === 'live' ? 'stale' : 'fallback')
        }
      }
    }

    void refreshMarketCaps()
    const intervalId = window.setInterval(refreshMarketCaps, 5 * 60 * 1000)
    return () => {
      active = false
      requestController?.abort()
      window.clearInterval(intervalId)
    }
  }, [])
  const latestMarketTimestamp = marketSnapshots[0]?.asOfTimestamp
  const marketDataMessage = marketDataState === 'live' && latestMarketTimestamp
    ? `CMC market caps refresh hourly. Latest snapshot: ${formatMarketSnapshotTime(latestMarketTimestamp).replace('CMC · ', '')}.`
    : marketDataState === 'loading'
      ? 'Loading the latest hourly CMC market-cap snapshot.'
      : marketDataState === 'stale'
        ? 'CMC refresh is retrying. Showing the last verified snapshot.'
        : 'Live CMC update is unavailable. Showing the bundled verified snapshot.'
  const visibleCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return candidates.filter((candidate) => {
      const matchesQuery = !normalizedQuery
        || candidate.name.toLowerCase().includes(normalizedQuery)
        || candidate.symbol.toLowerCase().includes(normalizedQuery)
        || candidate.mechanismLabel.toLowerCase().includes(normalizedQuery)
      const matchesDestination = destination === 'all' || candidate.buybackDestination === destination
      const matchesEvidence = evidence === 'all' || candidate.evidenceLevel === evidence
      return matchesQuery && matchesDestination && matchesEvidence
    })
  }, [candidates, destination, evidence, query])

  return (
    <section className="research-candidates" aria-labelledby="research-candidates-title">
      <div className="research-candidates-header">
        <div>
          <div className="research-kicker">Source-linked · mechanism-qualified</div>
          <h2 id="research-candidates-title">Value-capture market</h2>
        </div>
        <p>{candidates.length} assets tracked. {marketDataMessage}</p>
      </div>

      <div className="candidate-toolbar">
        <div className="horizon-control" role="radiogroup" aria-label="Release window">
          <span className="horizon-label">Window</span>
          <div className="horizon-options">
            {RELEASE_HORIZONS.map((days) => (
              <button
                className={cx('horizon-option', releaseHorizonDays === days && 'active')}
                type="button"
                role="radio"
                aria-checked={releaseHorizonDays === days}
                key={days}
                onClick={() => onReleaseHorizonChange(days)}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
        <div className="search-wrap candidate-search">
          <Search size={15} />
          <input
            className="input search-input"
            type="search"
            aria-label="Search tracked assets"
            placeholder="Search assets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select className="select compact-select" aria-label="Filter tracked assets by destination" value={destination} onChange={(event) => setDestination(event.target.value as 'all' | BuybackDestination)}>
          <option value="all">All destinations</option>
          {BUYBACK_DESTINATIONS.map((item) => <option key={item} value={item}>{DESTINATION_LABELS[item]}</option>)}
        </select>
        <select className="select compact-select" aria-label="Filter tracked assets by evidence" value={evidence} onChange={(event) => setEvidence(event.target.value as 'all' | EvidenceLevel)}>
          <option value="all">All evidence</option>
          {EVIDENCE_LEVELS.map((item) => <option key={item} value={item}>{EVIDENCE_LABELS[item]}</option>)}
        </select>
      </div>

      <div className="candidate-table-scroll">
        <table className="candidate-table">
          <caption className="sr-only">Tracked tokens with recurring value-capture mechanisms</caption>
          <thead>
            <tr>
              <th scope="col" className="candidate-rank-col">#</th>
              <th scope="col" className="candidate-token-col">Token</th>
              <th scope="col" className="numeric candidate-market-col">Market cap (CMC)</th>
              <th scope="col" className="candidate-capture-col">Value capture</th>
              <th scope="col" className="numeric">{releaseHorizonDays}d capture</th>
              <th scope="col" className="numeric">{releaseHorizonDays}d pressure</th>
              <th scope="col" className="numeric">Net yield</th>
              <th scope="col" className="candidate-evidence-col">Mechanism evidence</th>
              <th scope="col" className="candidate-updated-col">Research updated</th>
              <th scope="col" className="candidate-details-col" aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {visibleCandidates.map((candidate) => {
              const snapshot = getSourcedCandidateSnapshot(candidate.id)
              const marketSnapshot = marketSnapshotsByCandidate.get(candidate.id)
              const marketCap = marketSnapshot?.circulatingMarketCapUsd
              const pressure = getCandidateSnapshotPressure(candidate.id, releaseHorizonDays)
              const expanded = expandedId === candidate.id
              const dataStatus = snapshot ? 'Partial release data' : 'Market data only'
              const marketSources = marketSnapshot
                ? [{
                    label: `CoinMarketCap ${candidate.symbol} market data`,
                    url: marketSnapshot.sourceUrl,
                  }]
                : []
              const sources = [...marketSources, ...candidate.sources, ...(snapshot?.sources ?? [])]
                .filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index)

              return [
                <tr className={cx('candidate-summary-row', expanded && 'expanded')} key={candidate.id}>
                  <td className="candidate-rank-col"><span className="rank-badge">–</span></td>
                  <td className="candidate-token-col">
                    <div className="token-cell">
                      <TokenLogo id={candidate.id} name={candidate.name} symbol={candidate.symbol} />
                      <div><div className="token-name">{candidate.name}</div><div className="token-symbol">{candidate.symbol} · {dataStatus}</div></div>
                    </div>
                  </td>
                  <td
                    className="numeric mono-value candidate-market-col"
                    title={marketSnapshot ? `CoinMarketCap snapshot · ${marketSnapshot.asOfTimestamp}` : undefined}
                  >
                    <span className="candidate-market-value">{marketCap === undefined ? 'Unknown' : formatUsd(marketCap)}</span>
                    {marketSnapshot && (
                      <span className="candidate-market-source">
                        {formatMarketSnapshotTime(marketSnapshot.asOfTimestamp)}
                      </span>
                    )}
                  </td>
                  <td className="candidate-capture-col">
                    <div className="candidate-capture-cell">
                      <span className="mechanism-pill">{DESTINATION_LABELS[candidate.buybackDestination]}</span>
                      <span className={cx('candidate-program-status', candidate.programStatus)}>{STATUS_LABELS[candidate.programStatus]}</span>
                      <ValueCaptureInfo candidate={candidate} />
                    </div>
                  </td>
                  <td className="numeric mono-value"><span className="pending-value">Pending</span></td>
                  <td className="numeric mono-value">{pressure === null || pressure === undefined ? <span className="pending-value">Pending</span> : formatUsd(pressure)}</td>
                  <td className="numeric mono-value"><span className="pending-value">Pending</span></td>
                  <td className="candidate-evidence-col"><span className={cx('evidence-pill', evidenceTone(candidate.evidenceLevel))}>{EVIDENCE_LABELS[candidate.evidenceLevel]}</span></td>
                  <td className="candidate-updated-col mono-value">{snapshot?.asOfDate ?? candidate.verifiedOn}</td>
                  <td className="candidate-details-col">
                    <button
                      className="candidate-detail-toggle"
                      type="button"
                      aria-label={`${expanded ? 'Hide' : 'Show'} ${candidate.symbol} research details`}
                      aria-expanded={expanded}
                      aria-controls={expanded ? `candidate-detail-${candidate.id}` : undefined}
                      onClick={() => setExpandedId(expanded ? null : candidate.id)}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </td>
                </tr>,
                expanded && (
                  <tr className="candidate-detail-row" id={`candidate-detail-${candidate.id}`} key={`${candidate.id}-detail`}>
                    <td colSpan={10}>
                      <div className="candidate-detail-shell">
                        <div className="candidate-detail-heading">
                          <span className="mechanism-pill">{candidate.mechanismLabel}</span>
                          <p>{candidate.mechanismSummary}</p>
                        </div>
                        <dl className="candidate-detail-grid">
                          <div><dt>Recurring evidence</dt><dd>{candidate.recurringEvidence}</dd></div>
                          <div><dt>Excluded from score</dt><dd>{candidate.excludedOneOff}</dd></div>
                          <div><dt>Release caveat</dt><dd>{candidate.releaseCaveat}</dd></div>
                          {marketSnapshot && (
                            <div>
                              <dt>Market snapshot</dt>
                              <dd>{formatUsd(marketCap, false)} · CoinMarketCap · {marketSnapshot.asOfTimestamp}</dd>
                            </div>
                          )}
                          {snapshot && <div><dt>Dated snapshot</dt><dd>{snapshot.summary}</dd></div>}
                        </dl>
                        <div className="candidate-sources" aria-label={`${candidate.symbol} sources`}>
                          <strong>{sources.length} sources</strong>
                          <div>
                            {sources.map((source) => (
                              <a href={source.url} key={source.url} target="_blank" rel="noreferrer" aria-label={`${source.label}, opens in a new tab`}>
                                {source.label}<ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ),
              ]
            })}
          </tbody>
        </table>
        {visibleCandidates.length === 0 && <div className="candidate-empty">No tracked assets match these filters.</div>}
      </div>
    </section>
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
  const drawerRef = useRef<HTMLFormElement>(null)
  const [draft, setDraft] = useState<TokenValueCaptureInput>(() => ({ ...token, sourceUrls: [...token.sourceUrls] }))
  const [error, setError] = useState('')
  const [sources, setSources] = useState(token.sourceUrls.join('\n'))

  useEffect(() => {
    const drawerElement = drawerRef.current
    if (!drawerElement) return

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = Array.from(drawerElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.offsetParent !== null)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    drawerElement.addEventListener('keydown', trapFocus)
    return () => drawerElement.removeEventListener('keydown', trapFocus)
  }, [])

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
      <form ref={drawerRef} className="drawer drawer-wide" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit token' : 'Add token'} onSubmit={submit}>
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
                <input id="token-name" className="input" autoFocus required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Example Protocol" />
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
                <input id="fdv" className="input" type="number" min="0" required value={draft.fdvUsd} onChange={(event) => setNumber('fdvUsd', event.target.value)} placeholder="900000000" />
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
                <input id="buybacks" className="input" type="number" min="0" required value={draft.executedBuybacksUsdInPeriod} onChange={(event) => setNumber('executedBuybacksUsdInPeriod', event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="direct-burns">Recurring direct burns in period</label>
                <input id="direct-burns" className="input" type="number" min="0" required value={draft.recurringDirectBurnsUsdInPeriod} onChange={(event) => setNumber('recurringDirectBurnsUsdInPeriod', event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="distributions">Holder distributions in period</label>
                <input id="distributions" className="input" type="number" min="0" required value={draft.holderDistributionsUsdInPeriod} onChange={(event) => setNumber('holderDistributionsUsdInPeriod', event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="destination">Buyback destination</label>
                <select id="destination" className="select" value={draft.buybackDestination} onChange={(event) => setDraft({ ...draft, buybackDestination: event.target.value as BuybackDestination })}>
                  {BUYBACK_DESTINATIONS.map((destination) => <option key={destination} value={destination}>{DESTINATION_LABELS[destination]}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="bought-burned">Bought and burned subset</label>
                <input id="bought-burned" className="input" type="number" min="0" value={draft.boughtAndBurnedUsdInPeriod ?? ''} onChange={(event) => setNumber('boughtAndBurnedUsdInPeriod', event.target.value)} />
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
                <input id="announced-buybacks" className="input" type="number" min="0" required value={draft.announcedBuybacksUsd} onChange={(event) => setNumber('announcedBuybacksUsd', event.target.value)} />
                <p className="field-hint">Shown as context and excluded from rank.</p>
              </div>
              <div className="field">
                <label htmlFor="one-off-burns">One-off burns</label>
                <input id="one-off-burns" className="input" type="number" min="0" required value={draft.oneOffBurnsUsd} onChange={(event) => setNumber('oneOffBurnsUsd', event.target.value)} />
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
      if (state.datasetType === 'illustrative') {
        throw new Error('Legacy demo datasets are no longer supported. Import sourced token data instead.')
      }
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
  const [releaseHorizonDays, setReleaseHorizonDays] =
    useState<ReleaseHorizonDays>(initial.releaseHorizonDays)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [editingToken, setEditingToken] = useState<TokenValueCaptureInput | null>(null)
  const tokenTriggerRef = useRef<HTMLElement | null>(null)
  const [search, setSearch] = useState('')
  const [mechanismFilter, setMechanismFilter] = useState<'all' | BuybackDestination>('all')
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | EvidenceLevel>('all')
  const [sort, setSort] = useState<SortState>({ key: 'rank', direction: 'asc' })
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const state: StoredState = {
      version: 3,
      tokens,
      factors,
      releaseHorizonDays,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [factors, releaseHorizonDays, tokens])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const closingTokenDrawer = drawer === 'token'
        setDrawer(null)
        setExportOpen(false)
        if (closingTokenDrawer) {
          window.requestAnimationFrame(() => tokenTriggerRef.current?.focus())
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

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

  const rememberTokenTrigger = () => {
    tokenTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  }

  const restoreTokenTrigger = () => {
    window.requestAnimationFrame(() => tokenTriggerRef.current?.focus())
  }

  const closeTokenDrawer = () => {
    setDrawer(null)
    restoreTokenTrigger()
  }

  const openAdd = () => {
    rememberTokenTrigger()
    setEditingToken(null)
    setDrawer('token')
  }

  const openEdit = (token: TokenValueCaptureInput) => {
    rememberTokenTrigger()
    setEditingToken(token)
    setDrawer('token')
  }

  const saveToken = (token: TokenValueCaptureInput) => {
    setTokens((current) => editingToken?.id
      ? current.map((item) => item.id === editingToken.id ? token : item)
      : [...current, token])
    setDrawer(null)
    restoreTokenTrigger()
    setToast(editingToken?.id ? `${token.symbol} updated` : `${token.symbol} added`)
  }

  const deleteToken = (token: TokenValueCaptureInput) => {
    if (!window.confirm(`Delete ${token.name} (${token.symbol}) from this local dataset?`)) return
    setTokens((current) => current.filter((item) => item.id !== token.id))
    setToast(`${token.symbol} removed`)
  }

  const exportJson = () => {
    const state: StoredState = {
      version: 3,
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
      version: 3,
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
          <button className="button button-ghost" type="button" onClick={() => setDrawer('methodology')}><CircleHelp size={15} /> Methodology</button>
        </div>
      </section>

      <ResearchCandidates
        candidates={RESEARCH_CANDIDATES}
        releaseHorizonDays={releaseHorizonDays}
        onReleaseHorizonChange={setReleaseHorizonDays}
      />

      {tokens.length > 0 ? <>
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
                            <TokenLogo id={row.input.id} name={row.input.name} symbol={row.input.symbol} />
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
                      <TokenLogo id={row.input.id} name={row.input.name} symbol={row.input.symbol} />
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
      </> : (
        <section className="dataset-empty-panel" aria-label="Personal ranking dataset">
          <div>
            <span className="research-kicker">Optional workspace</span>
            <h2>Build a ranked dataset</h2>
            <p>The market table stays read-only. Add or import fully sourced numbers when you are ready to calculate rankings.</p>
          </div>
          <div className="dataset-empty-actions">
            <button className="button" type="button" onClick={() => setDrawer('import')}><Upload size={15} /> Import data</button>
            <button className="button button-primary" type="button" onClick={openAdd}><Plus size={15} /> Add token</button>
          </div>
        </section>
      )}

      <button className="button button-primary mobile-add" type="button" onClick={openAdd}><Plus size={16} /> Add token</button>

      {drawer === 'token' && (
        <TokenDrawer token={editingToken ?? EMPTY_TOKEN} editingId={editingToken?.id} factors={factors} releaseHorizonDays={releaseHorizonDays} onClose={closeTokenDrawer} onSave={saveToken} />
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
