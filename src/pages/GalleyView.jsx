import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  db, collection, query, onSnapshot, where, orderBy, limit,
  addDoc, updateDoc, setDoc, serverTimestamp, doc,
} from '../firebase.js'
import { parseNaturalLanguage } from '../utils/nlpParser.js'
import { normalizeTaskStatus, AGENT_STATUS_COLORS, AGENT_STATUS_LABELS } from '../utils/agentStatus.js'
import AgentAvatar from '../components/galley/AgentAvatar.jsx'

// ── Design tokens ─────────────────────────────────────────────────────────────
const SECTION_LABEL = {
  fontSize: '0.6rem', fontWeight: 700, color: '#475569',
  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px',
}
const INPUT = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
  padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none',
}
const BTN_PRIMARY = {
  background: '#f59e0b', color: '#0f172a', border: 'none',
  borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
}
const BTN_TINY = {
  border: 'none', borderRadius: '4px', padding: '3px 8px',
  fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em',
}

// ── CSS animations + layout ───────────────────────────────────────────────────
const GALLEY_STYLES = `
  @keyframes agent-active {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
    50% { box-shadow: 0 0 0 7px rgba(245,158,11,0); }
  }
  @keyframes pass-ready {
    0%, 100% { border-color: rgba(34,197,94,0.3); box-shadow: 0 0 0 0 rgba(34,197,94,0.2); }
    50% { border-color: rgba(34,197,94,0.75); box-shadow: 0 0 8px 2px rgba(34,197,94,0.08); }
  }
  @keyframes idle-breathe {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 0.82; }
  }
  @keyframes blocked-flash {
    0%, 100% { border-color: rgba(239,68,68,0.3); }
    50% { border-color: rgba(239,68,68,0.75); }
  }
  .galley-room {
    display: grid;
    grid-template-columns: 1fr 1.3fr 1fr;
    gap: 1px;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 12px;
    overflow: hidden;
  }
  .zone-hotline    { background: rgba(245,158,11,0.04); }
  .zone-walkin     { background: rgba(59,130,246,0.04); }
  .zone-thepass    { background: rgba(34,197,94,0.04); }
  .zone-breaktable { background: rgba(71,85,105,0.06); }
  .zone-expediter  { background: rgba(245,158,11,0.03); }
  .zone-block      { padding: 14px; }
  .agent-tile-active  { animation: agent-active 2s ease-in-out infinite; }
  .agent-tile-idle    { animation: idle-breathe 3s ease-in-out infinite; }
  .agent-tile-blocked { animation: blocked-flash 1.5s ease-in-out infinite; }
  .pass-glow { animation: pass-ready 2s ease-in-out infinite; border: 1px solid rgba(34,197,94,0.3) !important; }
  .feed-row:hover { background: rgba(255,255,255,0.03); border-radius: 4px; }
  @media (max-width: 900px) {
    .galley-room { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 600px) {
    .galley-room { grid-template-columns: 1fr !important; }
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

function formatRelTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${Math.floor(diff / 86400000)}d`
}

const RIKER_MODES = ['planning', 'focused', 'review', 'away']
const RIKER_MODE_COLORS = { focused: '#f59e0b', planning: '#3b82f6', review: '#22c55e', away: '#64748b' }
const CATEGORY_COLORS = {
  personal: '#a855f7', school: '#3b82f6',
  church: '#22c55e', legal: '#f97316', wife: '#ec4899',
}

// ── Firestore helpers ─────────────────────────────────────────────────────────
async function logActivity(actor, action, taskTitle = '', taskId = '') {
  try {
    await addDoc(collection(db, 'activityFeed'), {
      actor, action, taskTitle, taskId, timestamp: serverTimestamp(),
    })
  } catch (_) {}
}

