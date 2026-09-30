import { z } from 'zod'

import {
  BUYBACK_DESTINATIONS,
  EVIDENCE_LEVELS,
  PROGRAM_STATUSES,
  type AdjustmentFactors,
  type ReleaseHorizonDays,
  type TokenValueCaptureInput,
} from './types'

const nonNegativeFiniteNumber = z
  .number()
  .finite()
  .min(0, 'Must be zero or greater')

const factor = nonNegativeFiniteNumber.max(
  1,
  'Adjustment factors must be between 0 and 1',
)

const httpUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
    message: 'Source URL must use http or https',
  })

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const TokenValueCaptureInputSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1, 'Project name is required').max(100),
    symbol: z
      .string()
      .trim()
      .min(1, 'Token symbol is required')
      .max(20)
      .transform((value) => value.toUpperCase()),
    circulatingMarketCapUsd: nonNegativeFiniteNumber.positive(
      'Circulating market cap must be greater than zero',
    ),
    fdvUsd: nonNegativeFiniteNumber,
    capturePeriodDays: z
      .number()
      .int('Capture period must be a whole number of days')
      .min(90, 'At least 90 days are required for a provisional run rate')
      .max(365),
    executedBuybacksUsdInPeriod: nonNegativeFiniteNumber,
    recurringDirectBurnsUsdInPeriod: nonNegativeFiniteNumber,
    holderDistributionsUsdInPeriod: nonNegativeFiniteNumber,
    boughtAndBurnedUsdInPeriod: nonNegativeFiniteNumber.optional(),
    announcedBuybacksUsd: nonNegativeFiniteNumber,
    oneOffBurnsUsd: nonNegativeFiniteNumber,
    unlockUsd7d: nonNegativeFiniteNumber.nullable().optional().default(null),
    inflationaryEmissionsUsd7d: nonNegativeFiniteNumber
      .nullable()
      .optional()
      .default(null),
    unlockUsd30d: nonNegativeFiniteNumber.nullable().optional().default(null),
    inflationaryEmissionsUsd30d: nonNegativeFiniteNumber
      .nullable()
      .optional()
      .default(null),
    unlockUsd90d: nonNegativeFiniteNumber.nullable().optional().default(null),
    inflationaryEmissionsUsd90d: nonNegativeFiniteNumber
      .nullable()
      .optional()
      .default(null),
    unlockUsd180d: nonNegativeFiniteNumber.nullable().optional().default(null),
    inflationaryEmissionsUsd180d: nonNegativeFiniteNumber
      .nullable()
      .optional()
      .default(null),
    unlockUsd365d: nonNegativeFiniteNumber.nullable(),
    inflationaryEmissionsUsd365d: nonNegativeFiniteNumber.nullable(),
    buybackDestination: z.enum(BUYBACK_DESTINATIONS),
    evidenceLevel: z.enum(EVIDENCE_LEVELS),
    programStatus: z.enum(PROGRAM_STATUSES),
    dataDate: z.string().refine(isCalendarDate, {
      message: 'Data date must be a valid YYYY-MM-DD date',
    }),
    sourceUrls: z.array(httpUrl).min(1, 'At least one source URL is required'),
  })
  .superRefine((input, context) => {
    if (input.fdvUsd < input.circulatingMarketCapUsd) {
      context.addIssue({
        code: 'custom',
        path: ['fdvUsd'],
        message: 'FDV must be at least the circulating market cap',
      })
    }

    if (
      input.boughtAndBurnedUsdInPeriod !== undefined &&
      input.boughtAndBurnedUsdInPeriod > input.executedBuybacksUsdInPeriod
    ) {
      context.addIssue({
        code: 'custom',
        path: ['boughtAndBurnedUsdInPeriod'],
        message: 'Bought-and-burned value cannot exceed executed buybacks',
      })
    }

    const cumulativeSeries = [
      {
        label: 'Unlock value',
        values: [
          input.unlockUsd7d,
          input.unlockUsd30d,
          input.unlockUsd90d,
          input.unlockUsd180d,
          input.unlockUsd365d,
        ],
        paths: [
          'unlockUsd7d',
          'unlockUsd30d',
          'unlockUsd90d',
          'unlockUsd180d',
          'unlockUsd365d',
        ],
      },
      {
        label: 'Inflationary emissions',
        values: [
          input.inflationaryEmissionsUsd7d,
          input.inflationaryEmissionsUsd30d,
          input.inflationaryEmissionsUsd90d,
          input.inflationaryEmissionsUsd180d,
          input.inflationaryEmissionsUsd365d,
        ],
        paths: [
          'inflationaryEmissionsUsd7d',
          'inflationaryEmissionsUsd30d',
          'inflationaryEmissionsUsd90d',
          'inflationaryEmissionsUsd180d',
          'inflationaryEmissionsUsd365d',
        ],
      },
    ] as const

    cumulativeSeries.forEach(({ label, values, paths }) => {
      values.forEach((earlier, earlierIndex) => {
        values.slice(earlierIndex + 1).forEach((later, offset) => {
          if (earlier !== null && later !== null && earlier > later) {
            context.addIssue({
              code: 'custom',
              path: [paths[earlierIndex + offset + 1]!],
              message: `${label} must be cumulative across release horizons`,
            })
          }
        })
      })
    })
  })

export const AdjustmentFactorsSchema = z.object({
  destination: z.object({
    burn: factor,
    lock: factor,
    treasury: factor,
    recycled: factor,
  }),
})

export const ReleaseHorizonDaysSchema = z.union([
  z.literal(7),
  z.literal(30),
  z.literal(90),
  z.literal(180),
  z.literal(365),
])

export function parseTokenInput(input: unknown): TokenValueCaptureInput {
  return TokenValueCaptureInputSchema.parse(input)
}

export function parseTokenInputs(inputs: unknown): TokenValueCaptureInput[] {
  return z.array(TokenValueCaptureInputSchema).parse(inputs)
}

export function parseAdjustmentFactors(input: unknown): AdjustmentFactors {
  return AdjustmentFactorsSchema.parse(input)
}

export function parseReleaseHorizonDays(input: unknown): ReleaseHorizonDays {
  return ReleaseHorizonDaysSchema.parse(input)
}
