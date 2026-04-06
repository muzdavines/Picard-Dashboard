import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import DinnerPage from './pages/DinnerPage.jsx'
import GroceryPage from './pages/GroceryPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'

const NAV_LINKS = [
  { to: '/', label: 'Home', emoji: '🏠', exact: true },
  { to: '/tasks', label: 'Tasks', emoji: '✅' },
  { to: '/dinner', label: 'Dinner', emoji: '🍽' },
  { to: '/grocery', label: 'Grocery', emoji: '🛒' },
  { to: '/calendar', label: 'Calendar', emoji: '📅' },
  { to: '/projects', label: 'Projects', emoji: '🗂' },
]

function NavBar() {
  const location = useLocation()

  const linkStyle = (to, exact) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to)
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '10px 8px',
      borderRadius: '10px',
      textDecoration: 'none',
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
      color: active ? '#f59e0b' : '#94a3b8',
      background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
      transition: 'all 0.15s',
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '80px',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '24px',
        paddingBottom: '24px',
        gap: '8px',
        zIndex: 100,
      }} className="desktop-nav" aria-label="Main navigation">
        <div style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#f59e0b',
          marginBottom: '16px',
          letterSpacing: '-0.02em',
        }}>P</div>
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            style={() => linkStyle(link.to, link.exact)}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{link.emoji}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile bottom bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#0f172a',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '6px 0',
        zIndex: 100,
      }} className="mobile-nav" aria-label="Main navigation mobile">
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            style={() => linkStyle(link.to, link.exact)}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{link.emoji}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <NavBar />
      <main style={{
        flex: 1,
        marginLeft: '80px',
        padding: '24px',
        maxWidth: '1200px',
      }} className="main-content">
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding: 16px 12px 80px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/dinner" element={<DinnerPage />} />
          <Route path="/grocery" element={<GroceryPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
