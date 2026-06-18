import { InstagramClient, type PostInfo, type PostMediaType } from './instagram-client'
import { interruptibleSleep, randomDelay, formatDuration } from './helpers'
import { type Job, emitEvent, clearJob } from './job-manager'

const ACTION_DELAY_MIN_SEC = 4
const ACTION_DELAY_MAX_SEC = 10
const BATCH_SIZE = 20
const BATCH_PAUSE_MIN_SEC = 15
const BATCH_PAUSE_MAX_SEC = 30

export type PostActionType = 'archive' | 'delete'

export interface PostManagerConfig {
  sessionId: string
  action: PostActionType
  postTypes: PostMediaType[] // empty = all types
  filterByDate: boolean
  dateFrom: string // 'YYYY-MM-DD' or ''
  dateTo: string   // 'YYYY-MM-DD' or ''
}

export async function runPostManagerJob(config: PostManagerConfig, job: Job): Promise<void> {
  const log = (message: string) =>
    emitEvent(job, { type: 'log', message, followed: job.followed, skipped: job.skipped, total: job.total })
  const countdown = (rem: number) => emitEvent(job, { type: 'countdown', seconds: Math.ceil(rem / 1000) })

  try {
    const ig = new InstagramClient(config.sessionId)
    ig.onRetry = (status, waitSec) =>
      log(`HTTP ${status} — aguardando ${waitSec}s antes de tentar novamente...`)

    log('Inicializando sessão...')
    await ig.initializeSession()

    log('Obtendo usuário autenticado...')
    const currentUser = await ig.fetchCurrentUser()
    log(`Conectado como @${currentUser.username}`)

    // ── Build date bounds ──────────────────────────────────────────────────
    let fromMs = 0
    let toMs = Infinity

    if (config.filterByDate) {
      if (config.dateFrom) fromMs = new Date(config.dateFrom + 'T00:00:00').getTime()
      if (config.dateTo) toMs = new Date(config.dateTo + 'T23:59:59').getTime()
    }

    const allTypes = config.postTypes.length === 0
    const acceptedTypes = new Set(config.postTypes)

    // ── Phase 1: Scan ──────────────────────────────────────────────────────
    log('Escaneando posts...')
    const matchingPosts: PostInfo[] = []
    let nextMaxId: string | undefined
    let scannedTotal = 0
    let earlyStop = false

    while (!earlyStop) {
      if (job.shouldStop) break

      let page
      try {
        page = await ig.fetchUserMediaPage(currentUser.pk, nextMaxId)
      } catch (err) {
        log(`Erro ao buscar posts: ${(err as Error).message}. Tentando em 30s...`)
        await interruptibleSleep(30_000, () => job.shouldStop, countdown)
        continue
      }

      if (page.posts.length === 0) break
      scannedTotal += page.posts.length

      for (const post of page.posts) {
        const postDateMs = post.taken_at * 1000

        // Posts are newest-first; stop early if we've gone past dateFrom
        if (config.filterByDate && config.dateFrom && postDateMs < fromMs) {
          earlyStop = true
          break
        }

        // Skip posts newer than dateTo
        if (config.filterByDate && config.dateTo && postDateMs > toMs) continue

        // Filter by type
        if (!allTypes && !acceptedTypes.has(post.postType)) continue

        matchingPosts.push(post)
      }

      log(`${scannedTotal} posts escaneados, ${matchingPosts.length} correspondentes...`)

      if (!page.next_max_id) break
      nextMaxId = page.next_max_id

      await interruptibleSleep(randomDelay(1, 3), () => job.shouldStop)
    }

    if (job.shouldStop) {
      job.status = 'stopped'
      emitEvent(job, { type: 'stopped', message: 'Operação interrompida pelo usuário.', followed: job.followed, skipped: job.skipped, total: job.total })
      clearJob(job)
      return
    }

    job.total = matchingPosts.length
    const actionLabel = config.action === 'archive' ? 'arquivar' : 'excluir'
    log(`${matchingPosts.length} post(s) encontrado(s) para ${actionLabel}.`)
    emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })

    if (matchingPosts.length === 0) {
      job.status = 'done'
      emitEvent(job, { type: 'done', message: 'Nenhum post encontrado com os filtros selecionados.', followed: 0, skipped: 0, total: 0 })
      return
    }

    // ── Phase 2: Execute action ────────────────────────────────────────────
    for (const post of matchingPosts) {
      if (job.shouldStop) break

      try {
        if (config.action === 'archive') {
          await ig.archivePost(post.id)
          job.followed++
          const pct = job.total > 0 ? ` (${((job.followed / job.total) * 100).toFixed(1)}%)` : ''
          log(`[✓] Arquivado ${post.postType} · ${formatDate(post.taken_at)}${pct}`)
        } else {
          await ig.deletePost(post.id, post.media_type)
          job.followed++
          const pct = job.total > 0 ? ` (${((job.followed / job.total) * 100).toFixed(1)}%)` : ''
          log(`[✓] Excluído ${post.postType} · ${formatDate(post.taken_at)}${pct}`)
        }

        emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })

        const isBatchEnd = job.followed % BATCH_SIZE === 0
        if (isBatchEnd) {
          const pause = randomDelay(BATCH_PAUSE_MIN_SEC, BATCH_PAUSE_MAX_SEC)
          log(`Pausa de lote: ${formatDuration(pause)}`)
          await interruptibleSleep(pause, () => job.shouldStop, countdown)
        } else {
          const delay = randomDelay(ACTION_DELAY_MIN_SEC, ACTION_DELAY_MAX_SEC)
          log(`Próxima ação em ${formatDuration(delay)}...`)
          await interruptibleSleep(delay, () => job.shouldStop, countdown)
        }
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 429 || status === 503) {
          log('Rate limit detectado. Pausando 10 minutos...')
          await interruptibleSleep(10 * 60_000, () => job.shouldStop, countdown)
          continue
        }
        log(`[!] Erro no post ${post.id}: ${(err as Error).message}`)
        job.skipped++
        emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })
      }
    }

    if (job.shouldStop) {
      job.status = 'stopped'
      emitEvent(job, { type: 'stopped', message: 'Operação interrompida pelo usuário.', followed: job.followed, skipped: job.skipped, total: job.total })
      return
    }

    const doneLabel = config.action === 'archive' ? 'arquivados' : 'excluídos'
    job.status = 'done'
    emitEvent(job, {
      type: 'done',
      message: `Concluído! ${job.followed} ${doneLabel} · ${job.skipped} erros`,
      followed: job.followed,
      skipped: job.skipped,
      total: job.total,
    })
  } catch (err) {
    job.status = 'error'
    emitEvent(job, { type: 'error', message: (err as Error).message, followed: job.followed, skipped: job.skipped, total: job.total })
  } finally {
    clearJob(job)
  }
}

function formatDate(takenAt: number): string {
  return new Date(takenAt * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
