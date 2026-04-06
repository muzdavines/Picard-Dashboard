/**
 * Returns the ISO week number (1-53) for a given Date.
 */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Returns the ISO year for a given Date (may differ from calendar year near year boundaries).
 */
function getISOYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}

/**
 * Returns the current week ID in YYYY-WNN format.
 */
export function getCurrentWeekId() {
  return getWeekIdForDate(new Date())
}

/**
 * Returns YYYY-WNN format for a given date.
 */
export function getWeekIdForDate(date) {
  const week = getISOWeek(date)
  const year = getISOYear(date)
  const weekStr = String(week).padStart(2, '0')
  return `${year}-W${weekStr}`
}

/**
 * Returns the Monday Date for the given weekId (YYYY-WNN).
 */
export function getWeekStart(weekId) {
  const [yearStr, weekPart] = weekId.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekPart, 10)

  // Jan 4th is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  // Monday of week 1
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1)

  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  return monday
}

/**
 * Returns array of 7 Date objects Mon-Sun for the given weekId.
 */
export function getWeekDates(weekId) {
  const monday = getWeekStart(weekId)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    return d
  })
}

/**
 * Generate or retrieve a persistent device fingerprint from localStorage.
 */
export function getDeviceId() {
  const key = 'picard-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = 'device-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(key, id)
  }
  return id
}

export const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
