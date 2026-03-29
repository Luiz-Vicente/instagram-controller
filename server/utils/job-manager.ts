export type JobStatus = 'idle' | 'running' | 'paused' | 'done' | 'error' | 'stopped'

export interface JobEvent {
  type: 'log' | 'progress' | 'pause' | 'done' | 'error' | 'stopped'
  message?: string
  followed?: number
  skipped?: number
  total?: number
  pauseUntil?: number // timestamp ms
}

export interface Job {
  status: JobStatus
  shouldStop: boolean
  followed: number
  skipped: number
  total: number
  listeners: Set<(event: JobEvent) => void>
}

// Single active job — one user at a time
let activeJob: Job | null = null

export function createJob(): Job {
  activeJob = {
    status: 'running',
    shouldStop: false,
    followed: 0,
    skipped: 0,
    total: 0,
    listeners: new Set(),
  }
  return activeJob
}

export function getJob(): Job | null {
  return activeJob
}

export function clearJob(): void {
  activeJob = null
}

export function emitEvent(job: Job, event: JobEvent): void {
  for (const listener of job.listeners) {
    try { listener(event) } catch {}
  }
}