async function updateRikerMode(mode) {
  try {
    await setDoc(doc(db, 'system', 'riker'), { mode, updatedAt: serverTimestamp() }, { merge: true })
  } catch (_) {}
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ZoneLabel({ label }) {
  return <div style={SECTION_LABEL}>{label}</div>
}

function AgentTile({ agent }) {
  const { agentName, agentId, agentType, status, currentTaskTitle } = agent
  const color = AGENT_STATUS_COLORS[status] || '#64748b'
  const isActive = status === 'active'
  const isIdle = status === 'idle'
  const isBlocked = status === 'blocked'
  const isReview = status === 'review-ready'
  const cls = isActive ? 'agent-tile-active' : isIdle ? 'agent-tile-idle' : isBlocked ? 'agent-tile-blocked' : isReview ? 'pass-glow' : ''

  return (
    <div
      className={cls}
      title={currentTaskTitle ? `Working on: ${currentTaskTitle}` : (agentName || agentId)}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
        gap: '4px', padding: '8px 10px', borderRadius: '8px',
        background: '#0a1628', border: `2px solid ${color}35`,
        minWidth: '70px', maxWidth: '80px',
      }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '7px',
        background: color + '12', border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AgentAvatar agentType={agentType} color={color} size={26} />
      </div>
      <span style={{
        fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600,
        textAlign: 'center', maxWidth: '68px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {agentName || agentId}
      </span>
      <span style={{
        fontSize: '0.58rem', color, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {AGENT_STATUS_LABELS[status] || status}
      </span>
    </div>
  )
}

function RikerTile({ mode, onModeChange }) {
  const color = RIKER_MODE_COLORS[mode] || '#f59e0b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
      <div style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
        gap: '4px', padding: '8px 10px', borderRadius: '8px',
        background: '#0a1628', border: `2px solid ${color}50`,
        minWidth: '70px',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '7px',
          background: color + '15', border: `1px solid ${color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AgentAvatar agentType="riker" color={color} size={26} />
        </div>
        <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>Riker</span>
        <span style={{ fontSize: '0.58rem', color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {mode}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        {RIKER_MODES.map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              ...BTN_TINY,
              background: mode === m ? RIKER_MODE_COLORS[m] + '25' : 'transparent',
              color: mode === m ? RIKER_MODE_COLORS[m] : '#334155',
              border: `1px solid ${mode === m ? RIKER_MODE_COLORS[m] + '50' : '#1e293b'}`,
            }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}

function TicketRow({ task, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '5px 8px', borderRadius: '6px', background: '#0a1628',
      borderLeft: `3px solid ${color}`, marginBottom: '4px',
    }}>
      <span style={{ fontSize: '0.78rem', color: '#f8fafc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.title}
      </span>
      {task.assignedTo && (
        <span style={{ fontSize: '0.6rem', color: '#475569', flexShrink: 0 }}>@{task.assignedTo}</span>
      )}
      {task.priority && (
        <span style={{
          fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase',
          color, padding: '1px 5px', borderRadius: '3px', background: color + '18', flexShrink: 0,
        }}>{task.priority}</span>
      )}
    </div>
  )
}

// ── Galley Zones ──────────────────────────────────────────────────────────────

function ExpeditierZone({ rikerMode, todayEvents, onModeChange }) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="zone-expediter zone-block" style={{ gridColumn: '1', gridRow: '1' }}>
      <ZoneLabel label="Expediter Station" />
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <RikerTile mode={rikerMode} onModeChange={onModeChange} />
        <div style={{ flex: 1, minWidth: '80px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
            {getGreeting()} &mdash; {dateStr}
          </div>
          {todayEvents.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: '#334155' }}>No events today</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {todayEvents.slice(0, 4).map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: '6px', fontSize: '0.72rem', alignItems: 'center' }}>
                  <span style={{ color: CATEGORY_COLORS[ev.category] || '#64748b', flexShrink: 0 }}>&#9658;</span>
                  <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.startTime && <span style={{ color: '#475569', marginRight: '4px' }}>{ev.startTime}</span>}
                    {ev.title}
                  </span>
                </div>
              ))}
              {todayEvents.length > 4 && (
                <div style={{ fontSize: '0.68rem', color: '#334155' }}>+{todayEvents.length - 4} more</div>
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
        <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>No active tickets</div>
      ) : (
        <div>
          {activeTasks.map(t => <TicketRow key={t.id} task={t} color="#f59e0b" />)}
          {blockedTasks.map(t => <TicketRow key={t.id} task={t} color="#ef4444" />)}
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
        <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>Line is quiet</div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeAgents.map(a => <AgentTile key={a.id} agent={a} />)}
        </div>
      )}
    </div>
  )
}

function ThePassZone({ reviewTasks, onApprove, onSendBack }) {
  const hasItems = reviewTasks.length > 0
  return (
    <div
      className={'zone-thepass zone-block' + (hasItems ? ' pass-glow' : '')}
      style={{ gridColumn: '1', gridRow: '2' }}
    >
      <ZoneLabel label="The Pass / Window" />
      {!hasItems ? (
        <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>Nothing at the window</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {reviewTasks.map(t => (
            <div key={t.id} style={{
              padding: '8px 10px', borderRadius: '6px', background: '#0a1628',
              border: '1px solid rgba(34,197,94,0.35)',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600, marginBottom: '2px' }}>{t.title}</div>
              {t.assignedTo && (
                <div style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '6px' }}>@{t.assignedTo}</div>
              )}
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => onApprove(t)}
                  style={{ ...BTN_TINY, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}
                >
                  Approve
                </button>
                <button
                  onClick={() => onSendBack(t)}
                  style={{ ...BTN_TINY, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)' }}
                >
                  Send Back
                </button>
              </div>
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
        <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>Counter is clear</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {inboxTasks.slice(0, 6).map(t => (
            <div key={t.id} style={{
              fontSize: '0.78rem', color: '#cbd5e1',
              padding: '4px 8px', borderRadius: '4px', background: '#0a1628',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}>
              <span style={{ color: '#f59e0b', fontSize: '0.55rem', flexShrink: 0 }}>&#9679;</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
              {t.priority === 'high' && (
                <span style={{ fontSize: '0.58rem', color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>HI</span>
              )}
            </div>
          ))}
          {inboxTasks.length > 6 && (
            <div style={{ fontSize: '0.68rem', color: '#334155', paddingLeft: '8px' }}>
              +{inboxTasks.length - 6} more in prep
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
        <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>Table empty</div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {idleAgents.map(a => <AgentTile key={a.id} agent={a} />)}
        </div>
      )}
    </div>
  )
}

function WalkInZone({ backlogTasks }) {
  const [open, setOpen] = useState(false)
  const count = backlogTasks.length
  return (
    <div className="zone-walkin zone-block" style={{ gridColumn: '1 / span 3' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px', padding: 0, width: '100%',
        }}
      >
        <span style={SECTION_LABEL}>Walk-in Cooler{count > 0 ? ` (${count})` : ''}</span>
        <span style={{ color: '#334155', fontSize: '0.65rem', marginLeft: 'auto' }}>{open ? '&#9650;' : '&#9660;'}</span>
      </button>
      {open && (
        count === 0
          ? <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>Cooler is empty</div>
          : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
              {backlogTasks.slice(0, 8).map(t => (
                <div key={t.id} style={{
                  fontSize: '0.72rem', color: '#475569',
                  padding: '3px 8px', borderRadius: '4px', background: '#0a1628',
                  border: '1px solid #1e293b',
                }}>{t.title}</div>
              ))}
              {count > 8 && <div style={{ fontSize: '0.68rem', color: '#334155' }}>+{count - 8} more</div>}
            </div>
      )}
    </div>
  )
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeedStrip({ events }) {
  if (events.length === 0) return null
  return (
    <div style={{
      borderTop: '1px solid #1e293b', padding: '8px 16px',
      maxHeight: '130px', overflow: 'auto', background: '#060d1a',
    }}>
      <div style={{ ...SECTION_LABEL, marginBottom: '5px' }}>Recent Activity</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {events.map(ev => (
          <div
            key={ev.id}
            className="feed-row"
            style={{
              display: 'flex', gap: '10px', fontSize: '0.72rem',
              alignItems: 'baseline', padding: '2px 4px',
            }}
          >
            <span style={{ color: '#334155', flexShrink: 0, width: '22px', textAlign: 'right' }}>
              {formatRelTime(ev.timestamp)}
            </span>
            <span style={{ color: '#475569' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>{ev.actor}</span>
              {' '}{ev.action}
              {ev.taskTitle && (
                <span style={{ color: '#64748b' }}> &ldquo;{ev.taskTitle}&rdquo;</span>
              )}
            </span>
          </div>
        ))}
      </div>
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
        title, priority, role,
        dueDate: dueDate || '',
        completed: false,
        status: 'inbox',
        createdAt: serverTimestamp(),
      })
      await logActivity('Riker', 'added ticket', title)
      setInput('')
      setParsed(null)
    } catch (_) {
      setError('Failed to add task.')
    }
  }

  return (
    <div style={{ borderTop: '1px solid #1e293b', padding: '10px 16px', background: '#060d1a' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
          Fire ticket
        </span>
        <input
          style={{ ...INPUT, flex: 1, fontSize: '0.8125rem', padding: '6px 12px' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='"high school pick up kids friday" — NLP parsed'
        />
        <button type="submit" style={{ ...BTN_PRIMARY, padding: '6px 14px' }}>Add</button>
      </form>
      {parsed && (
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
          <ParsedTag label={parsed.title} color="#f8fafc" />
          <ParsedTag label={parsed.priority} color={parsed.priority === 'high' ? '#ef4444' : parsed.priority === 'low' ? '#64748b' : '#f59e0b'} />
          <ParsedTag label={parsed.role} color="#a855f7" />
          {parsed.dueDate && <ParsedTag label={parsed.dueDate} color="#3b82f6" />}
        </div>
      )}
      {error && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px' }}>{error}</div>}
    </div>
  )
}

function ParsedTag({ label, color }) {
  return (
    <span style={{
      background: color + '18', color, padding: '1px 6px', borderRadius: '3px',
      fontSize: '0.68rem', fontWeight: 600, border: `1px solid ${color}30`,
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
  const [activityFeed, setActivityFeed] = useState([])
  const [loading, setLoading] = useState(true)

  const todayStr = getTodayStr()

  useEffect(() => {
    const tasksQ = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    const unsubTasks = onSnapshot(tasksQ, snap => {
      setTasks(snap.docs.map(d => normalizeTaskStatus({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))

    const agentsQ = query(collection(db, 'agentSessions'))
    const unsubAgents = onSnapshot(agentsQ, snap => {
      setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})

    const eventsQ = query(collection(db, 'calendarEvents'), where('date', '==', todayStr))
    const unsubEvents = onSnapshot(eventsQ, snap => {
      setTodayEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})

    const rikerRef = doc(db, 'system', 'riker')
    const unsubRiker = onSnapshot(rikerRef, snap => {
      setRikerDoc(snap.exists() ? snap.data() : null)
    }, () => {})

    const feedQ = query(
      collection(db, 'activityFeed'),
      orderBy('timestamp', 'desc'),
      limit(20),
    )
    const unsubFeed = onSnapshot(feedQ, snap => {
      setActivityFeed(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})

    return () => { unsubTasks(); unsubAgents(); unsubEvents(); unsubRiker(); unsubFeed() }
  }, [todayStr])

  const handleApprove = useCallback(async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'done', completed: true, completedAt: serverTimestamp(),
      })
      await logActivity('Riker', 'approved', task.title, task.id)
    } catch (_) {}
  }, [])

  const handleSendBack = useCallback(async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: 'active' })
      await logActivity('Riker', 'sent back', task.title, task.id)
    } catch (_) {}
  }, [])

  const handleModeChange = useCallback(async (mode) => {
    await updateRikerMode(mode)
    await logActivity('Riker', `switched to ${mode} mode`)
  }, [])

  const inboxTasks   = tasks.filter(t => t.status === 'inbox' && !t.completed)
  const activeTasks  = tasks.filter(t => t.status === 'active' && !t.completed)
  const blockedTasks = tasks.filter(t => t.status === 'blocked' && !t.completed)
  const reviewTasks  = tasks.filter(t => t.status === 'review' && !t.completed)
  const backlogTasks = tasks.filter(t => t.status === 'backlog' && !t.completed)
  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'blocked')
  const idleAgents   = agents.filter(a => a.status === 'idle')

  const rikerMode = rikerDoc?.mode || 'planning'
  const dueTodayCount = tasks.filter(t => !t.completed && t.dueDate === todayStr).length
  const overdueCount  = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', minHeight: '560px' }}>
      <style>{GALLEY_STYLES}</style>

      {/* Top status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', margin: 0, letterSpacing: '-0.01em' }}>
          The Galley
        </h1>
        <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
          {dueTodayCount > 0 && (
            <StatPill label="Due Today" value={dueTodayCount} color="#f59e0b" onClick={() => navigate('/tasks')} />
          )}
          {overdueCount > 0 && (
            <StatPill label="Overdue" value={overdueCount} color="#ef4444" onClick={() => navigate('/tasks')} />
          )}
          {reviewTasks.length > 0 && (
            <StatPill label="At The Pass" value={reviewTasks.length} color="#22c55e" />
          )}
          {blockedTasks.length > 0 && (
            <StatPill label="Blocked" value={blockedTasks.length} color="#ef4444" />
          )}
          {activeAgents.length > 0 && (
            <StatPill label="On the Line" value={activeAgents.length} color="#f59e0b" />
          )}
        </div>
        <button
          onClick={() => navigate('/tasks')}
          style={{
            background: 'transparent', border: '1px solid #1e293b', borderRadius: '6px',
            padding: '4px 10px', fontSize: '0.7rem', color: '#475569', cursor: 'pointer',
          }}
        >
          Pipeline
        </button>
      </div>

      {/* Galley room */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ color: '#475569', fontSize: '0.875rem', padding: '20px' }}>Loading galley...</div>
        ) : (
          <div className="galley-room" style={{ minHeight: '340px' }}>
            <ExpeditierZone rikerMode={rikerMode} todayEvents={todayEvents} onModeChange={handleModeChange} />
            <OrderBoardZone activeTasks={activeTasks} blockedTasks={blockedTasks} />
            <HotLineZone activeAgents={activeAgents} />
            <ThePassZone reviewTasks={reviewTasks} onApprove={handleApprove} onSendBack={handleSendBack} />
            <PrepStationZone inboxTasks={inboxTasks} />
            <BreakTableZone idleAgents={idleAgents} />
            <WalkInZone backlogTasks={backlogTasks} />
          </div>
        )}
      </div>

      {/* Activity feed */}
      <ActivityFeedStrip events={activityFeed} />

      {/* Quick capture */}
      <QuickCapture />
    </div>
  )
}

function StatPill({ label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: color + '12', color, border: `1px solid ${color}35`,
        borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem',
        fontWeight: 700, cursor: onClick ? 'pointer' : 'default',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}
    >
      <span>{value}</span>
      <span style={{ fontWeight: 400, opacity: 0.8 }}>{label}</span>
    </button>
  )
}
