const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const SNAPSHOT_TOLERANCE_MS = 10 * MINUTE_MS
const REFRESHING_WINDOW_MS = 15 * MINUTE_MS

export const MARKET_CAP_REFRESH_MINUTE_UTC = 17

export type HourlyRefreshTiming =
  | { kind: 'countdown'; minutes: number; nextRefreshAt: number }
  | { kind: 'refreshing'; nextRefreshAt: number }
  | { kind: 'delayed'; nextRefreshAt: number }

function getScheduledTimeForHour(nowMs: number, scheduledMinute: number): number {
  const scheduled = new Date(nowMs)
  scheduled.setUTCMinutes(scheduledMinute, 0, 0)
  return scheduled.getTime()
}

/**
 * Estimates the next hourly deployment from the GitHub Actions schedule.
 * A short tolerance accounts for CoinMarketCap quote timestamps preceding the
 * workflow start, and a grace window avoids showing a fresh 60-minute timer
 * while the current deployment is still running.
 */
export function getHourlyRefreshTiming(
  nowMs: number,
  latestSnapshotTimestamp: string,
  scheduledMinute = MARKET_CAP_REFRESH_MINUTE_UTC,
): HourlyRefreshTiming {
  if (!Number.isFinite(nowMs)
    || !Number.isInteger(scheduledMinute)
    || scheduledMinute < 0
    || scheduledMinute > 59) {
    return { kind: 'delayed', nextRefreshAt: nowMs }
  }

  const latestSnapshotMs = Date.parse(latestSnapshotTimestamp)
  const scheduledThisHour = getScheduledTimeForHour(nowMs, scheduledMinute)

  if (!Number.isFinite(latestSnapshotMs)) {
    return { kind: 'delayed', nextRefreshAt: scheduledThisHour }
  }

  if (nowMs < scheduledThisHour) {
    return {
      kind: 'countdown',
      minutes: Math.ceil((scheduledThisHour - nowMs) / MINUTE_MS),
      nextRefreshAt: scheduledThisHour,
    }
  }

  const nextRefreshAt = scheduledThisHour + HOUR_MS
  const hasCurrentCycleSnapshot = latestSnapshotMs >= scheduledThisHour - SNAPSHOT_TOLERANCE_MS

  if (hasCurrentCycleSnapshot) {
    return {
      kind: 'countdown',
      minutes: Math.ceil((nextRefreshAt - nowMs) / MINUTE_MS),
      nextRefreshAt,
    }
  }

  if (nowMs - scheduledThisHour <= REFRESHING_WINDOW_MS) {
    return { kind: 'refreshing', nextRefreshAt }
  }

  return { kind: 'delayed', nextRefreshAt }
}
