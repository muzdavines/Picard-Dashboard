// Distinct SVG character tiles per agent type — Kairosoft-style 28px figures

function ClaudeAvatar({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Monitor body */}
      <rect x="2" y="3" width="24" height="18" rx="3" fill={color + '18'} stroke={color} strokeWidth="1.5"/>
      {/* Screen stand */}
      <rect x="10" y="21" width="8" height="3" rx="1" fill={color + '30'} stroke={color} strokeWidth="1"/>
      {/* Code brackets */}
      <path d="M8 9 L6 13 L8 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 9 L22 13 L20 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Cursor blink */}
      <rect x="13" y="11" width="2.5" height="4" rx="0.8" fill={color} opacity="0.8"/>
    </svg>
  )
}

function GooseAvatar({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Body */}
      <ellipse cx="13" cy="19" rx="8" ry="6" fill={color + '20'} stroke={color} strokeWidth="1.5"/>
      {/* Neck */}
      <path d="M14 13 Q16 8 20 6" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Head */}
      <circle cx="21" cy="5" r="3.2" fill={color + '25'} stroke={color} strokeWidth="1.5"/>
      {/* Eye */}
      <circle cx="22" cy="4.2" r="0.9" fill={color}/>
      {/* Beak */}
      <path d="M23.5 6 L26 6.5 L23.5 7.2" fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round"/>
      {/* Wing hint */}
      <path d="M6 17 Q4 14 6 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function RikerAvatar({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Head */}
      <circle cx="14" cy="9" r="5.5" fill={color + '20'} stroke={color} strokeWidth="1.5"/>
      {/* Uniform body */}
      <path d="M5 27 Q5 19 14 18 Q23 19 23 27" fill={color + '18'} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Rank insignia top stripe */}
      <rect x="10" y="21" width="8" height="1.5" rx="0.75" fill={color}/>
      {/* Rank insignia bottom stripe */}
      <rect x="10" y="23.5" width="8" height="1.5" rx="0.75" fill={color} opacity="0.55"/>
    </svg>
  )
}

function BotAvatar({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Robot head */}
      <rect x="5" y="8" width="18" height="14" rx="3" fill={color + '18'} stroke={color} strokeWidth="1.5"/>
      {/* Eyes */}
      <circle cx="10.5" cy="14" r="2.5" fill={color + '35'} stroke={color} strokeWidth="1"/>
      <circle cx="17.5" cy="14" r="2.5" fill={color + '35'} stroke={color} strokeWidth="1"/>
      {/* Mouth */}
      <path d="M10 19.5 Q14 21.5 18 19.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      {/* Antenna */}
      <line x1="14" y1="8" x2="14" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="4" r="1.5" fill={color}/>
    </svg>
  )
}

export default function AgentAvatar({ agentType, color, size = 28 }) {
  const c = color || '#64748b'
  switch (agentType) {
    case 'claude-code':
    case 'claude':
      return <ClaudeAvatar color={c} size={size} />
    case 'goose':
      return <GooseAvatar color={c} size={size} />
    case 'riker':
      return <RikerAvatar color={c} size={size} />
    default:
      return <BotAvatar color={c} size={size} />
  }
}
