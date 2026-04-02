import { InstagramClient } from './instagram-client'
import { RateLimiter, type FollowMode } from './rate-limiter'
import { interruptibleSleep, randomDelay, formatDuration } from './helpers'
import { type Job, emitEvent, clearJob } from './job-manager'

const MIN_DELAY_SEC = 60
const MAX_DELAY_SEC = 120
const BATCH_SIZE = 10
const BATCH_PAUSE_MIN_SEC = 120
const BATCH_PAUSE_MAX_SEC = 300

export interface RunnerConfig {
  sessionId: string
  targetUser: string
  followMode: FollowMode
  followPrivate: boolean
  followAlreadyFollowers: boolean
  filterByFollowers: boolean
  minFollowers: number
  previousTimestamps: number[]
}

export async function runFollowJob(config: RunnerConfig, job: Job): Promise<void> {
  const log = (message: string) => emitEvent(job, { type: 'log', message, followed: job.followed, skipped: job.skipped, total: job.total })

  try {
    const ig = new InstagramClient(config.sessionId)
    ig.onRetry = (status, waitSec) => log(`HTTP ${status} — aguardando ${waitSec}s antes de tentar novamente...`)

    log('Inicializando sessão...')
    await ig.initializeSession()

    log(`Buscando perfil @${config.targetUser}...`)
    const targetProfile = await ig.fetchUserProfile(config.targetUser)

    if (targetProfile.is_private) {
      throw new Error(`O perfil @${config.targetUser} é privado — não é possível acessar os seguidores.`)
    }

    job.total = targetProfile.follower_count ?? 0
    log(`Encontrado: @${targetProfile.username} — ${job.total.toLocaleString('pt-BR')} seguidores`)

    emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })

    const limiter = new RateLimiter(config.followMode, config.previousTimestamps)
    limiter.shouldStop = () => job.shouldStop
    limiter.onPause = (reason, durationMs) => {
      job.status = 'paused'
      const pauseUntil = Date.now() + durationMs
      emitEvent(job, { type: 'pause', message: `${reason}. Retomando em ${formatDuration(durationMs)}`, pauseUntil, followed: job.followed, skipped: job.skipped, total: job.total })
    }

    const followedIds = new Set<string>()
    let nextMaxId: string | undefined

    while (true) {
      if (job.shouldStop) {
        job.status = 'stopped'
        emitEvent(job, { type: 'stopped', message: 'Seguimento interrompido pelo usuário.', followed: job.followed, skipped: job.skipped, total: job.total })
        clearJob()
        return
      }

      log('Buscando próxima página de seguidores...')
      let page
      try {
        page = await ig.fetchFollowersPage(targetProfile.pk, nextMaxId)
      } catch (err) {
        log(`Erro ao buscar seguidores: ${(err as Error).message}. Tentando novamente em 60s...`)
        await interruptibleSleep(60_000, () => job.shouldStop)
        continue
      }
      log(`Página carregada: ${page.users.length} usuário(s) encontrado(s)`)

      if (page.users.length === 0) {
        break
      }

      for (const user of page.users) {
        if (job.shouldStop) break
        if (followedIds.has(user.pk)) continue

        // Filter: private accounts
        if (!config.followPrivate && user.is_private) {
          job.skipped++
          followedIds.add(user.pk)
          log(`[=] @${user.username} — conta privada, pulando`)
          continue
        }

        // Filter: minimum followers
        if (config.filterByFollowers && config.minFollowers > 0) {
          let followerCount: number | undefined
          try {
            const profile = await ig.fetchUserProfile(user.username, 1)
            followerCount = profile.follower_count
          } catch {
            // couldn't fetch — let the account through
          }
          const delay = randomDelay(5, 10)
          log(`Aguardando ${formatDuration(delay)} após consulta de perfil...`)
          await interruptibleSleep(delay, () => job.shouldStop)
          if (followerCount !== undefined && followerCount < config.minFollowers) {
            job.skipped++
            followedIds.add(user.pk)
            log(`[=] @${user.username} — ${followerCount} seguidores (mínimo: ${config.minFollowers}), pulando`)
            continue
          }
        }

        // Check friendship status
        let fs
        try {
          fs = await ig.fetchFriendshipStatus(user.pk, 1)
        } catch {
          fs = { following: false, followed_by: false, outgoing_request: false }
        }
        const fsDelay = randomDelay(5, 15)
        await interruptibleSleep(fsDelay, () => job.shouldStop)

        if (fs.following || fs.outgoing_request) {
          followedIds.add(user.pk)
          const reason = fs.following ? 'já segue' : 'solicitação pendente'
          job.skipped++
          log(`[=] @${user.username} — ${reason}, pulando`)
          continue
        }

        // Filter: accounts that already follow me
        if (!config.followAlreadyFollowers && fs.followed_by) {
          followedIds.add(user.pk)
          job.skipped++
          log(`[=] @${user.username} — já te segue, pulando`)
          continue
        }

        await limiter.pauseIfRateLimitReached()
        if (job.status === 'paused') job.status = 'running'

        if (job.shouldStop) break

        try {
          const success = await ig.followUser(user.pk)
          followedIds.add(user.pk)

          if (success) {
            job.followed++
            limiter.recordFollowTimestamp()
            const pct = job.total > 0 ? ` (${((job.followed / job.total) * 100).toFixed(1)}%)` : ''
            log(`[+] Seguiu @${user.username}${pct} — hoje: ${limiter.followedToday}/${limiter.maxDay} · hora: ${limiter.followedThisHour}/${limiter.maxHour}`)
            emitEvent(job, { type: 'progress', followed: job.followed, skipped: job.skipped, total: job.total })

            const isBatchEnd = job.followed % BATCH_SIZE === 0
            if (isBatchEnd) {
              const pause = randomDelay(BATCH_PAUSE_MIN_SEC, BATCH_PAUSE_MAX_SEC)
              log(`Pausa de lote: ${formatDuration(pause)}`)
              await interruptibleSleep(pause, () => job.shouldStop)
            } else {
              const delay = randomDelay(MIN_DELAY_SEC, MAX_DELAY_SEC)
              log(`Próximo seguimento em ${formatDuration(delay)}...`)
              await interruptibleSleep(delay, () => job.shouldStop)
            }
          } else {
            job.skipped++
            log(`[~] @${user.username} — já está sendo seguido`)
            followedIds.add(user.pk)
          }
        } catch (err) {
          const status = (err as { response?: { status?: number } }).response?.status
          if (status === 429 || status === 400) {
            log('Sinal de rate-limit inesperado. Pausando 15 minutos...')
            await interruptibleSleep(15 * 60_000, () => job.shouldStop)
            continue
          }
          log(`[!] Erro ao seguir @${user.username}: ${(err as Error).message}`)
          job.skipped++
        }
      }

      nextMaxId = page.next_max_id
      if (!nextMaxId) break
    }

    job.status = 'done'
    emitEvent(job, {
      type: 'done',
      message: `Concluído! ${job.followed} seguidos · ${job.skipped} pulados`,
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
