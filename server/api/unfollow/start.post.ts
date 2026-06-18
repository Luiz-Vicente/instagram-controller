import { z } from 'zod'
import { createJob, getJob, clearJob } from '../../utils/job-manager'
import { runUnfollowJob } from '../../utils/unfollow-runner'

const bodySchema = z.object({
  sessionId: z.string().min(1),
  unfollowMode: z.enum(['ultra-safe', 'safe', 'risky']),
  onlyNotFollowingBack: z.boolean().default(false),
  filterByMinFollowers: z.boolean().default(false),
  minFollowers: z.number().int().min(0).default(0),
  filterByMaxFollowers: z.boolean().default(false),
  maxFollowers: z.number().int().min(0).default(0),
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
  runUnfollowJob(config, job).catch(() => {})

  return { ok: true }
})
