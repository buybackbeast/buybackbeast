import { describe, expect, it } from 'vitest'

import { getHourlyRefreshTiming } from './marketRefresh'

describe('hourly market-cap refresh timing', () => {
  it('counts down to minute 17 before the scheduled run', () => {
    expect(getHourlyRefreshTiming(
      Date.parse('2026-09-30T19:00:00.000Z'),
      '2026-09-30T18:17:00.000Z',
    )).toMatchObject({ kind: 'countdown', minutes: 17 })
  })

  it('counts down to the next hour after the current snapshot arrives', () => {
    expect(getHourlyRefreshTiming(
      Date.parse('2026-09-30T19:30:00.000Z'),
      '2026-09-30T19:16:00.000Z',
    )).toMatchObject({ kind: 'countdown', minutes: 47 })
  })

  it('rounds a partial minute up for a readable countdown', () => {
    expect(getHourlyRefreshTiming(
      Date.parse('2026-09-30T19:16:01.000Z'),
      '2026-09-30T18:17:00.000Z',
    )).toMatchObject({ kind: 'countdown', minutes: 1 })
  })

  it('shows refreshing while a newly scheduled deployment is running', () => {
    expect(getHourlyRefreshTiming(
      Date.parse('2026-09-30T19:20:00.000Z'),
      '2026-09-30T18:30:00.000Z',
    )).toMatchObject({ kind: 'refreshing' })
  })

  it('marks an update delayed after the deployment grace window', () => {
    expect(getHourlyRefreshTiming(
      Date.parse('2026-09-30T19:33:00.000Z'),
      '2026-09-30T18:30:00.000Z',
    )).toMatchObject({ kind: 'delayed' })
  })

  it('fails closed for an invalid snapshot timestamp', () => {
    expect(getHourlyRefreshTiming(
      Date.parse('2026-09-30T19:00:00.000Z'),
      'not-a-date',
    )).toMatchObject({ kind: 'delayed' })
  })
})
