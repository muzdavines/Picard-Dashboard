import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  db, collection, query, where, onSnapshot, orderBy,
  addDoc, serverTimestamp, doc, getDoc,
} from '../firebase.js'
import { getCurrentWeekId, DAY_NAMES } from '../utils/weekId.js'

const CARD = { background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const SECTION_LABEL = { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }
const INPUT = { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none' }
const BTN_PRIMARY = { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function todayDayName() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

export default function HomePage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [quickTask, setQuickTask] = useState('')
  const [tonightDinner, setTonightDinner] = useState(null)
  const [groceryCount, setGroceryCount] = useState(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekId = getCurrentWeekId()
  const dayName = todayDayName()

  useEffect(() => {
    // Subscribe to today's calendar events
    const eventsRef = collection(db, 'calendarEvents')
    const q = query(eventsRef, where('date', '==', todayStr))
    const unsub1 = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => setEvents([]))

    // Subscribe to tasks
    const tasksRef = collection(db, 'tasks')
    const tasksQ = query(tasksRef, where('completed', '==', false))
    const unsub2 = onSnapshot(tasksQ, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => { setTasks([]); setLoading(false) })

    // Get tonight's dinner winner
    const dinnerRef = doc(db, 'dinnerPlans', weekId, 'days', dayName)
    const unsub3 = onSnapshot(dinnerRef, snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.winner) {
          const winnerOption = (data.options || []).find(o => o.optionId === data.winner)
          setTonightDinner(winnerOption ? winnerOption.name : null)
        }
      }
    }, () => {})

    // Get grocery remaining count
    const groceryRef = doc(db, 'groceryOrders', weekId)
    getDoc(groceryRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        const items = data.items || []
        const remaining = items.filter(i => !i.checked).length
        setGroceryCount(remaining)
      }
    }).catch(() => {})

    return () => { unsub1(); unsub2(); unsub3() }
  }, [todayStr, weekId, dayName])

  const dueTodayTasks = tasks.filter(t => t.dueDate === todayStr)
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr)

  async function handleQuickTask(e) {
    e.preventDefault()
    if (!quickTask.trim()) return
    try {
      await addDoc(collection(db, 'tasks'), {
        title: quickTask.trim(),
        priority: 'med',
        role: 'personal',
        dueDate: todayStr,
        completed: false,
        createdAt: serverTimestamp(),
      })
      setQuickTask('')
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }

  const CATEGORY_COLORS = {
    personal: '#a855f7',
    school: '#3b82f6',
    church: '#22c55e',
    legal: '#f97316',
    wife: '#ec4899',
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          {getGreeting()}, Chauncey
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.9rem' }}>{formatDate(today)}</p>
      </div>

      <div className="today-grid">
        {/* Left column */}
        <div>
          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <StatCard
              label="Due Today"
              value={dueTodayTasks.length}
              color="#f59e0b"
              onClick={() => navigate('/tasks')}
            />
            <StatCard
              label="Overdue"
              value={overdueTasks.length}
              color={overdueTasks.length > 0 ? '#ef4444' : '#22c55e'}
              onClick={() => navigate('/tasks')}
            />
            <StatCard
              label="Tonight"
              value={tonightDinner || '—'}
              color="#a855f7"
              onClick={() => navigate('/dinner')}
              small
            />
            {groceryCount !== null && (
              <StatCard
                label="Grocery items"
                value={groceryCount}
                color="#3b82f6"
                onClick={() => navigate('/grocery')}
              />
            )}
          </div>

          {/* Today's schedule */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>Today's Schedule</div>
            {events.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No events scheduled for today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map(event => (
                  <div key={event.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: '#0f172a',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${CATEGORY_COLORS[event.category] || '#64748b'}`,
                  }}>
                    {event.startTime && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', minWidth: '45px' }}>
                        {event.startTime}
                      </span>
                    )}
                    <span style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{event.title}</span>
                    {event.category && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: CATEGORY_COLORS[event.category] + '20',
                        color: CATEGORY_COLORS[event.category],
                        fontWeight: 600,
                        marginLeft: 'auto',
                      }}>{event.category}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick task add */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>Quick Add Task</div>
            <form onSubmit={handleQuickTask} style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...INPUT, flex: 1 }}
                placeholder="Add a task for today..."
                value={quickTask}
                onChange={e => setQuickTask(e.target.value)}
              />
              <button type="submit" style={BTN_PRIMARY}>Add</button>
            </form>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Due today tasks */}
          {dueTodayTasks.length > 0 && (
            <div style={CARD}>
              <div style={SECTION_LABEL}>Due Today</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dueTodayTasks.slice(0, 5).map(task => (
                  <TaskRow key={task.id} task={task} />
                ))}
                {dueTodayTasks.length > 5 && (
                  <button
                    onClick={() => navigate('/tasks')}
                    style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', padding: '4px 0' }}
                  >
                    +{dueTodayTasks.length - 5} more → View all tasks
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div style={{ ...CARD, borderLeft: '3px solid #ef4444' }}>
              <div style={{ ...SECTION_LABEL, color: '#ef4444' }}>Overdue</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {overdueTasks.slice(0, 4).map(task => (
                  <TaskRow key={task.id} task={task} overdue />
                ))}
                {overdueTasks.length > 4 && (
                  <button
                    onClick={() => navigate('/tasks')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', padding: '4px 0' }}
                  >
                    +{overdueTasks.length - 4} more overdue
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tonight's dinner */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>Tonight's Dinner</div>
            {tonightDinner ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>🍽</span>
                <div>
                  <p style={{ color: '#f8fafc', fontWeight: 600, margin: 0 }}>{tonightDinner}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Winner selected</p>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '8px' }}>No winner set yet.</p>
                <button onClick={() => navigate('/dinner')} style={{ ...BTN_PRIMARY, padding: '6px 12px' }}>
                  Go vote →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, onClick, small }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#1e293b',
        borderRadius: '10px',
        padding: '14px 18px',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: '90px',
        borderTop: `3px solid ${color}`,
        flex: small ? '1 1 auto' : '0 0 auto',
      }}
    >
      <div style={{ fontSize: small ? '0.9rem' : '1.6rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

function TaskRow({ task, overdue }) {
  const PRIORITY_COLORS = { high: '#ef4444', med: '#f59e0b', low: '#64748b' }
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 0',
      borderBottom: '1px solid #334155',
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: PRIORITY_COLORS[task.priority] || '#64748b',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: '0.875rem', color: overdue ? '#fca5a5' : '#f8fafc', flex: 1 }}>
        {task.title}
      </span>
      {task.role && (
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{task.role}</span>
      )}
    </div>
  )
}
