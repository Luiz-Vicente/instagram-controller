import { createJob, getJob } from '../../utils/job-manager'
import { runFollowJob, type RunnerConfig } from '../../utils/runner'
import { LIMITS, type FollowMode } from '../../utils/rate-limiter'

export default defineEventHandler(async (event) => {
  if (getJob()) {
    throw createError({ statusCode: 409, message: 'Já existe um seguimento em andamento.' })
  }

  const body = await readBody(event) as {
    sessionId: string
    targetUser: string
    followMode: string
    followPrivate: boolean
    followAlreadyFollowers: boolean
    filterByFollowers: boolean
    minFollowers: number
  }

  if (!body.sessionId?.trim()) {
    throw createError({ statusCode: 400, message: 'sessionId é obrigatório.' })
  }
  if (!body.targetUser?.trim()) {
    throw createError({ statusCode: 400, message: 'targetUser é obrigatório.' })
  }
  if (!(body.followMode in LIMITS)) {
    throw createError({ statusCode: 400, message: 'followMode inválido.' })
  }

  const config: RunnerConfig = {
    sessionId: body.sessionId.trim(),
    targetUser: body.targetUser.trim().replace(/^@/, ''),
    followMode: body.followMode as FollowMode,
    followPrivate: body.followPrivate ?? false,
    followAlreadyFollowers: body.followAlreadyFollowers ?? false,
    filterByFollowers: body.filterByFollowers ?? false,
    minFollowers: Number(body.minFollowers) || 0,
  }

  const job = createJob()

  // Fire and forget — runner runs in background
  runFollowJob(config, job).catch(() => {})

  return { ok: true }
})
