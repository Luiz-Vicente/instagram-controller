import { z } from 'zod'
import { createJob, getJob } from '../../utils/job-manager'
import { runFollowJob } from '../../utils/runner'

const bodySchema = z.object({
  sessionId: z.string().min(1),
  targetUser: z.string().min(1),
  followMode: z.enum(['ultra-safe', 'safe', 'risky']),
  followPrivate: z.boolean().default(false),
  followAlreadyFollowers: z.boolean().default(false),
  filterByFollowers: z.boolean().default(false),
  minFollowers: z.number().int().min(0).default(0),
  previousTimestamps: z.array(z.number()).default([]),
})

export default defineEventHandler(async (event) => {
  if (getJob()) {
    throw createError({ statusCode: 409, message: 'Já existe um seguimento em andamento.' })
  }

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message ?? 'Parâmetros inválidos.' })
  }

  const { sessionId, targetUser, ...rest } = result.data
  const config = {
    ...rest,
    sessionId: sessionId.trim(),
    targetUser: targetUser.trim().replace(/^@/, ''),
  }

  const job = createJob()
  runFollowJob(config, job).catch(() => {})

  return { ok: true }
})
