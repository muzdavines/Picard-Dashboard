const STORAGE_KEY = 'picard-pantry-profile-v1'

function normalizeName(name = '') {
  return name.toLowerCase().trim()
}

function toMap(list = []) {
  const map = {}
  for (const item of list) {
    const normalized = normalizeName(item)
    if (normalized) map[normalized] = true
  }
  return map
}

function fromMap(map = {}) {
  return Object.entries(map)
    .filter(([, value]) => !!value)
    .map(([key]) => key)
}

export function getPantryProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { alwaysHave: {}, onHandNow: {} }
    }
    const parsed = JSON.parse(raw)
    const alwaysHave = parsed.alwaysHave || parsed.alwaysInPantry || {}
    const onHandNow = parsed.onHandNow || parsed.currentlyOnHand || {}

    return {
      alwaysHave: Array.isArray(alwaysHave) ? toMap(alwaysHave) : alwaysHave,
      onHandNow: Array.isArray(onHandNow) ? toMap(onHandNow) : onHandNow,
    }
  } catch {
    return { alwaysHave: {}, onHandNow: {} }
  }
}

export function savePantryProfile(profile) {
  const safeProfile = {
    alwaysHave: profile?.alwaysHave || {},
    onHandNow: profile?.onHandNow || {},
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      alwaysHave: fromMap(safeProfile.alwaysHave),
      onHandNow: fromMap(safeProfile.onHandNow),
    })
  )

  return safeProfile
}

export function isAlwaysInPantry(profile, ingredientName) {
  return !!profile?.alwaysHave?.[normalizeName(ingredientName)]
}

export function isCurrentlyOnHand(profile, ingredientName) {
  return !!profile?.onHandNow?.[normalizeName(ingredientName)]
}

export function getPantryFlags(profile, ingredientName) {
  return {
    alwaysHave: isAlwaysInPantry(profile, ingredientName),
    onHandNow: isCurrentlyOnHand(profile, ingredientName),
  }
}

export function updatePantryFlag(profile, ingredientName, key, value) {
  const normalized = normalizeName(ingredientName)
  if (!normalized) return profile

  const next = {
    alwaysHave: { ...(profile?.alwaysHave || {}) },
    onHandNow: { ...(profile?.onHandNow || {}) },
  }

  if (key === 'alwaysHave') {
    next.alwaysHave[normalized] = !!value
  }
  if (key === 'onHandNow') {
    next.onHandNow[normalized] = !!value
  }

  return savePantryProfile(next)
}
