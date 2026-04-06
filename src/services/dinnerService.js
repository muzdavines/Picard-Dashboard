import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  collection,
  getDocs,
  addDoc,
} from '../firebase.js'
import { getCurrentWeekId, getWeekStart, getWeekDates, DAY_NAMES, getDeviceId } from '../utils/weekId.js'
import { MEAL_LIBRARY } from './mealLibrary.js'
import { aggregateIngredients } from './ingredientAggregator.js'

export { getCurrentWeekId, getWeekStart }

/**
 * Ensure a dinnerPlans/{weekId} document exists.
 */
export async function getOrCreateWeek(weekId) {
  const ref = doc(db, 'dinnerPlans', weekId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    const weekStart = getWeekStart(weekId)
    const dates = getWeekDates(weekId)
    await setDoc(ref, {
      weekId,
      weekStart: weekStart.toISOString(),
      createdAt: serverTimestamp(),
    })
    // Pre-create day docs
    for (let i = 0; i < 7; i++) {
      const dayName = DAY_NAMES[i]
      const dayRef = doc(db, 'dinnerPlans', weekId, 'days', dayName)
      const daySnap = await getDoc(dayRef)
      if (!daySnap.exists()) {
        await setDoc(dayRef, {
          dayName,
          date: dates[i].toISOString(),
          options: [],
          winner: null,
          status: 'open',
        })
      }
    }
  }
  return snap.data()
}

/**
 * Get a day document snapshot.
 */
export async function getDayDoc(weekId, dayName) {
  const ref = doc(db, 'dinnerPlans', weekId, 'days', dayName)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

/**
 * Subscribe to all 7 day docs for a week. Returns unsubscribe function.
 */
export function subscribeWeekDays(weekId, callback) {
  const unsubs = []
  const dayData = {}
  let settled = 0

  for (const dayName of DAY_NAMES) {
    const ref = doc(db, 'dinnerPlans', weekId, 'days', dayName)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        dayData[dayName] = snap.data()
      } else {
        dayData[dayName] = { dayName, date: null, options: [], winner: null, status: 'open' }
      }
      settled++
      callback({ ...dayData })
    })
    unsubs.push(unsub)
  }

  return () => unsubs.forEach(u => u())
}

/**
 * Add a dinner option to a day.
 */
export async function addDinnerOption(weekId, dayName, option) {
  await getOrCreateWeek(weekId)
  const ref = doc(db, 'dinnerPlans', weekId, 'days', dayName)
  const snap = await getDoc(ref)
  const data = snap.exists() ? snap.data() : { dayName, date: null, options: [], winner: null, status: 'open' }

  const newOption = {
    optionId: 'opt_' + Date.now() + '_' + Math.random().toString(36).slice(2),
    mealId: option.mealId || null,
    name: option.name,
    addedBy: option.addedBy || 'Chauncey',
    addedAt: new Date().toISOString(),
    votes: 0,
    voters: [],
  }

  const options = [...(data.options || []), newOption]
  await setDoc(ref, { ...data, options }, { merge: true })
  return newOption
}

/**
 * Vote for an option using a Firestore transaction.
 * Prevents double-voting via localStorage device ID.
 * Auto-sets winner if any option crosses 50%.
 */
export async function voteForOption(weekId, dayName, optionId) {
  const deviceId = getDeviceId()
  const voteKey = `dinner-voted-${weekId}-${dayName}`
  const alreadyVoted = localStorage.getItem(voteKey) === optionId

  if (alreadyVoted) {
    throw new Error('You have already voted for this option.')
  }

  const ref = doc(db, 'dinnerPlans', weekId, 'days', dayName)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Day document not found')
    const data = snap.data()

    const options = data.options.map(opt => {
      if (opt.optionId !== optionId) return opt
      if (opt.voters && opt.voters.includes(deviceId)) {
        throw new Error('Already voted (server-side check)')
      }
      return {
        ...opt,
        votes: (opt.votes || 0) + 1,
        voters: [...(opt.voters || []), deviceId],
      }
    })

    // Check for majority winner
    const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0)
    let winner = data.winner
    for (const opt of options) {
      if (totalVotes > 0 && opt.votes / totalVotes > 0.5 && !winner) {
        winner = opt.optionId
        break
      }
    }

    tx.set(ref, { ...data, options, winner }, { merge: true })
  })

  localStorage.setItem(voteKey, optionId)
}

/**
 * Manually set a winner for a day.
 */
export async function setWinner(weekId, dayName, optionId, setBy = 'Chauncey') {
  const ref = doc(db, 'dinnerPlans', weekId, 'days', dayName)
  await updateDoc(ref, { winner: optionId, winnerSetBy: setBy, winnerSetAt: new Date().toISOString() })
}

/**
 * Generate a grocery order from winning meals for the week.
 * Idempotent: won't overwrite confirmed/sent_to_store/complete orders.
 */
export async function generateGroceryOrder(weekId) {
  // Check existing order
  const orderRef = doc(db, 'groceryOrders', weekId)
  const existingSnap = await getDoc(orderRef)
  if (existingSnap.exists()) {
    const existing = existingSnap.data()
    const protectedStatuses = ['confirmed', 'sent_to_store', 'complete']
    if (protectedStatuses.includes(existing.status)) {
      throw new Error(`Cannot overwrite grocery order with status "${existing.status}"`)
    }
  }

  // Gather winning meals
  const winningMeals = []
  const dayDocs = []

  for (const dayName of DAY_NAMES) {
    const dayRef = doc(db, 'dinnerPlans', weekId, 'days', dayName)
    const snap = await getDoc(dayRef)
    if (snap.exists()) dayDocs.push(snap.data())
  }

  const daysWithWinners = dayDocs.filter(d => d.winner)
  if (daysWithWinners.length < 4) {
    throw new Error('Need at least 4 days with winners to generate grocery list.')
  }

  for (const dayDoc of daysWithWinners) {
    const winningOption = (dayDoc.options || []).find(o => o.optionId === dayDoc.winner)
    if (winningOption && winningOption.mealId) {
      const meal = MEAL_LIBRARY.find(m => m.mealId === winningOption.mealId)
      if (meal) winningMeals.push(meal)
    }
  }

  const { items, itemsBySection } = aggregateIngredients(winningMeals, {})

  const orderData = {
    weekId,
    status: 'pending_review',
    createdAt: serverTimestamp(),
    meals: winningMeals.map(m => ({ mealId: m.mealId, name: m.name })),
    items: items.map(item => ({
      ...item,
      checked: false,
      pantryOverride: false,
    })),
    itemsBySection: Object.fromEntries(
      Object.entries(itemsBySection).map(([section, sItems]) => [
        section,
        sItems.map(item => ({ ...item, checked: false, pantryOverride: false }))
      ])
    ),
  }

  await setDoc(orderRef, orderData)
  await logOrderAction(weekId, 'created', 'Chauncey', 'user', { mealCount: winningMeals.length, itemCount: items.length }, null, 'pending_review')

  return orderData
}

/**
 * Log an action to the groceryOrdersLog subcollection.
 */
export async function logOrderAction(weekId, action, actor, actorType, details, prevStatus, newStatus) {
  const logRef = collection(db, 'groceryOrders', weekId, 'log')
  await addDoc(logRef, {
    action,
    actor,
    actorType,
    details: details || {},
    prevStatus,
    newStatus,
    timestamp: serverTimestamp(),
  })
}
