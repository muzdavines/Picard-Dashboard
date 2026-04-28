import { useState, useEffect } from 'react'
import {
  db, doc, onSnapshot, updateDoc, collection, getDocs, serverTimestamp,
} from '../firebase.js'
import { getCurrentWeekId } from '../utils/weekId.js'
import { buildWalmartSearchUrl } from '../services/ingredientAggregator.js'
import { logOrderAction, generateGroceryOrder } from '../services/dinnerService.js'
import { MEAL_LIBRARY } from '../services/mealLibrary.js'
import {
  getPantryProfile,
  updatePantryFlag,
  isAlwaysInPantry,
  isCurrentlyOnHand,
} from '../services/pantryProfileService.js'

const CARD = { background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const BTN_PRIMARY = { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }
const BTN_SM = { background: 'transparent', border: '1px solid #334155', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', color: '#94a3b8' }
const INPUT = { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none' }
const SECTION_LABEL = { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }

const STATUS_COLORS = {
  pending_review: '#f59e0b',
  confirmed: '#3b82f6',
  sent_to_store: '#a855f7',
  complete: '#22c55e',
}

const STATUS_LABELS = {
  pending_review: 'Pending Review',
  confirmed: 'Confirmed',
  sent_to_store: 'Sent to Store',
  complete: 'Complete',
}

const STATUS_HINTS = {
  pending_review: 'Review and adjust pantry exclusions, then confirm.',
  confirmed: 'Ready to send active items to Walmart+.',
  sent_to_store: 'Search tabs were sent. Finish shopping when done.',
  complete: 'Weekly grocery shopping is complete.',
}

const SECTION_ORDER = ['meat', 'produce', 'dairy', 'frozen', 'pantry']
const SECTION_LABELS = { meat: '🥩 Meat', produce: '🥦 Produce', dairy: '🥛 Dairy', frozen: '🧊 Frozen', pantry: '🫙 Pantry' }

function hydrateItem(item, pantryProfile) {
  const alwaysInPantry = isAlwaysInPantry(pantryProfile, item.name)
  const currentlyOnHand = isCurrentlyOnHand(pantryProfile, item.name)
  const legacyPantryOverride = !!item.pantryOverride
  const manualPantryExclude = item.manualPantryExclude ?? legacyPantryOverride
  const pantryExcluded = !!item.isPantryStaple || alwaysInPantry || currentlyOnHand || manualPantryExclude

  return {
    ...item,
    alwaysInPantry,
    currentlyOnHand,
    manualPantryExclude,
    pantryOverride: pantryExcluded,
    excludedReason: item.isPantryStaple
      ? 'staple'
      : alwaysInPantry
        ? 'always_have'
        : currentlyOnHand
          ? 'on_hand'
          : manualPantryExclude
            ? 'manual'
            : null,
  }
}

function hydrateItems(items, pantryProfile) {
  return (items || []).map(item => hydrateItem(item, pantryProfile))
}

export default function GroceryPage() {
  const weekId = getCurrentWeekId()
  const [order, setOrder] = useState(null)
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [newSection, setNewSection] = useState('pantry')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [walmartBlocked, setWalmartBlocked] = useState(false)
  const [expandedSections, setExpandedSections] = useState({ meat: true, produce: true, dairy: true, frozen: true, pantry: true })
  const [orderScope, setOrderScope] = useState('week')
  const [selectedMealIds, setSelectedMealIds] = useState([])
  const [pantryProfile, setPantryProfile] = useState(() => getPantryProfile())

  useEffect(() => {
    const ref = doc(db, 'groceryOrders', weekId)
    const unsub = onSnapshot(ref, (snap) => {
      setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })

    const logRef = collection(db, 'groceryOrders', weekId, 'log')
    getDocs(logRef).then(snap => {
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      entries.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      setLog(entries.slice(0, 5))
    }).catch(() => {})

    return unsub
  }, [weekId])

  useEffect(() => {
    if (!order) return
    if (order.mode === 'meals') {
      setOrderScope('meals')
      setSelectedMealIds(order.selectedMealIds || order.meals?.map(m => m.mealId).filter(Boolean) || [])
    } else {
      setOrderScope('week')
    }
  }, [order])

  function getAllItems() {
    if (!order) return []
    if (order.items && order.items.length > 0) return hydrateItems(order.items, pantryProfile)
    if (order.itemsBySection) {
      return hydrateItems(Object.values(order.itemsBySection).flat(), pantryProfile)
    }
    return []
  }

  function getItemsBySection() {
    const allItems = getAllItems()
    const bySection = {}
    for (const item of allItems) {
      const section = item.storeSection || 'pantry'
      if (!bySection[section]) bySection[section] = []
      bySection[section].push(item)
    }
    return bySection
  }

  async function writeItemsToOrder(updatedItems) {
    if (!order) return
    const ref = doc(db, 'groceryOrders', weekId)
    const items = updatedItems.map(item => ({
      ...item,
      pantryOverride: !!item.pantryOverride,
      manualPantryExclude: !!item.manualPantryExclude,
      alwaysInPantry: !!item.alwaysInPantry,
      currentlyOnHand: !!item.currentlyOnHand,
    }))

    const newBySection = {}
    for (const item of items) {
      const s = item.storeSection || 'pantry'
      if (!newBySection[s]) newBySection[s] = []
      newBySection[s].push(item)
    }

    try {
      await updateDoc(ref, { items, itemsBySection: newBySection })
    } catch (err) {
      setError('Failed to update item: ' + err.message)
    }
  }

  async function handleToggleCheck(item) {
    const newItems = getAllItems().map(i =>
      i.ingredientId === item.ingredientId ? { ...i, checked: !i.checked } : i
    )
    await writeItemsToOrder(newItems)
  }

  async function handleToggleManualExclude(item) {
    const newItems = getAllItems().map(i => {
      if (i.ingredientId !== item.ingredientId) return i
      const manualPantryExclude = !i.manualPantryExclude
      return hydrateItem({ ...i, manualPantryExclude }, pantryProfile)
    })
    await writeItemsToOrder(newItems)
  }

  async function handleToggleAlwaysInPantry(item) {
    const nextProfile = updatePantryFlag(pantryProfile, item.name, 'alwaysHave', !item.alwaysInPantry)
    setPantryProfile(nextProfile)

    const newItems = getAllItems().map(i => hydrateItem(i, nextProfile))
    await writeItemsToOrder(newItems)
  }

  async function handleToggleOnHand(item) {
    const nextProfile = updatePantryFlag(pantryProfile, item.name, 'onHandNow', !item.currentlyOnHand)
    setPantryProfile(nextProfile)

    const newItems = getAllItems().map(i => hydrateItem(i, nextProfile))
    await writeItemsToOrder(newItems)
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newItem.trim() || !order) return

    const item = hydrateItem({
      ingredientId: 'manual_' + Date.now(),
      name: newItem.trim(),
      qty: 1,
      unit: 'item',
      storeSection: newSection,
      isPantryStaple: false,
      walmartSearchTerm: newItem.trim(),
      walmartUrl: buildWalmartSearchUrl(newItem.trim()),
      checked: false,
      pantryOverride: false,
      manualPantryExclude: false,
      manuallyAdded: true,
    }, pantryProfile)

    const newItems = [...getAllItems(), item]
    await writeItemsToOrder(newItems)
    setNewItem('')
  }

  async function handleDeleteItem(item) {
    const allItems = getAllItems().filter(i => i.ingredientId !== item.ingredientId)
    await writeItemsToOrder(allItems)
  }

  async function handleConfirm() {
    if (!order || order.status !== 'pending_review') return
    setActionLoading(true)
    try {
      await updateDoc(doc(db, 'groceryOrders', weekId), { status: 'confirmed' })
      await logOrderAction(weekId, 'confirmed', 'Chauncey', 'user', {}, 'pending_review', 'confirmed')
      setMsg('List confirmed!')
    } catch (err) {
      setError('Failed to confirm: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSendToWalmart() {
    if (!order || order.status !== 'confirmed') return
    setActionLoading(true)

    const activeItems = getAllItems().filter(i => !i.checked && !i.pantryOverride)
    let blocked = false
    let opened = 0

    for (const item of activeItems) {
      const url = item.walmartUrl || buildWalmartSearchUrl(item.walmartSearchTerm || item.name)
      const win = window.open(url, '_blank')
      if (!win) { blocked = true; break }
      opened++
      await new Promise(r => setTimeout(r, 300))
    }

    if (blocked) setWalmartBlocked(true)

    try {
      await updateDoc(doc(db, 'groceryOrders', weekId), { status: 'sent_to_store' })
      await logOrderAction(weekId, 'sent_to_store', 'Chauncey', 'user', { itemCount: opened }, 'confirmed', 'sent_to_store')
      setMsg(`Opened ${opened} Walmart search tabs.${blocked ? ' (Some tabs may have been blocked by your browser.)' : ''}`)
    } catch (err) {
      setError('Failed to update status: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDoneShopping() {
    if (!order) return
    setActionLoading(true)
    try {
      await updateDoc(doc(db, 'groceryOrders', weekId), { status: 'complete', completedAt: serverTimestamp() })
      await logOrderAction(weekId, 'done_shopping', 'Chauncey', 'user', {}, order.status, 'complete')
      setMsg('Great job! Shopping marked complete.')
    } catch (err) {
      setError('Failed to complete: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  function toggleMealSelection(mealId) {
    setSelectedMealIds(prev => prev.includes(mealId)
      ? prev.filter(id => id !== mealId)
      : [...prev, mealId])
  }

  async function handleBuildOrder() {
    setActionLoading(true)
    setError('')
    try {
      await generateGroceryOrder(weekId, {
        mode: orderScope,
        mealIds: orderScope === 'meals' ? selectedMealIds : [],
        pantryProfile,
      })
      setMsg(orderScope === 'week' ? 'Grocery list built from this week winners.' : 'Grocery list built from selected meals.')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const allItems = getAllItems()
  const checkedCount = allItems.filter(i => i.checked).length
  const totalCount = allItems.length
  const excludedCount = allItems.filter(i => i.pantryOverride).length
  const toSendCount = allItems.filter(i => !i.checked && !i.pantryOverride).length
  const activeItems = allItems.filter(i => !i.checked && !i.pantryOverride)
  const itemsBySection = getItemsBySection()

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 24px' }}>Grocery List</h1>

      {error && (
        <div style={{ background: '#ef444420', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {msg && (
        <div style={{ background: '#22c55e20', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', color: '#86efac', fontSize: '0.875rem', marginBottom: '16px' }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: '#86efac', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={CARD}>
        <div style={SECTION_LABEL}>Order Scope</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
            <input type="radio" checked={orderScope === 'week'} onChange={() => setOrderScope('week')} style={{ marginRight: '8px' }} />
            This week winners
          </label>
          <label style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
            <input type="radio" checked={orderScope === 'meals'} onChange={() => setOrderScope('meals')} style={{ marginRight: '8px' }} />
            Select meals manually
          </label>
        </div>

        {orderScope === 'meals' && (
          <div style={{ marginTop: '12px', maxHeight: '220px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px', padding: '10px' }}>
            {MEAL_LIBRARY.map(meal => (
              <label key={meal.mealId} style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '6px' }}>
                <input
                  type="checkbox"
                  checked={selectedMealIds.includes(meal.mealId)}
                  onChange={() => toggleMealSelection(meal.mealId)}
                  style={{ marginRight: '8px' }}
                />
                {meal.name}
              </label>
            ))}
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          <button onClick={handleBuildOrder} style={BTN_PRIMARY} disabled={actionLoading || (orderScope === 'meals' && selectedMealIds.length === 0)}>
            {order ? '🔁 Rebuild Grocery List' : '🍽 Build Grocery List'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading grocery list...</p>
      ) : !order ? (
        <p style={{ color: '#94a3b8' }}>No grocery list for this week yet. Choose a scope above and build one.</p>
      ) : (
        <>
          <div style={{ ...CARD, padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: (STATUS_COLORS[order.status] || '#64748b') + '20',
                color: STATUS_COLORS[order.status] || '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                {STATUS_LABELS[order.status] || order.status}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{STATUS_HINTS[order.status]}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', color: '#cbd5e1', fontSize: '0.82rem' }}>
              <span>Total: <strong>{totalCount}</strong></span>
              <span>Excluded (pantry/on-hand): <strong>{excludedCount}</strong></span>
              <span>To send: <strong>{toSendCount}</strong></span>
              <span>Checked off: <strong>{checkedCount}</strong></span>
            </div>

            <div style={{ flex: 1, height: '6px', background: '#0f172a', borderRadius: '3px', minWidth: '80px', marginTop: '10px' }}>
              <div style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%', height: '100%', background: '#22c55e', borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              {order.status === 'pending_review' && (
                <button onClick={handleConfirm} style={BTN_PRIMARY} disabled={actionLoading}>
                  ✓ Confirm List
                </button>
              )}
              {order.status === 'confirmed' && (
                <button onClick={handleSendToWalmart} style={{ ...BTN_PRIMARY, background: '#0071dc' }} disabled={actionLoading}>
                  🛒 Send to Walmart+
                </button>
              )}
              {(order.status === 'sent_to_store' || order.status === 'confirmed') && (
                <button onClick={handleDoneShopping} style={{ ...BTN_GHOST, color: '#22c55e', borderColor: '#22c55e' }} disabled={actionLoading}>
                  ✓ Done Shopping
                </button>
              )}
              {order.status === 'complete' && (
                <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>Shopping complete!</span>
              )}
            </div>
          </div>

          {walmartBlocked && (
            <div style={{ ...CARD, borderLeft: '3px solid #f59e0b' }}>
              <div style={SECTION_LABEL}>Walmart Search Links (popup was blocked)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeItems.map(item => (
                  <a
                    key={item.ingredientId || item.name}
                    href={item.walmartUrl || buildWalmartSearchUrl(item.walmartSearchTerm || item.name)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#60a5fa', fontSize: '0.875rem', textDecoration: 'none' }}
                  >
                    → {item.name} {item.qty} {item.unit}
                  </a>
                ))}
              </div>
            </div>
          )}

          {SECTION_ORDER.map(section => {
            const sectionItems = (itemsBySection[section] || [])
            if (sectionItems.length === 0) return null
            const unchecked = sectionItems.filter(i => !i.checked)
            return (
              <div key={section} style={CARD}>
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedSections[section] ? '12px' : 0 }}
                >
                  <div style={{ ...SECTION_LABEL, margin: 0 }}>
                    {SECTION_LABELS[section] || section} <span style={{ fontWeight: 400 }}>({unchecked.length}/{sectionItems.length})</span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{expandedSections[section] ? '▲' : '▼'}</span>
                </button>

                {expandedSections[section] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sectionItems.map(item => (
                      <GroceryItem
                        key={item.ingredientId || item.name}
                        item={item}
                        onToggleCheck={() => handleToggleCheck(item)}
                        onToggleManualExclude={() => handleToggleManualExclude(item)}
                        onToggleAlwaysInPantry={() => handleToggleAlwaysInPantry(item)}
                        onToggleOnHand={() => handleToggleOnHand(item)}
                        onDelete={() => handleDeleteItem(item)}
                        orderStatus={order.status}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {order.status !== 'complete' && (
            <div style={CARD}>
              <div style={SECTION_LABEL}>Add Item Manually</div>
              <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  style={{ ...INPUT, flex: 1, minWidth: '160px' }}
                  placeholder="Item name..."
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                />
                <select
                  style={{ ...INPUT, width: 'auto' }}
                  value={newSection}
                  onChange={e => setNewSection(e.target.value)}
                >
                  {SECTION_ORDER.map(s => <option key={s} value={s}>{SECTION_LABELS[s] || s}</option>)}
                </select>
                <button type="submit" style={BTN_PRIMARY}>Add</button>
              </form>
            </div>
          )}

          {log.length > 0 && (
            <div style={CARD}>
              <div style={SECTION_LABEL}>Recent Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {log.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', flexShrink: 0 }}>
                      {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : '—'}
                    </span>
                    <span>{entry.action} by {entry.actor}</span>
                    {entry.newStatus && <span style={{ color: STATUS_COLORS[entry.newStatus] || '#64748b' }}>→ {STATUS_LABELS[entry.newStatus] || entry.newStatus}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function GroceryItem({ item, onToggleCheck, onToggleManualExclude, onToggleAlwaysInPantry, onToggleOnHand, onDelete, orderStatus }) {
  const exclusionLabel = item.excludedReason === 'staple'
    ? 'Pantry staple'
    : item.excludedReason === 'always_have'
      ? 'Always in pantry'
      : item.excludedReason === 'on_hand'
        ? 'Currently on hand'
        : item.excludedReason === 'manual'
          ? 'Manually excluded'
          : ''

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 6px',
      borderRadius: '6px',
      opacity: item.pantryOverride ? 0.45 : item.checked ? 0.6 : 1,
      transition: 'opacity 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <button
        onClick={onToggleCheck}
        style={{
          width: '18px', height: '18px',
          borderRadius: '4px',
          border: `2px solid ${item.checked ? '#22c55e' : '#334155'}`,
          background: item.checked ? '#22c55e20' : 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          color: '#22c55e',
          fontSize: '0.65rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >{item.checked && '✓'}</button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: '0.875rem',
          color: item.checked ? '#64748b' : '#f8fafc',
          textDecoration: item.checked || item.pantryOverride ? 'line-through' : 'none',
        }}>
          {item.name}
        </span>
        {(item.qty || item.unit) && (
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>
            {item.qty} {item.unit}
          </span>
        )}
        {item.fromMeals && item.fromMeals.length > 0 && (
          <span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: '6px' }}>
            ({item.fromMeals.join(', ')})
          </span>
        )}
        {!!exclusionLabel && (
          <span style={{ marginLeft: '8px', fontSize: '0.68rem', color: '#f59e0b' }}>
            • {exclusionLabel}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={onToggleAlwaysInPantry}
          title={item.alwaysInPantry ? 'Remove always-in-pantry' : 'Mark as always in pantry'}
          style={{
            ...BTN_SM,
            padding: '2px 6px',
            fontSize: '0.68rem',
            color: item.alwaysInPantry ? '#f59e0b' : '#64748b',
            borderColor: item.alwaysInPantry ? '#f59e0b' : '#334155',
          }}
        >Always</button>

        <button
          onClick={onToggleOnHand}
          title={item.currentlyOnHand ? 'Clear currently on-hand' : 'Mark as currently on hand'}
          style={{
            ...BTN_SM,
            padding: '2px 6px',
            fontSize: '0.68rem',
            color: item.currentlyOnHand ? '#22c55e' : '#64748b',
            borderColor: item.currentlyOnHand ? '#22c55e' : '#334155',
          }}
        >On hand</button>

        <button
          onClick={onToggleManualExclude}
          title={item.manualPantryExclude ? 'Include this item in Walmart send list' : 'Exclude this item from Walmart send list'}
          style={{
            ...BTN_SM,
            padding: '2px 6px',
            fontSize: '0.68rem',
            color: item.manualPantryExclude ? '#f59e0b' : '#475569',
            borderColor: item.manualPantryExclude ? '#f59e0b' : '#334155',
          }}
        >Exclude</button>

        {(item.walmartUrl || item.walmartSearchTerm) && !item.checked && orderStatus !== 'complete' && (
          <a
            href={item.walmartUrl || buildWalmartSearchUrl(item.walmartSearchTerm || item.name)}
            target="_blank"
            rel="noreferrer"
            style={{ ...BTN_SM, padding: '2px 6px', fontSize: '0.7rem', color: '#0071dc', borderColor: '#0071dc40', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            title="Search on Walmart"
          >
            🛒
          </a>
        )}

        <button
          onClick={onDelete}
          title="Remove from list"
          style={{ ...BTN_SM, padding: '2px 6px', fontSize: '0.7rem', color: '#475569' }}
          onMouseEnter={e => e.target.style.color = '#ef4444'}
          onMouseLeave={e => e.target.style.color = '#475569'}
        >✕</button>
      </div>
    </div>
  )
}
