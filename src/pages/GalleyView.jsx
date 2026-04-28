import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  db, collection, query, onSnapshot, where, orderBy,
  addDoc, serverTimestamp, doc, getDoc,
} from '../firebase.js'
import { parseNaturalLanguage } from '../utils/nlpParser.js'
import { normalizeTaskStatus, AGENT_STATUS_COLORS, AGENT_STATUS_LABELS } from '../utils/agentStatus.js'

// ── Design tokens ────────────────────────────────────────────────────────────
const CARD = { background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '0' }
const SECTION_LABEL = {
  fontSize: '0.65rem', fontWeight: 700, color: '#475569',
  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px',
}
const INPUT = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
  padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none',
}
const BTN_PRIMARY = {
  background: '#f59e0b', color: '#0f172a', border: 'none',
  borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
}
const BTN_GHOST = {
  background: 'transparent', color: '#94a3b8', border: '1px solid #334155',
  borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer',
}

// ── CSS for animations and layout ────────────────────────────────────────────
const GALLEY_STYLES = `
  @keyframes agent-active {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
  }
  @keyframes pass-ready {
    0%, 100% { border-color: rgba(34,197,94,0.3); }
    50% { border-color: rgba(34,197,94,0.8); }
  }
  @keyframes idle-breathe {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.85; }
  }
  .galley-room {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 1px;
    background: #1e293b;
    border-radius: 12px;
    overflow: hidden;
  }
  .zone-hotline { background: rgba(245,158,11,0.04); }
  .zone-walkin  { background: rgba(59,130,246,0.04); }
  .zone-thepass { background: rgba(34,197,94,0.04); }
  .zone-breaktable { background: rgba(71,85,105,0.06); }
  .zone-block { padding: 14px; min-height: 100px; }
  .agent-tile-active { animation: agent-active 2s ease-in-out infinite; }
  .agent-tile-idle   { animation: idle-breathe 3s ease-in-out infinite; }
  .pass-glow { animation: pass-ready 2s ease-in-out infinite; }
  @media (max-width: 768px) {
    .galley-room {
      grid-template-columns: 1fr !important;
    }
  }
`

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTodayStr() { return new Date().toISOString().split('T')[0] }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

