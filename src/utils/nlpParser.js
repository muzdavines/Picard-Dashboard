const ROLE_OPTIONS = ['personal', 'school', 'church', 'legal', 'wife']

/**
 * Very basic natural language parser.
 * Extracts priority keywords, role keywords, and due date hints from free text.
 */
export function parseNaturalLanguage(input) {
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
