import { useState, useEffect, useCallback } from 'react'
import {
  getCurrentWeekId,
  getWeekStart,
  subscribeWeekDays,
  getOrCreateWeek,
  addDinnerOption,
  voteForOption,
  setWinner,
  generateGroceryOrder,
} from '../services/dinnerService.js'
import { MEAL_LIBRARY } from '../services/mealLibrary.js'
import { getWeekDates, DAY_NAMES, DAY_FULL, getDeviceId } from '../utils/weekId.js'

const CARD = { background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '12px' }
const BTN_PRIMARY = { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }
const BTN_SM = { background: 'transparent', border: '1px solid #334155', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', color: '#94a3b8' }
const INPUT = { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none' }

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function isToday(dateStr) {
  if (!dateStr) return false
  const today = new Date().toISOString().split('T')[0]
  return dateStr.startsWith(today)
}

export default function DinnerPage() {
  const [weekId, setWeekId] = useState(getCurrentWeekId())
  const [weekDays, setWeekDays] = useState({})
  const [weekDates, setWeekDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeModal, setActiveModal] = useState(null) // { type: 'addOption' | 'mealLibrary', dayName }
  const [groceryLoading, setGroceryLoading] = useState(false)
  const [groceryMsg, setGroceryMsg] = useState('')
  const [customMealInput, setCustomMealInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [voteErrors, setVoteErrors] = useState({})

  useEffect(() => {
    setLoading(true)
    setError('')
    const dates = getWeekDates(weekId)
    setWeekDates(dates)

    getOrCreateWeek(weekId).catch(err => setError('Failed to initialize week: ' + err.message))

    const unsub = subscribeWeekDays(weekId, (days) => {
      setWeekDays(days)
      setLoading(false)
    })
    return unsub
  }, [weekId])

  function prevWeek() {
    const [yearStr, weekPart] = weekId.split('-W')
    let week = parseInt(weekPart) - 1
    let year = parseInt(yearStr)
    if (week < 1) { year -= 1; week = 52 }
    setWeekId(`${year}-W${String(week).padStart(2, '0')}`)
  }

  function nextWeek() {
    const [yearStr, weekPart] = weekId.split('-W')
    let week = parseInt(weekPart) + 1
    let year = parseInt(yearStr)
    if (week > 52) { year += 1; week = 1 }
    setWeekId(`${year}-W${String(week).padStart(2, '0')}`)
  }

  async function handleVote(dayName, optionId) {
    setVoteErrors(prev => ({ ...prev, [dayName]: '' }))
    try {
      await voteForOption(weekId, dayName, optionId)
    } catch (err) {
      setVoteErrors(prev => ({ ...prev, [dayName]: err.message }))
    }
  }

  async function handleSetWinner(dayName, optionId) {
    try {
      await setWinner(weekId, dayName, optionId, 'Chauncey')
    } catch (err) {
      setError('Failed to set winner: ' + err.message)
    }
  }

  async function handleAddCustomMeal(dayName) {
    if (!customMealInput.trim()) return
    try {
      await addDinnerOption(weekId, dayName, { name: customMealInput.trim(), addedBy: 'Chauncey' })
      setCustomMealInput('')
      setActiveModal(null)
    } catch (err) {
      setError('Failed to add option: ' + err.message)
    }
  }

  async function handleAddFromLibrary(dayName, meal) {
    try {
      await addDinnerOption(weekId, dayName, { name: meal.name, mealId: meal.mealId, addedBy: 'Chauncey' })
      setActiveModal(null)
    } catch (err) {
      setError('Failed to add meal: ' + err.message)
    }
  }

  async function handleGenerateGrocery() {
    setGroceryLoading(true)
    setGroceryMsg('')
    try {
      await generateGroceryOrder(weekId)
      setGroceryMsg('Grocery list created! Head to the Grocery page.')
    } catch (err) {
      setGroceryMsg('Error: ' + err.message)
    } finally {
      setGroceryLoading(false)
    }
  }

  const daysWithWinners = Object.values(weekDays).filter(d => d && d.winner).length
  const canGenerateGrocery = daysWithWinners >= 4

  const weekStart = getWeekStart(weekId)
  const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

  const filteredMeals = MEAL_LIBRARY.filter(m =>
    !searchQuery ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, flex: 1 }}>
          Dinner Planner
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={prevWeek} style={BTN_GHOST}>‹</button>
          <span style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 500, minWidth: '140px', textAlign: 'center' }}>
            Week of {weekLabel}
          </span>
          <button onClick={nextWeek} style={BTN_GHOST}>›</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#ef444420', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Week progress */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {daysWithWinners}/7 days planned
        </span>
        <div style={{ flex: 1, height: '6px', background: '#1e293b', borderRadius: '3px', minWidth: '100px' }}>
          <div style={{ width: `${(daysWithWinners / 7) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '3px', transition: 'width 0.3s' }} />
        </div>
        <button
          onClick={handleGenerateGrocery}
          disabled={!canGenerateGrocery || groceryLoading}
          style={{
            ...BTN_PRIMARY,
            opacity: canGenerateGrocery ? 1 : 0.5,
            cursor: canGenerateGrocery ? 'pointer' : 'not-allowed',
            padding: '6px 14px',
            fontSize: '0.8rem',
          }}
        >
          {groceryLoading ? 'Generating...' : '🛒 Generate Grocery List'}
        </button>
      </div>
      {groceryMsg && (
        <div style={{ background: '#22c55e20', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', color: '#86efac', fontSize: '0.875rem', marginBottom: '16px' }}>
          {groceryMsg}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading week...</p>
      ) : (
        <div className="week-grid">
          {DAY_NAMES.map((dayName, i) => {
            const dayDoc = weekDays[dayName] || { dayName, options: [], winner: null }
            const dateStr = weekDates[i] ? weekDates[i].toISOString().split('T')[0] : ''
            return (
              <DayCard
                key={dayName}
                dayName={dayName}
                dayLabel={DAY_FULL[i]}
                dateStr={dateStr}
                dayDoc={dayDoc}
                voteError={voteErrors[dayName]}
                onVote={(optId) => handleVote(dayName, optId)}
                onSetWinner={(optId) => handleSetWinner(dayName, optId)}
                onAddOption={() => setActiveModal({ type: 'addOption', dayName })}
              />
            )
          })}
        </div>
      )}

      {/* Bottom sheet modal — Add Option */}
      {activeModal && (
        <BottomSheet onClose={() => { setActiveModal(null); setCustomMealInput(''); setSearchQuery('') }}>
          <div style={{ padding: '20px 20px 0' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', margin: '0 0 16px', fontWeight: 600 }}>
              Add dinner for {DAY_FULL[DAY_NAMES.indexOf(activeModal.dayName)]}
            </h2>

            {/* Custom meal */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Custom Meal</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={{ ...INPUT, flex: 1 }}
                  placeholder="Type a meal name..."
                  value={customMealInput}
                  onChange={e => setCustomMealInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomMeal(activeModal.dayName)}
                  autoFocus
                />
                <button onClick={() => handleAddCustomMeal(activeModal.dayName)} style={BTN_PRIMARY}>Add</button>
              </div>
            </div>

            {/* Meal library */}
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>From Meal Library</div>
            <input
              style={{ ...INPUT, width: '100%', marginBottom: '12px' }}
              placeholder="Search meals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '340px', padding: '0 20px 20px' }}>
            {filteredMeals.map(meal => (
              <div
                key={meal.mealId}
                onClick={() => handleAddFromLibrary(activeModal.dayName, meal)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '6px',
                  background: '#0f172a',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e3a5f'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{meal.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {meal.prepMinutes + meal.cookMinutes} min · {meal.servings} servings
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {meal.tags.slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: '0.65rem', background: '#334155', color: '#94a3b8', padding: '1px 5px', borderRadius: '3px' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <button style={{ ...BTN_SM, color: '#f59e0b', borderColor: '#f59e0b' }}>+ Add</button>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

function DayCard({ dayName, dayLabel, dateStr, dayDoc, voteError, onVote, onSetWinner, onAddOption }) {
  const options = dayDoc.options || []
  const winner = dayDoc.winner
  const totalVotes = options.reduce((s, o) => s + (o.votes || 0), 0)
  const today = isToday(dateStr)
  const winnerOption = options.find(o => o.optionId === winner)
  const deviceId = getDeviceId()
  const votedOptionId = localStorage.getItem(`dinner-voted-${dayDoc.weekId || ''}-${dayName}`)

  return (
    <div style={{
      ...CARD,
      borderTop: winner ? '3px solid #22c55e' : today ? '3px solid #f59e0b' : '3px solid #334155',
      position: 'relative',
    }}>
      {/* Day header */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: today ? '#f59e0b' : '#f8fafc' }}>
              {dayLabel}
              {today && <span style={{ fontSize: '0.65rem', background: '#f59e0b20', color: '#f59e0b', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px', fontWeight: 600 }}>TODAY</span>}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatShortDate(dateStr)}</div>
          </div>
          {winner && (
            <span style={{ fontSize: '0.65rem', background: '#22c55e20', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              WINNER
            </span>
          )}
        </div>
      </div>

      {/* Winner banner */}
      {winnerOption && (
        <div style={{ background: '#22c55e15', border: '1px solid #22c55e40', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600 }}>
            🏆 {winnerOption.name}
          </div>
        </div>
      )}

      {/* Options */}
      {options.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 10px' }}>No options yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {options.map(option => {
            const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
            const isWinner = option.optionId === winner
            const hasVoted = votedOptionId === option.optionId || (option.voters && option.voters.includes(deviceId))
            return (
              <div key={option.optionId} style={{
                background: '#0f172a',
                borderRadius: '8px',
                padding: '8px 10px',
                border: isWinner ? '1px solid #22c55e50' : '1px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: isWinner ? '#86efac' : '#e2e8f0', fontWeight: isWinner ? 600 : 400, flex: 1, marginRight: '6px' }}>
                    {option.name}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{option.votes || 0}</span>
                    <button
                      onClick={() => onVote(option.optionId)}
                      disabled={!!winner || hasVoted}
                      title={hasVoted ? "You already voted" : "Vote for this"}
                      style={{
                        ...BTN_SM,
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        color: hasVoted ? '#22c55e' : '#f59e0b',
                        borderColor: hasVoted ? '#22c55e' : '#f59e0b50',
                        opacity: winner && !isWinner ? 0.4 : 1,
                        cursor: (winner || hasVoted) ? 'default' : 'pointer',
                      }}
                    >
                      {hasVoted ? '✓' : '▲'}
                    </button>
                    {!winner && (
                      <button
                        onClick={() => onSetWinner(option.optionId)}
                        title="Set as winner (Chauncey override)"
                        style={{ ...BTN_SM, padding: '2px 6px', fontSize: '0.65rem', color: '#94a3b8', borderColor: '#334155' }}
                      >
                        👑
                      </button>
                    )}
                  </div>
                </div>
                {totalVotes > 0 && (
                  <div style={{ height: '3px', background: '#1e293b', borderRadius: '2px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: isWinner ? '#22c55e' : '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {voteError && (
        <p style={{ fontSize: '0.75rem', color: '#fca5a5', margin: '0 0 8px' }}>{voteError}</p>
      )}

      {/* Add option button */}
      <button
        onClick={onAddOption}
        style={{ ...BTN_SM, width: '100%', textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}
        onMouseEnter={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.color = '#f59e0b' }}
        onMouseLeave={e => { e.target.style.borderColor = '#334155'; e.target.style.color = '#64748b' }}
      >
        + Add option
      </button>
    </div>
  )
}

function BottomSheet({ children, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1e293b',
        borderRadius: '20px 20px 0 0',
        zIndex: 201,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
          <div style={{ width: '40px', height: '4px', background: '#334155', borderRadius: '2px', margin: '0 auto' }} />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', position: 'absolute', right: '16px', top: '12px' }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  )
}