const CATEGORY_COLORS = {
  personal: '#a855f7', school: '#3b82f6',
  church: '#22c55e', legal: '#f97316', wife: '#ec4899',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ZoneLabel({ label }) {
  return <div style={SECTION_LABEL}>{label}</div>
}

function AgentTileSkeleton({ name, agentType, status }) {
  const color = AGENT_STATUS_COLORS[status] || '#64748b'
  const label = AGENT_STATUS_LABELS[status] || status
  const isActive = status === 'active'
  const isIdle = status === 'idle'
  return (
    <div
      className={isActive ? 'agent-tile-active' : isIdle ? 'agent-tile-idle' : ''}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
        gap: '4px', padding: '8px', borderRadius: '8px',
        background: '#0f172a',
        border: `2px solid ${color}40`,
        minWidth: '64px',
      }}
    >
      {/* Avatar placeholder — will be replaced with AgentAvatar SVG in Phase 2 */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '6px',
        background: color + '20', border: `2px solid ${color}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem',
      }}>
        {agentType === 'claude-code' ? '⌨' : agentType === 'goose' ? '🪿' : '🤖'}
      </div>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontSize: '0.6rem', color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function RikerTile({ mode }) {
  const modeColors = { focused: '#f59e0b', planning: '#3b82f6', review: '#22c55e', away: '#64748b' }
  const color = modeColors[mode] || '#f59e0b'
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      gap: '4px', padding: '8px', borderRadius: '8px',
      background: '#0f172a',
      border: `2px solid ${color}60`,
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '6px',
        background: color + '20', border: `2px solid ${color}80`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', fontWeight: 700,
      }}>P</div>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Riker</span>
      <span style={{ fontSize: '0.6rem', color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{mode}</span>
    </div>
  )
}

function TicketRow({ task, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 8px', borderRadius: '6px',
      background: '#0f172a',
      borderLeft: `3px solid ${color}`,
      marginBottom: '4px',
    }}>
      <span style={{ fontSize: '0.8rem', color: '#f8fafc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.title}
      </span>
      {task.priority && (
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
          color, padding: '1px 5px', borderRadius: '3px', background: color + '20',
        }}>{task.priority}</span>
      )}
    </div>
  )
}

// ── GalleyZones ───────────────────────────────────────────────────────────────

function ExpeditierZone({ rikerMode, todayEvents }) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <div className="zone-block" style={{ gridColumn: '1', gridRow: '1' }}>
      <ZoneLabel label="Expediter Station" />
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <RikerTile mode={rikerMode} />
        <div style={{ flex: 1, minWidth: '100px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
            {getGreeting()} — {dateStr}
          </div>
          {todayEvents.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>No events today</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {todayEvents.slice(0, 3).map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: CATEGORY_COLORS[ev.category] || '#64748b', flexShrink: 0 }}>▸</span>
                  <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.startTime && <span style={{ color: '#64748b', marginRight: '4px' }}>{ev.startTime}</span>}
                    {ev.title}
                  </span>
                </div>
              ))}
              {todayEvents.length > 3 && (
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>+{todayEvents.length - 3} more</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrderBoardZone({ activeTasks, blockedTasks }) {
  return (
    <div className="zone-block" style={{ gridColumn: '2', gridRow: '1' }}>
      <ZoneLabel label="Order Board" />
      {activeTasks.length === 0 && blockedTasks.length === 0 ? (
        <div style={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>No active tickets</div>
      ) : (
        <div>
          {activeTasks.map(t => (
            <TicketRow key={t.id} task={t} color="#f59e0b" />
          ))}
          {blockedTasks.map(t => (
            <TicketRow key={t.id} task={t} color="#ef4444" />
          ))}
        </div>
      )}
    </div>
  )
}

function HotLineZone({ activeAgents }) {
  return (
    <div className="zone-hotline zone-block" style={{ gridColumn: '3', gridRow: '1' }}>
      <ZoneLabel label="Hot Line" />
      {activeAgents.length === 0 ? (
        <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
          Line is quiet
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeAgents.map(a => (
            <AgentTileSkeleton key={a.id} name={a.agentName || a.agentId} agentType={a.agentType} status={a.status} />
          ))}
        </div>
      )}
    </div>
  )
}

function ThePassZone({ reviewTasks }) {
  const hasItems = reviewTasks.length > 0
  return (
    <div
      className={`zone-thepass zone-block ${hasItems ? 'pass-glow' : ''}`}
      style={{ gridColumn: '1', gridRow: '2', border: hasItems ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent' }}
    >
      <ZoneLabel label="The Pass / Window" />
      {!hasItems ? (
        <div style={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>Nothing at the window</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {reviewTasks.map(t => (
            <div key={t.id} style={{
              padding: '8px', borderRadius: '6px', background: '#0f172a',
              border: '1px solid rgba(34,197,94,0.4)',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600 }}>{t.title}</div>
              {t.assignedTo && (
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>@{t.assignedTo}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PrepStationZone({ inboxTasks }) {
  return (
    <div className="zone-block" style={{ gridColumn: '2', gridRow: '2' }}>
      <ZoneLabel label="Prep Station" />
      {inboxTasks.length === 0 ? (
        <div style={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>Counter is clear</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {inboxTasks.slice(0, 5).map(t => (
            <div key={t.id} style={{
              fontSize: '0.8rem', color: '#cbd5e1',
              padding: '4px 8px', borderRadius: '4px', background: '#0f172a',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}>
              <span style={{ color: '#f59e0b', fontSize: '0.6rem' }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
            </div>
          ))}
          {inboxTasks.length > 5 && (
            <div style={{ fontSize: '0.7rem', color: '#475569', paddingLeft: '8px' }}>
              +{inboxTasks.length - 5} more in prep
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BreakTableZone({ idleAgents }) {
  return (
    <div className="zone-breaktable zone-block" style={{ gridColumn: '3', gridRow: '2' }}>
      <ZoneLabel label="Break Table" />
      {idleAgents.length === 0 ? (
        <div style={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>Table empty</div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {idleAgents.map(a => (
            <AgentTileSkeleton key={a.id} name={a.agentName || a.agentId} agentType={a.agentType} status={a.status} />
          ))}
        </div>
      )}
    </div>
  )
}

function WalkInZone({ backlogCount }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="zone-walkin zone-block" style={{ gridColumn: '1 / span 3', gridRow: '3' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, width: '100%' }}
      >
        <ZoneLabel label={`Walk-in Cooler${backlogCount > 0 ? ` (${backlogCount})` : ''}`} />
        <span style={{ color: '#334155', fontSize: '0.7rem', marginLeft: 'auto', marginBottom: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
          {backlogCount === 0
            ? 'Cooler is empty — no backlog tasks'
            : `${backlogCount} task${backlogCount > 1 ? 's' : ''} in the cooler. Manage from Tasks page.`}
        </div>
      )}
    </div>
  )
}

// ── QuickCapture ──────────────────────────────────────────────────────────────

function QuickCapture() {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setParsed(input.trim().length > 2 ? parseNaturalLanguage(input) : null)
  }, [input])

  async function handleSubmit(e) {
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
        status: 'inbox',
        createdAt: serverTimestamp(),
      })
      setInput('')
      setParsed(null)
    } catch (err) {
      setError('Failed to add task.')
    }
  }

  return (
    <div style={{
      borderTop: '1px solid #1e293b',
      padding: '12px 16px',
      background: '#0a1628',
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
          Fire ticket
        </span>
        <input
          style={{ ...INPUT, flex: 1, fontSize: '0.8125rem', padding: '6px 12px' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='"high school pick up kids friday" — auto-parsed'
        />
        <button type="submit" style={{ ...BTN_PRIMARY, padding: '6px 14px' }}>Add</button>
      </form>
      {parsed && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          <ParsedTag label={parsed.title} color="#f8fafc" />
          <ParsedTag label={parsed.priority} color={parsed.priority === 'high' ? '#ef4444' : parsed.priority === 'low' ? '#64748b' : '#f59e0b'} />
          <ParsedTag label={parsed.role} color="#a855f7" />
          {parsed.dueDate && <ParsedTag label={parsed.dueDate} color="#3b82f6" />}
        </div>
      )}
      {error && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>{error}</div>}
    </div>
  )
}

function ParsedTag({ label, color }) {
  return (
    <span style={{
      background: color + '18', color, padding: '1px 6px', borderRadius: '3px',
      fontSize: '0.7rem', fontWeight: 600, border: `1px solid ${color}30`,
    }}>{label}</span>
  )
}

// ── Main GalleyView ───────────────────────────────────────────────────────────

export default function GalleyView() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [agents, setAgents] = useState([])
  const [todayEvents, setTodayEvents] = useState([])
  const [rikerDoc, setRikerDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  const todayStr = getTodayStr()

  useEffect(() => {
    // Subscribe to all incomplete tasks
    const tasksQ = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    const unsubTasks = onSnapshot(tasksQ, snap => {
      setTasks(snap.docs.map(d => normalizeTaskStatus({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))

    // Subscribe to agent sessions
    const agentsQ = query(collection(db, 'agentSessions'))
    const unsubAgents = onSnapshot(agentsQ, snap => {
      setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})

    // Subscribe to today's calendar events
    const eventsQ = query(collection(db, 'calendarEvents'), where('date', '==', todayStr))
    const unsubEvents = onSnapshot(eventsQ, snap => {
      setTodayEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})

    // Get Riker's status doc
    const rikerRef = doc(db, 'system', 'riker')
    const unsubRiker = onSnapshot(rikerRef, snap => {
      setRikerDoc(snap.exists() ? snap.data() : null)
    }, () => {})

    return () => { unsubTasks(); unsubAgents(); unsubEvents(); unsubRiker() }
  }, [todayStr])

  // Categorize tasks by status
  const inboxTasks   = tasks.filter(t => t.status === 'inbox' && !t.completed)
  const activeTasks  = tasks.filter(t => t.status === 'active')
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const reviewTasks  = tasks.filter(t => t.status === 'review')
  const backlogTasks = tasks.filter(t => t.status === 'backlog')

  // Categorize agents by status
  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'review-ready')
  const idleAgents   = agents.filter(a => a.status === 'idle')

  const rikerMode = rikerDoc?.mode || 'planning'

  // Stats for top bar
  const todayStr2 = getTodayStr()
  const dueTodayCount = tasks.filter(t => !t.completed && t.dueDate === todayStr2).length
  const overdueCount  = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr2).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', minHeight: '600px' }}>
      <style>{GALLEY_STYLES}</style>

      {/* Top status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        marginBottom: '12px', flexWrap: 'wrap',
      }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', margin: 0, letterSpacing: '-0.01em' }}>
          The Galley
        </h1>
        <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
          {dueTodayCount > 0 && (
            <StatPill label="Due Today" value={dueTodayCount} color="#f59e0b" onClick={() => navigate('/tasks')} />
          )}
          {overdueCount > 0 && (
            <StatPill label="Overdue" value={overdueCount} color="#ef4444" onClick={() => navigate('/tasks')} />
          )}
          {reviewTasks.length > 0 && (
            <StatPill label="At The Pass" value={reviewTasks.length} color="#22c55e" />
          )}
          {activeAgents.length > 0 && (
            <StatPill label="On the Line" value={activeAgents.length} color="#f59e0b" />
          )}
        </div>
      </div>

      {/* Galley room grid — grows to fill available space */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ color: '#475569', fontSize: '0.875rem', padding: '20px' }}>Loading galley...</div>
        ) : (
          <div className="galley-room" style={{ height: '100%' }}>
            <ExpeditierZone rikerMode={rikerMode} todayEvents={todayEvents} />
            <OrderBoardZone activeTasks={activeTasks} blockedTasks={blockedTasks} />
            <HotLineZone activeAgents={activeAgents} />
            <ThePassZone reviewTasks={reviewTasks} />
            <PrepStationZone inboxTasks={inboxTasks} />
            <BreakTableZone idleAgents={idleAgents} />
            <WalkInZone backlogCount={backlogTasks.length} />
          </div>
        )}
      </div>

      {/* Persistent quick capture bar at bottom */}
      <QuickCapture />
    </div>
  )
}

function StatPill({ label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: color + '15', color, border: `1px solid ${color}40`,
        borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem',
        fontWeight: 700, cursor: onClick ? 'pointer' : 'default',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}
    >
      <span>{value}</span>
      <span style={{ fontWeight: 400, opacity: 0.8 }}>{label}</span>
    </button>
  )
}
