import { useState, useEffect } from 'react'
import {
  db, collection, query, onSnapshot, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where,
} from '../firebase.js'

const CARD = { background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const INPUT = { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none', width: '100%' }
const BTN_PRIMARY = { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }
const SECTION_LABEL = { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }

const PRIORITY_COLORS = { high: '#ef4444', med: '#f59e0b', low: '#64748b' }
const ROLE_OPTIONS = ['personal', 'school', 'church', 'legal', 'wife']
const PRIORITY_OPTIONS = ['high', 'med', 'low']

/**
 * Very basic natural language parser.
 * Extracts priority keywords, role keywords, and due date hints from free text.
 */
function parseNaturalLanguage(input) {
  let text = input.trim()
  let priority = 'med'
  let role = 'personal'
  let dueDate = null

  // Priority
  if (/\bhigh\b/i.test(text)) { priority = 'high'; text = text.replace(/\bhigh\b/i, '').trim() }
  else if (/\blow\b/i.test(text)) { priority = 'low'; text = text.replace(/\blow\b/i, '').trim() }
  else if (/\bmed\b|\bmedium\b/i.test(text)) { priority = 'med'; text = text.replace(/\bmed\b|\bmedium\b/i, '').trim() }

  // Role
  for (const r of ROLE_OPTIONS) {
    const re = new RegExp(`\\b${r}\\b`, 'i')
    if (re.test(text)) {
      role = r
      text = text.replace(re, '').trim()
      break
    }
  }

  // Due date
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  if (/\btoday\b/i.test(text)) {
    dueDate = todayStr
    text = text.replace(/\btoday\b/i, '').trim()
  } else if (/\btomorrow\b/i.test(text)) {
    const t = new Date(today)
    t.setDate(today.getDate() + 1)
    dueDate = t.toISOString().split('T')[0]
    text = text.replace(/\btomorrow\b/i, '').trim()
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    for (let i = 0; i < days.length; i++) {
      const re = new RegExp(`\\b${days[i]}\\b`, 'i')
      if (re.test(text)) {
        const d = new Date(today)
        const diff = (i - today.getDay() + 7) % 7 || 7
        d.setDate(today.getDate() + diff)
        dueDate = d.toISOString().split('T')[0]
        text = text.replace(re, '').trim()
        break
      }
    }
  }

  // Clean up extra spaces
  const title = text.replace(/\s+/g, ' ').trim() || input.trim()

  return { title, priority, role, dueDate }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.error(err)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (input.trim().length > 2) {
      setParsed(parseNaturalLanguage(input))
    } else {
      setParsed(null)
    }
  }, [input])

  async function handleAdd(e) {
    e.preventDefault()
    if (!input.trim()) return
    setError('')
    const { title, priority, role, dueDate } = parseNaturalLanguage(input)
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        priority,
        role,
        dueDate: dueDate || '',
        completed: false,
        createdAt: serverTimestamp(),
      })
      setInput('')
      setParsed(null)
    } catch (err) {
      setError('Failed to add task. Try again.')
    }
  }

  async function handleComplete(task) {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: true,
        completedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(taskId) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleUncomplete(task) {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { completed: false, completedAt: null })
    } catch (err) {
      console.error(err)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const filteredTasks = tasks.filter(t => {
    if (!showCompleted && t.completed) return false
    if (showCompleted && !t.completed) return false
    if (filterRole !== 'all' && t.role !== filterRole) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    return true
  })

  const overdueTasks = filteredTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr)
  const dueTodayTasks = filteredTasks.filter(t => !t.completed && t.dueDate === todayStr)
  const upcomingTasks = filteredTasks.filter(t => !t.completed && (!t.dueDate || t.dueDate > todayStr))
  const completedTasks = filteredTasks.filter(t => t.completed)

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 24px' }}>Tasks</h1>

      {/* Quick add */}
      <div style={CARD}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Add Task
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: parsed ? '12px' : 0 }}>
          <input
            style={{ ...INPUT, flex: 1 }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"\"high school pick up kids friday\" → auto-parsed"}
          />
          <button type="submit" style={BTN_PRIMARY}>Add</button>
        </form>
        {parsed && input.trim().length > 2 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Parsed:</span>
            <Tag label={parsed.title} color="#f8fafc" />
            <Tag label={`${parsed.priority} priority`} color={PRIORITY_COLORS[parsed.priority]} />
            <Tag label={parsed.role} color="#a855f7" />
            {parsed.dueDate && <Tag label={parsed.dueDate} color="#3b82f6" />}
          </div>
        )}
        {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px' }}>{error}</p>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '4px' }}>Role:</span>
          {['all', ...ROLE_OPTIONS].map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              style={{
                ...BTN_GHOST,
                borderColor: filterRole === r ? '#f59e0b' : '#334155',
                color: filterRole === r ? '#f59e0b' : '#94a3b8',
                padding: '4px 10px',
                fontSize: '0.75rem',
              }}
            >{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '4px' }}>Priority:</span>
          {['all', ...PRIORITY_OPTIONS].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              style={{
                ...BTN_GHOST,
                borderColor: filterPriority === p ? '#f59e0b' : '#334155',
                color: filterPriority === p ? PRIORITY_COLORS[p] || '#f59e0b' : '#94a3b8',
                padding: '4px 10px',
                fontSize: '0.75rem',
              }}
            >{p}</button>
          ))}
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          style={{ ...BTN_GHOST, marginLeft: 'auto', borderColor: showCompleted ? '#22c55e' : '#334155', color: showCompleted ? '#22c55e' : '#94a3b8' }}
        >
          {showCompleted ? '✓ Completed' : 'Show Completed'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading tasks...</p>
      ) : (
        <>
          {!showCompleted && overdueTasks.length > 0 && (
            <TaskSection title="Overdue" tasks={overdueTasks} color="#ef4444" onComplete={handleComplete} onDelete={handleDelete} />
          )}
          {!showCompleted && dueTodayTasks.length > 0 && (
            <TaskSection title="Due Today" tasks={dueTodayTasks} color="#f59e0b" onComplete={handleComplete} onDelete={handleDelete} />
          )}
          {!showCompleted && (
            <TaskSection title="Upcoming" tasks={upcomingTasks} color="#94a3b8" onComplete={handleComplete} onDelete={handleDelete} />
          )}
          {showCompleted && (
            <TaskSection title="Completed" tasks={completedTasks} color="#22c55e" onComplete={handleUncomplete} onDelete={handleDelete} completed />
          )}
        </>
      )}
    </div>
  )
}

