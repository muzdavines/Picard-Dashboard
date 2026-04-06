import { useState, useEffect } from 'react'
import { db, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from '../firebase.js'

const CARD = { background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '12px' }
const BTN_PRIMARY = { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }
const INPUT = { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f8fafc', fontSize: '0.875rem', outline: 'none' }
const SECTION_LABEL = { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }

const COLUMNS = [
  { id: 'active', label: 'Active', color: '#f59e0b' },
  { id: 'upnext', label: 'Up Next', color: '#3b82f6' },
  { id: 'backlog', label: 'Backlog', color: '#64748b' },
  { id: 'done', label: 'Done', color: '#22c55e' },
]

const PRIORITY_COLORS = { high: '#ef4444', med: '#f59e0b', low: '#64748b' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [dragOver, setDragOver] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', status: 'backlog', priority: 'med', tags: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'projects'))
    const unsub = onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setError('')
    try {
      await addDoc(collection(db, 'projects'), {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        createdAt: serverTimestamp(),
      })
      setForm({ title: '', description: '', status: 'backlog', priority: 'med', tags: '' })
      setShowAdd(false)
    } catch (err) {
      setError('Failed to add project: ' + err.message)
    }
  }

  async function handleMove(projectId, newStatus) {
    try {
      await updateDoc(doc(db, 'projects', projectId), { status: newStatus })
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(projectId) {
    try {
      await deleteDoc(doc(db, 'projects', projectId))
    } catch (err) {
      console.error(err)
    }
  }

  function handleDragStart(e, project) {
    e.dataTransfer.setData('projectId', project.id)
  }

  async function handleDrop(e, columnId) {
    e.preventDefault()
    const projectId = e.dataTransfer.getData('projectId')
    if (projectId) await handleMove(projectId, columnId)
    setDragOver(null)
  }

  const projectsByStatus = {}
  for (const col of COLUMNS) projectsByStatus[col.id] = []
  for (const p of projects) {
    const col = p.status || 'backlog'
    if (projectsByStatus[col]) projectsByStatus[col].push(p)
    else projectsByStatus['backlog'].push(p)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: 0, flex: 1 }}>Projects</h1>
        <button onClick={() => setShowAdd(f => !f)} style={BTN_PRIMARY}>
          {showAdd ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ ...CARD, borderLeft: '3px solid #f59e0b', marginBottom: '20px' }}>
          <div style={SECTION_LABEL}>New Project</div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input style={INPUT} placeholder="Project title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            <textarea
              style={{ ...INPUT, minHeight: '80px', resize: 'vertical' }}
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select style={{ ...INPUT, flex: 1 }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select style={{ ...INPUT, flex: 1 }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">High Priority</option>
                <option value="med">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <input style={INPUT} placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
            <button type="submit" style={{ ...BTN_PRIMARY, alignSelf: 'flex-start' }}>Create Project</button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading projects...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', overflowX: 'auto' }}>
          {COLUMNS.map(col => (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
              style={{
                minHeight: '200px',
                padding: '4px',
                borderRadius: '10px',
                background: dragOver === col.id ? col.color + '10' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {col.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#475569', marginLeft: 'auto' }}>
                  {projectsByStatus[col.id].length}
                </span>
              </div>

              {/* Project cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {projectsByStatus[col.id].length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#334155', fontSize: '0.8rem', borderRadius: '8px', border: '2px dashed #1e293b' }}>
                    Drop here
                  </div>
                ) : (
                  projectsByStatus[col.id].map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onMove={handleMove}
                      onDelete={handleDelete}
                      onDragStart={handleDragStart}
                      columns={COLUMNS}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 900px) {
          .projects-kanban { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 580px) {
          .projects-kanban { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function ProjectCard({ project, onMove, onDelete, onDragStart, columns }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, project)}
      style={{
        background: '#1e293b',
        borderRadius: '10px',
        padding: '12px',
        cursor: 'grab',
        borderLeft: `3px solid ${PRIORITY_COLORS[project.priority] || '#64748b'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc', marginBottom: '4px', wordBreak: 'break-word' }}>
            {project.title}
          </div>
          {project.description && (
            <p style={{
              fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 6px',
              overflow: expanded ? 'visible' : 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis',
            }}>
              {project.description}
            </p>
          )}
          {project.description && project.description.length > 80 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginBottom: '4px' }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          {project.tags && project.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {project.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.65rem', background: '#334155', color: '#94a3b8', padding: '1px 5px', borderRadius: '3px' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(project.id)}
          title="Delete"
          style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}
          onMouseEnter={e => e.target.style.color = '#ef4444'}
          onMouseLeave={e => e.target.style.color = '#334155'}
        >✕</button>
      </div>

      {/* Move controls */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
        {columns.filter(c => c.id !== project.status).map(col => (
          <button
            key={col.id}
            onClick={() => onMove(project.id, col.id)}
            style={{
              background: 'transparent',
              border: `1px solid ${col.color}50`,
              color: col.color,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.65rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  )
}
