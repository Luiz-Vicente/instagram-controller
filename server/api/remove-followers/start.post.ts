import { z } from 'zod'
import { createJob, getJob, clearJob } from '../../utils/job-manager'
import { runRemoveFollowersJob } from '../../utils/remove-followers-runner'

const bodySchema = z.object({
  sessionId: z.string().min(1),
  removeMode: z.enum(['ultra-safe', 'safe', 'risky']),
  previousTimestamps: z.array(z.number()).default([]),
})

export default defineEventHandler(async (event) => {
  const existing = getJob()
  if (existing) {
    existing.shouldStop = true
    clearJob(existing)
  }

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message ?? 'Parâmetros inválidos.' })
  }

  const { sessionId, ...rest } = result.data
  const config = { ...rest, sessionId: sessionId.trim() }

  const job = createJob()
  runRemoveFollowersJob(config, job).catch(() => {})

  return { ok: true }
})
