import { useState, useEffect } from 'react'
import {
  db, collection, query, onSnapshot, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from '../firebase.js'
import { parseNaturalLanguage } from '../utils/nlpParser.js'
import { normalizeTaskStatus } from '../utils/agentStatus.js'

// ── Design tokens ─────────────────────────────────────────────────────────────
const CARD  = { background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '12px' }
const INPUT = { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none', width: '100%' }
const BTN_PRIMARY = { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }

const PRIORITY_COLORS = { high: '#ef4444', med: '#f59e0b', low: '#64748b' }

// ── Task pipeline columns ─────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'inbox',   label: 'Inbox',   color: '#94a3b8', desc: 'Prep Station' },
  { id: 'active',  label: 'Active',  color: '#f59e0b', desc: 'Hot Line' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444', desc: 'Stalled' },
  { id: 'review',  label: 'Review',  color: '#22c55e', desc: 'The Pass' },
  { id: 'done',    label: 'Done',    color: '#475569', desc: 'Plated' },
]

// ── Firestore activity helper ─────────────────────────────────────────────────
async function logActivity(actor, action, taskTitle, taskId) {
  try {
    await addDoc(collection(db, 'activityFeed'), {
      actor, action, taskTitle: taskTitle || '', taskId: taskId || '', timestamp: serverTimestamp(),
    })
  } catch (_) {}
}

// ── Task card component ───────────────────────────────────────────────────────
function TaskCard({ task, onMove, onDelete, onDragStart, onDragEnd }) {
  const [expanded, setExpanded] = useState(false)
  const todayStr = new Date().toISOString().split('T')[0]
  const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr
  const pColor = PRIORITY_COLORS[task.priority] || '#64748b'
  const col = COLUMNS.find(c => c.id === task.status)
  const statusColor = col ? col.color : '#64748b'

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: '8px',
        padding: '10px 10px 8px',
        marginBottom: '6px',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            onClick={() => setExpanded(e => !e)}
            style={{
              fontSize: '0.8rem',
              color: task.completed ? '#475569' : isOverdue ? '#fca5a5' : '#e2e8f0',
              textDecoration: task.completed ? 'line-through' : 'none',
              cursor: 'pointer',
              lineHeight: 1.35,
            }}
          >
            {task.title}
          </div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {task.role && (
              <span style={{ fontSize: '0.62rem', color: '#475569' }}>{task.role}</span>
            )}
            {task.dueDate && (
              <span style={{ fontSize: '0.62rem', color: isOverdue ? '#ef4444' : '#475569' }}>
                {isOverdue ? 'overdue ' : ''}{task.dueDate}
              </span>
            )}
            {task.assignedTo && (
              <span style={{ fontSize: '0.62rem', color: '#3b82f6' }}>@{task.assignedTo}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
            color: pColor, padding: '1px 5px', borderRadius: '3px', background: pColor + '18',
          }}>
            {task.priority}
          </span>
          <button
            onClick={() => onDelete(task.id)}
            title="Delete"
            style={{
              background: 'none', border: 'none', color: '#1e293b', cursor: 'pointer',
              fontSize: '0.75rem', padding: '1px 3px', borderRadius: '3px', lineHeight: 1,
            }}
            onMouseEnter={e => e.target.style.color = '#ef4444'}
            onMouseLeave={e => e.target.style.color = '#1e293b'}
          >
            x
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: '0.65rem', color: '#334155', marginBottom: '5px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
            Move to
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {COLUMNS.filter(c => c.id !== task.status).map(c => (
              <button
                key={c.id}
                onClick={() => { onMove(task, c.id); setExpanded(false) }}
                style={{
                  fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                  padding: '3px 8px', borderRadius: '4px',
                  background: c.color + '18', color: c.color,
                  border: `1px solid ${c.color}40`,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pipeline column ───────────────────────────────────────────────────────────
function PipelineColumn({ col, tasks, onMove, onDelete, onDragStart, onDragEnd }) {
  const [dragOver, setDragOver] = useState(false)

  function handleDragOver(e) { e.preventDefault(); setDragOver(true) }
  function handleDragLeave() { setDragOver(false) }
  function handleDrop(e) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onMove({ id: taskId }, col.id)
    setDragOver(false)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minWidth: '175px',
        flex: '1 1 175px',
        background: dragOver ? col.color + '08' : '#0a1628',
        border: `1px solid ${dragOver ? col.color + '50' : '#1e293b'}`,
        borderTop: `3px solid ${col.color}`,
        borderRadius: '8px',
        padding: '10px 8px',
        transition: 'background 0.15s, border-color 0.15s',
        minHeight: '200px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {col.label}
        </span>
        <span style={{ fontSize: '0.6rem', color: '#334155' }}>{col.desc}</span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 700,
          color: tasks.length > 0 ? col.color : '#334155',
          background: tasks.length > 0 ? col.color + '18' : 'transparent',
          padding: '1px 5px', borderRadius: '10px',
        }}>
          {tasks.length}
        </span>
      </div>
      <div>
        {tasks.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            onMove={onMove}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{ fontSize: '0.72rem', color: '#1e293b', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
            empty
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main TasksPage ────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showDone, setShowDone] = useState(false)
  const [draggingId, setDraggingId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => normalizeTaskStatus({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.error(err)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    setParsed(input.trim().length > 2 ? parseNaturalLanguage(input) : null)
  }, [input])

  async function handleAdd(e) {
    e.preventDefault()
    if (!input.trim()) return
    setError('')
    const { title, priority, role, dueDate } = parseNaturalLanguage(input)
    try {
      await addDoc(collection(db, 'tasks'), {
        title, priority, role,
        dueDate: dueDate || '',
        completed: false,
        status: 'inbox',
        createdAt: serverTimestamp(),
      })
      await logActivity('Riker', 'added ticket', title, '')
      setInput('')
      setParsed(null)
    } catch (err) {
      setError('Failed to add task.')
    }
  }

  async function handleMove(task, newStatus) {
    const isDone = newStatus === 'done'
    const full = tasks.find(t => t.id === task.id)
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: newStatus,
        completed: isDone,
        ...(isDone ? { completedAt: serverTimestamp() } : {}),
      })
      await logActivity('Riker', `moved to ${newStatus}`, full ? full.title : '', task.id)
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

  function handleDragStart(e, task) {
    e.dataTransfer.setData('taskId', task.id)
    setDraggingId(task.id)
  }
  function handleDragEnd() { setDraggingId(null) }

  const roles = [...new Set(tasks.map(t => t.role).filter(Boolean))].sort()

  const filtered = tasks.filter(t => {
    if (filterRole !== 'all' && t.role !== filterRole) return false
    if (!showDone && (t.status === 'done' || t.completed)) return false
    return true
  })

  const byStatus = {}
  COLUMNS.forEach(c => { byStatus[c.id] = [] })
  filtered.forEach(t => {
    const key = t.status || 'inbox'
    if (byStatus[key] !== undefined) byStatus[key].push(t)
  })

  const openCount = tasks.filter(t => !t.completed).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Task Pipeline</h1>
        <span style={{ fontSize: '0.72rem', color: '#475569' }}>{openCount} open</span>
      </div>

      {/* Quick add */}
      <div style={{ ...CARD, marginBottom: '14px' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: parsed ? '10px' : 0 }}>
          <input
            style={{ ...INPUT, flex: 1 }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='"high school pick up kids friday" — NLP parsed'
          />
          <button type="submit" style={BTN_PRIMARY}>Add</button>
        </form>
        {parsed && input.trim().length > 2 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Parsed:</span>
            <Tag label={parsed.title} color="#f8fafc" />
            <Tag label={`${parsed.priority} priority`} color={PRIORITY_COLORS[parsed.priority]} />
            <Tag label={parsed.role} color="#a855f7" />
            {parsed.dueDate && <Tag label={parsed.dueDate} color="#3b82f6" />}
          </div>
        )}
        {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px' }}>{error}</p>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Role:</span>
        {['all', ...roles].map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            style={{
              ...BTN_GHOST,
              borderColor: filterRole === r ? '#f59e0b' : '#1e293b',
              color: filterRole === r ? '#f59e0b' : '#64748b',
              padding: '3px 10px', fontSize: '0.72rem',
            }}
          >{r}</button>
        ))}
        <button
          onClick={() => setShowDone(d => !d)}
          style={{
            ...BTN_GHOST, marginLeft: 'auto',
            borderColor: showDone ? '#22c55e' : '#1e293b',
            color: showDone ? '#22c55e' : '#64748b',
            padding: '3px 10px', fontSize: '0.72rem',
          }}
        >
          {showDone ? 'Hide Done' : 'Show Done'}
        </button>
      </div>

      {/* Pipeline board */}
      {loading ? (
        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading tasks...</div>
      ) : (
        <div style={{
          display: 'flex', gap: '8px', overflowX: 'auto',
          paddingBottom: '16px', alignItems: 'flex-start',
        }}>
          {COLUMNS.filter(c => showDone || c.id !== 'done').map(col => (
            <PipelineColumn
              key={col.id}
              col={col}
              tasks={byStatus[col.id] || []}
              onMove={handleMove}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Tag({ label, color }) {
  return (
    <span style={{
      background: color + '18', color, padding: '2px 8px', borderRadius: '4px',
      fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${color}30`,
    }}>{label}</span>
  )
}
