/**
 * Agent status → kitchen zone mapping helpers.
 * Used by GalleyView and agent tile components in Phase 2+.
 */

export const AGENT_STATUSES = ['active', 'idle', 'review-ready', 'blocked', 'done', 'absent']

export const AGENT_STATUS_ZONES = {
  active: 'hotline',
  idle: 'breaktable',
  'review-ready': 'thepass',
  blocked: 'hotline',
  done: 'backdoor',
  absent: 'backdoor',
}

export const TASK_STATUSES = ['inbox', 'active', 'blocked', 'review', 'done', 'backlog']

export const TASK_STATUS_ZONES = {
  inbox: 'prepstation',
  active: 'orderboard',
  blocked: 'orderboard',
  review: 'thepass',
  done: null,
  backlog: 'walkin',
}

export const ZONE_LABELS = {
  hotline: 'Hot Line',
  breaktable: 'Break Table',
  thepass: 'The Pass',
  backdoor: 'Back Door',
  prepstation: 'Prep Station',
  orderboard: 'Order Board',
  walkin: 'Walk-in Cooler',
  expediter: 'Expediter Station',
}

/**
 * Normalize a task object to always have a `status` field.
 * Existing tasks without `status` get 'done' if completed, 'inbox' otherwise.
 */
export function normalizeTaskStatus(task) {
  if (task.status) return task
  return {
    ...task,
    status: task.completed ? 'done' : 'inbox',
  }
}

export const AGENT_STATUS_COLORS = {
  active: '#f59e0b',
  idle: '#64748b',
  'review-ready': '#22c55e',
  blocked: '#ef4444',
  done: '#334155',
  absent: '#1e293b',
}

export const AGENT_STATUS_LABELS = {
  active: 'Active',
  idle: 'Idle',
  'review-ready': 'Review Ready',
  blocked: 'Blocked',
  done: 'Done',
  absent: 'Absent',
}
