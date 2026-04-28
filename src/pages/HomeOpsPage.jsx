import { useState } from 'react'
import DinnerPage from './DinnerPage.jsx'
import GroceryPage from './GroceryPage.jsx'

const TAB_STYLE_BASE = {
  background: 'transparent',
  border: 'none',
  padding: '8px 20px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
  letterSpacing: '0.04em',
  transition: 'all 0.15s',
}

export default function HomeOpsPage() {
  const [tab, setTab] = useState('dinner')

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
          Home Ops
        </h1>
        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          gap: '4px',
        }}>
          <button
            onClick={() => setTab('dinner')}
            style={{
              ...TAB_STYLE_BASE,
              color: tab === 'dinner' ? '#f59e0b' : '#64748b',
              borderBottom: tab === 'dinner' ? '2px solid #f59e0b' : '2px solid transparent',
            }}
          >
            Dinner Planner
          </button>
          <button
            onClick={() => setTab('grocery')}
            style={{
              ...TAB_STYLE_BASE,
              color: tab === 'grocery' ? '#f59e0b' : '#64748b',
              borderBottom: tab === 'grocery' ? '2px solid #f59e0b' : '2px solid transparent',
            }}
          >
            Grocery List
          </button>
        </div>
      </div>

      {/* Render the active tab's page without its own top-level heading
          The pages are rendered in full; their h1 headings are suppressed
          via a wrapper that overrides the first child h1 display */}
      <div className="home-ops-tab-content">
        {tab === 'dinner' ? <DinnerTabView /> : <GroceryTabView />}
      </div>
    </div>
  )
}

/**
 * Wrappers that hide the duplicate page-level h1 inside each sub-page,
 * since HomeOpsPage already shows the "Home Ops" title.
 */
function DinnerTabView() {
  return (
    <>
      <style>{`
        .home-ops-tab-content > div > div > h1:first-child,
        .dinner-tab-inner > h1:first-child {
          display: none;
        }
      `}</style>
      <div className="dinner-tab-inner">
        <DinnerPage />
      </div>
    </>
  )
}

function GroceryTabView() {
  return (
    <>
      <style>{`
        .grocery-tab-inner > h1:first-child {
          display: none;
        }
      `}</style>
      <div className="grocery-tab-inner">
        <GroceryPage />
      </div>
    </>
  )
}
