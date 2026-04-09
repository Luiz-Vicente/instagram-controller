import { z } from 'zod'
import { createJob, getJob } from '../../utils/job-manager'
import { runPostManagerJob } from '../../utils/post-manager-runner'

const bodySchema = z.object({
  sessionId: z.string().min(1),
  action: z.enum(['archive', 'delete']),
  postTypes: z.array(z.enum(['photo', 'video', 'reel', 'carousel'])).default([]),
  filterByDate: z.boolean().default(false),
  dateFrom: z.string().default(''),
  dateTo: z.string().default(''),
})

export default defineEventHandler(async (event) => {
  if (getJob()) {
    throw createError({ statusCode: 409, message: 'Já existe uma operação em andamento.' })
  }

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message ?? 'Parâmetros inválidos.' })
  }

  const { sessionId, ...rest } = result.data
  const config = { ...rest, sessionId: sessionId.trim() }

  const job = createJob()
  runPostManagerJob(config, job).catch(() => {})

  return { ok: true }
})
