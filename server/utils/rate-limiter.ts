import { interruptibleSleep, randomDelay } from './helpers'

export const LIMITS = {
  'ultra-safe': { perHour: 20, perDay: 60 },
  safe: { perHour: 40, perDay: 120 },
  risky: { perHour: 80, perDay: 300 },
} as const

export type FollowMode = keyof typeof LIMITS

export class RateLimiter {
  private hourlyTimestamps: number[] = []
  private dailyTimestamps: number[] = []
  private maxPerHour: number
  private maxPerDay: number
  onPause?: (reason: string, durationMs: number) => void
  shouldStop?: () => boolean

  constructor(mode: FollowMode = 'safe', initialTimestamps: number[] = []) {
    this.maxPerHour = LIMITS[mode].perHour
    this.maxPerDay = LIMITS[mode].perDay
    const now = Date.now()
    this.dailyTimestamps = initialTimestamps.filter(t => now - t < 86_400_000)
    this.hourlyTimestamps = initialTimestamps.filter(t => now - t < 3_600_000)
  }

  async pauseIfRateLimitReached(): Promise<void> {
    const now = Date.now()
    this.hourlyTimestamps = this.hourlyTimestamps.filter(t => now - t < 3_600_000)
    this.dailyTimestamps = this.dailyTimestamps.filter(t => now - t < 86_400_000)

    if (this.dailyTimestamps.length >= this.maxPerDay) {
      const oldest = this.dailyTimestamps[0]!
      const waitMs = oldest + 86_400_000 - now + randomDelay(5, 15)
      this.onPause?.(`Limite diário de ${this.maxPerDay} seguimentos atingido`, waitMs)
      await interruptibleSleep(waitMs, () => this.shouldStop?.() ?? false)
      return this.pauseIfRateLimitReached()
    }

    if (this.hourlyTimestamps.length >= this.maxPerHour) {
      const oldest = this.hourlyTimestamps[0]!
      const waitMs = oldest + 3_600_000 - now + randomDelay(1, 5)
      this.onPause?.(`Limite horário de ${this.maxPerHour} seguimentos atingido`, waitMs)
      await interruptibleSleep(waitMs, () => this.shouldStop?.() ?? false)
      return this.pauseIfRateLimitReached()
    }
  }

  recordFollowTimestamp(): void {
    const now = Date.now()
    this.hourlyTimestamps.push(now)
    this.dailyTimestamps.push(now)
  }

  get followedToday(): number { return this.dailyTimestamps.length }
  get followedThisHour(): number { return this.hourlyTimestamps.length }
  get maxDay(): number { return this.maxPerDay }
  get maxHour(): number { return this.maxPerHour }
}
