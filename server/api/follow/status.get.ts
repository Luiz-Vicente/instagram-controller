import { getJob, type JobEvent } from '../../utils/job-manager'

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const job = getJob()

  if (!job) {
    event.node.res.write('data: {"type":"error","message":"Nenhum seguimento em andamento."}\n\n')
    event.node.res.end()
    return
  }

  // Send current state immediately on connect
  event.node.res.write(
    `data: ${JSON.stringify({ type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })}\n\n`
  )

  const listener = (e: JobEvent) => {
    event.node.res.write(`data: ${JSON.stringify(e)}\n\n`)
    if (e.type === 'done' || e.type === 'error' || e.type === 'stopped') {
      job.listeners.delete(listener)
      event.node.res.end()
    }
  }

  job.listeners.add(listener)

  // Clean up if client disconnects
  event.node.req.on('close', () => {
    job.listeners.delete(listener)
  })
})
