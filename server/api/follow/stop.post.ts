import { getJob } from '../../utils/job-manager'

export default defineEventHandler(() => {
  const job = getJob()

  if (!job) {
    throw createError({ statusCode: 404, message: 'Nenhum seguimento em andamento.' })
  }

  job.shouldStop = true

  return { ok: true }
})
