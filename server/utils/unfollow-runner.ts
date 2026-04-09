import { InstagramClient } from './instagram-client'
import { RateLimiter, type FollowMode } from './rate-limiter'
import { interruptibleSleep, randomDelay, formatDuration } from './helpers'
import { type Job, emitEvent, clearJob } from './job-manager'

const MIN_DELAY_SEC = 60
const MAX_DELAY_SEC = 120
const BATCH_SIZE = 10
const BATCH_PAUSE_MIN_SEC = 120
const BATCH_PAUSE_MAX_SEC = 300

export interface UnfollowRunnerConfig {
  sessionId: string
  unfollowMode: FollowMode
  onlyNotFollowingBack: boolean
  filterByMinFollowers: boolean
  minFollowers: number
  filterByMaxFollowers: boolean
  maxFollowers: number
previousTimestamps: number[]
}

export async function runUnfollowJob(config: UnfollowRunnerConfig, job: Job): Promise<void> {
  const log = (message: string) =>
    emitEvent(job, { type: 'log', message, followed: job.followed, skipped: job.skipped, total: job.total })

  try {
    const ig = new InstagramClient(config.sessionId)
    ig.onRetry = (status, waitSec) =>
      log(`HTTP ${status} — aguardando ${waitSec}s antes de tentar novamente...`)

    log('Inicializando sessão...')
    await ig.initializeSession()

    log('Obtendo usuário autenticado...')
    const currentUser = await ig.fetchCurrentUser()
    log(`Conectado como @${currentUser.username}`)

    const limiter = new RateLimiter(config.unfollowMode, config.previousTimestamps)
    limiter.shouldStop = () => job.shouldStop
    limiter.onPause = (reason, durationMs) => {
      job.status = 'paused'
      const pauseUntil = Date.now() + durationMs
      emitEvent(job, {
        type: 'pause',
        message: `${reason}. Retomando em ${formatDuration(durationMs)}`,
        pauseUntil,
        followed: job.followed,
        skipped: job.skipped,
        total: job.total,
      })
    }

    const processedIds = new Set<string>()

    job.total = currentUser.following_count ?? 0
    emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })

    let nextMaxId: string | undefined

    while (true) {
      if (job.shouldStop) {
        job.status = 'stopped'
        emitEvent(job, { type: 'stopped', message: 'Remoção interrompida pelo usuário.', followed: job.followed, skipped: job.skipped, total: job.total })
        clearJob()
        return
      }

      log('Buscando próxima página de seguimentos...')
      let page
      try {
        page = await ig.fetchFollowingPage(currentUser.pk, nextMaxId)
      } catch (err) {
        log(`Erro ao buscar seguimentos: ${(err as Error).message}. Tentando em 60s...`)
        await interruptibleSleep(60_000, () => job.shouldStop)
        continue
      }

      log(`Página carregada: ${page.users.length} usuário(s) encontrado(s)`)

      if (page.users.length === 0) break

      for (const user of page.users) {
        if (job.shouldStop) break
        if (processedIds.has(user.pk)) continue

        const skipped = await applyFilters(ig, user, config, job, log, processedIds)
        if (skipped) continue

        await limiter.pauseIfRateLimitReached()
        if (job.status === 'paused') job.status = 'running'
        if (job.shouldStop) break

        await executeUnfollow(ig, user, job, log, limiter, processedIds)
      }

      nextMaxId = page.next_max_id
      if (!nextMaxId) break
    }

    if (job.shouldStop) {
      job.status = 'stopped'
      emitEvent(job, { type: 'stopped', message: 'Remoção interrompida pelo usuário.', followed: job.followed, skipped: job.skipped, total: job.total })
      return
    }

    job.status = 'done'
    emitEvent(job, {
      type: 'done',
      message: `Concluído! ${job.followed} removidos · ${job.skipped} pulados`,
      followed: job.followed,
      skipped: job.skipped,
      total: job.total,
    })
  } catch (err) {
    job.status = 'error'
    emitEvent(job, { type: 'error', message: (err as Error).message, followed: job.followed, skipped: job.skipped, total: job.total })
  } finally {
    clearJob()
  }
}

