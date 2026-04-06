import { useState, useEffect } from 'react'
import { db, collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, where } from '../firebase.js'

const CARD = { background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const BTN_PRIMARY = { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }
const INPUT = { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none' }
const SECTION_LABEL = { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }

const CATEGORIES = ['personal', 'school', 'church', 'legal', 'wife']
const CATEGORY_COLORS = {
  personal: '#a855f7',
  school: '#3b82f6',
  church: '#22c55e',
  legal: '#f97316',
  wife: '#ec4899',
}

function getWeekDays(date) {
  const d = new Date(date)
  // Go to Monday
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  const days = []
  for (let i = 0; i < 7; i++) {
    const cur = new Date(d)
    cur.setDate(d.getDate() + i)
    days.push(cur)
  }
  return days
}

function dateToStr(d) {
  return d.toISOString().split('T')[0]
}

function formatDay(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function CalendarPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekAnchor, setWeekAnchor] = useState(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({ title: '', date: dateToStr(new Date()), startTime: '', endTime: '', category: 'personal', notes: '' })
  const [addError, setAddError] = useState('')

  const weekDays = getWeekDays(weekAnchor)
  const weekStart = dateToStr(weekDays[0])
  const weekEnd = dateToStr(weekDays[6])

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'))
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  async function handleAddEvent(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) { setAddError('Title and date are required.'); return }
    setAddError('')
    try {
      await addDoc(collection(db, 'calendarEvents'), {
        ...form,
        title: form.title.trim(),
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      })
      setForm({ title: '', date: dateToStr(new Date()), startTime: '', endTime: '', category: 'personal', notes: '' })
      setShowAddForm(false)
    } catch (err) {
      setAddError('Failed to add event: ' + err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, 'calendarEvents', id))
    } catch (err) {
      console.error(err)
    }
  }

  const todayStr = dateToStr(new Date())

  const filteredEvents = events.filter(e => filterCat === 'all' || e.category === filterCat)

  // Group events by date for week view
  const eventsByDate = {}
  for (const day of weekDays) {
    eventsByDate[dateToStr(day)] = []
  }
  for (const event of filteredEvents) {
    if (event.date >= weekStart && event.date <= weekEnd) {
      if (!eventsByDate[event.date]) eventsByDate[event.date] = []
      eventsByDate[event.date].push(event)
    }
  }

  // Sort events in each day by start time
  for (const dateKey of Object.keys(eventsByDate)) {
    eventsByDate[dateKey].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, flex: 1 }}>Calendar</h1>
        <button
          onClick={() => setWeekAnchor(new Date())}
          style={{ ...BTN_GHOST, color: '#f59e0b', borderColor: '#f59e0b', fontSize: '0.75rem', padding: '4px 10px' }}
        >
          Today
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate() - 7); setWeekAnchor(d) }} style={BTN_GHOST}>‹</button>
          <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate() + 7); setWeekAnchor(d) }} style={BTN_GHOST}>›</button>
        </div>
        <button onClick={() => setShowAddForm(f => !f)} style={BTN_PRIMARY}>
          {showAddForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button
          onClick={() => setFilterCat('all')}
          style={{ ...BTN_GHOST, borderColor: filterCat === 'all' ? '#f8fafc' : '#334155', color: filterCat === 'all' ? '#f8fafc' : '#94a3b8', fontSize: '0.75rem', padding: '4px 10px' }}
        >All</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              ...BTN_GHOST,
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderColor: filterCat === cat ? CATEGORY_COLORS[cat] : '#334155',
              color: filterCat === cat ? CATEGORY_COLORS[cat] : '#94a3b8',
            }}
          >{cat}</button>
        ))}
      </div>

      {/* Add event form */}
      {showAddForm && (
        <div style={{ ...CARD, borderLeft: '3px solid #f59e0b', marginBottom: '20px' }}>
          <div style={SECTION_LABEL}>New Event</div>
          <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input style={INPUT} placeholder="Event title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input type="date" style={{ ...INPUT, flex: 1 }} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              <input type="time" style={{ ...INPUT, flex: 1 }} placeholder="Start" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              <input type="time" style={{ ...INPUT, flex: 1 }} placeholder="End" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
            <select style={INPUT} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={INPUT} placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            {addError && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{addError}</p>}
            <button type="submit" style={{ ...BTN_PRIMARY, alignSelf: 'flex-start' }}>Save Event</button>
          </form>
        </div>
      )}

      {/* Week view */}
      {loading ? (
        <p style={{ color: '#64748b' }}>Loading events...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', overflowX: 'auto' }}>
          {weekDays.map((day) => {
            const dateKey = dateToStr(day)
            const dayEvents = eventsByDate[dateKey] || []
            const isToday = dateKey === todayStr
            return (
              <div key={dateKey} style={{
                background: '#1e293b',
                borderRadius: '10px',
                padding: '12px',
                minHeight: '120px',
                borderTop: isToday ? '3px solid #f59e0b' : '3px solid transparent',
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isToday ? '#f59e0b' : '#94a3b8', textTransform: 'uppercase' }}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: isToday ? '#f59e0b' : '#f8fafc' }}>
                    {day.getUTCDate()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      style={{
                        background: (CATEGORY_COLORS[event.category] || '#64748b') + '25',
                        borderLeft: `2px solid ${CATEGORY_COLORS[event.category] || '#64748b'}`,
                        borderRadius: '4px',
                        padding: '4px 6px',
                        cursor: 'default',
                        position: 'relative',
                      }}
                      title={event.title + (event.notes ? '\n' + event.notes : '')}
                    >
                      {event.startTime && <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{event.startTime}</div>}
                      <div style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 500, wordBreak: 'break-word' }}>{event.title}</div>
                      <button
                        onClick={() => handleDelete(event.id)}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.6rem', lineHeight: 1, padding: '1px' }}
                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                        onMouseLeave={e => e.target.style.color = '#475569'}
                        title="Delete"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
        {CATEGORIES.map(cat => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: CATEGORY_COLORS[cat] }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