function Tag({ label, color }) {
  return (
    <span style={{
      background: color + '18',
      color,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 600,
      border: `1px solid ${color}30`,
    }}>{label}</span>
  )
}

function TaskSection({ title, tasks, color, onComplete, onDelete, completed }) {
  if (tasks.length === 0) return null
  return (
    <div style={{ ...CARD, borderTop: `3px solid ${color}` }}>
      <div style={{ ...SECTION_LABEL, color }}>
        {title} <span style={{ fontWeight: 400, fontSize: '0.7rem' }}>({tasks.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} completed={completed} />
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task, onComplete, onDelete, completed }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 8px',
      borderRadius: '8px',
      background: 'transparent',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <button
        onClick={() => onComplete(task)}
        title={completed ? "Mark incomplete" : "Mark complete"}
        style={{
          width: '18px', height: '18px',
          borderRadius: '4px',
          border: `2px solid ${completed ? '#22c55e' : PRIORITY_COLORS[task.priority] || '#334155'}`,
          background: completed ? '#22c55e20' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          color: '#22c55e', fontSize: '0.65rem',
        }}
      >
        {completed && '✓'}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: '0.875rem',
          color: completed ? '#64748b' : isOverdue ? '#fca5a5' : '#f8fafc',
          textDecoration: completed ? 'line-through' : 'none',
        }}>
          {task.title}
        </span>
        <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
          {task.role && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{task.role}</span>}
          {task.dueDate && (
            <span style={{ fontSize: '0.7rem', color: isOverdue ? '#ef4444' : '#64748b' }}>
              {isOverdue ? '⚠ ' : ''}{task.dueDate}
            </span>
          )}
        </div>
      </div>

      <span style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: '4px',
        background: (PRIORITY_COLORS[task.priority] || '#64748b') + '20',
        color: PRIORITY_COLORS[task.priority] || '#64748b',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        {task.priority}
      </span>

      <button
        onClick={() => onDelete(task.id)}
        title="Delete"
        style={{
          background: 'none', border: 'none', color: '#334155', cursor: 'pointer',
          fontSize: '0.85rem', padding: '4px', borderRadius: '4px',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.target.style.color = '#ef4444'}
        onMouseLeave={e => e.target.style.color = '#334155'}
      >✕</button>
    </div>
  )
}

const SECTION_LABEL_OBJ = SECTION_LABEL