async function applyFilters(
  ig: InstagramClient,
  user: UserInfo,
  config: UnfollowRunnerConfig,
  job: Job,
  log: (msg: string) => void,
  processedIds: Set<string>,
): Promise<boolean> {
  // Filter: only unfollow accounts that don't follow back
  if (config.onlyNotFollowingBack) {
    let fs
    try {
      fs = await ig.fetchFriendshipStatus(user.pk, 1)
    } catch {
      fs = { following: true, followed_by: false, outgoing_request: false }
    }
    await interruptibleSleep(randomDelay(5, 15), () => job.shouldStop)

    if (fs.followed_by) {
      processedIds.add(user.pk)
      job.skipped++
      log(`[=] @${user.username} — te segue de volta, pulando`)
      emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })
      return true
    }
  }

  // Filter: min/max followers
  if (config.filterByMinFollowers || config.filterByMaxFollowers) {
    let followerCount: number | undefined
    try {
      const profile = await ig.fetchUserProfile(user.username, 1)
      followerCount = profile.follower_count
    } catch {
      // couldn't fetch — let through
    }
    await interruptibleSleep(randomDelay(5, 10), () => job.shouldStop)

    if (followerCount !== undefined) {
      if (config.filterByMinFollowers && followerCount < config.minFollowers) {
        processedIds.add(user.pk)
        job.skipped++
        log(`[=] @${user.username} — ${followerCount.toLocaleString('pt-BR')} seguidores (mín: ${config.minFollowers.toLocaleString('pt-BR')}), pulando`)
        emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })
        return true
      }
      if (config.filterByMaxFollowers && followerCount > config.maxFollowers) {
        processedIds.add(user.pk)
        job.skipped++
        log(`[=] @${user.username} — ${followerCount.toLocaleString('pt-BR')} seguidores (máx: ${config.maxFollowers.toLocaleString('pt-BR')}), pulando`)
        emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })
        return true
      }
    }
  }

  return false
}

async function executeUnfollow(
  ig: InstagramClient,
  user: UserInfo,
  job: Job,
  log: (msg: string) => void,
  limiter: RateLimiter,
  processedIds: Set<string>,
): Promise<boolean> {
  try {
    await ig.unfollowUser(user.pk)
    processedIds.add(user.pk)
    job.followed++
    limiter.recordFollowTimestamp()

    const pct = job.total > 0 ? ` (${((job.followed / job.total) * 100).toFixed(1)}%)` : ''
    log(`[-] Removeu @${user.username}${pct} — hoje: ${limiter.followedToday}/${limiter.maxDay} · hora: ${limiter.followedThisHour}/${limiter.maxHour}`)
    emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })

    const isBatchEnd = job.followed % BATCH_SIZE === 0
    if (isBatchEnd) {
      const pause = randomDelay(BATCH_PAUSE_MIN_SEC, BATCH_PAUSE_MAX_SEC)
      log(`Pausa de lote: ${formatDuration(pause)}`)
      await interruptibleSleep(pause, () => job.shouldStop)
    } else {
      const delay = randomDelay(MIN_DELAY_SEC, MAX_DELAY_SEC)
      log(`Próxima remoção em ${formatDuration(delay)}...`)
      await interruptibleSleep(delay, () => job.shouldStop)
    }
    return true
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status
    if (status === 429 || status === 400) {
      log('Sinal de rate-limit inesperado. Pausando 15 minutos...')
      await interruptibleSleep(15 * 60_000, () => job.shouldStop)
      return false
    }
    log(`[!] Erro ao remover @${user.username}: ${(err as Error).message}`)
    job.skipped++
    return false
  }
}
