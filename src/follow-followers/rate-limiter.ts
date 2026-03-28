import { sleep, randomDelay, formatDuration, printTimestampedLog, printSectionHeader } from './helpers';

export const MAX_FOLLOWS_PER_HOUR = 40;
export const MAX_FOLLOWS_PER_DAY  = 120;

export class RateLimiter {
  private hourlyTimestamps: number[] = [];
  private dailyTimestamps: number[] = [];

  async pauseIfRateLimitReached(): Promise<void> {
    const now = Date.now();

    // Prune old entries
    this.hourlyTimestamps = this.hourlyTimestamps.filter(t => now - t < 3_600_000);
    this.dailyTimestamps  = this.dailyTimestamps.filter(t => now - t < 86_400_000);

    // Daily cap
    if (this.dailyTimestamps.length >= MAX_FOLLOWS_PER_DAY) {
      const oldest = this.dailyTimestamps[0];
      const waitMs = oldest + 86_400_000 - now + randomDelay(5, 15);
      printSectionHeader(
        `Daily limit of ${MAX_FOLLOWS_PER_DAY} follows reached.\n` +
        `  Resuming in ${formatDuration(waitMs)} (${new Date(Date.now() + waitMs).toLocaleTimeString()}).`
      );
      await sleep(waitMs);
      return this.pauseIfRateLimitReached(); // re-check after waking up
    }

    // Hourly cap
    if (this.hourlyTimestamps.length >= MAX_FOLLOWS_PER_HOUR) {
      const oldest = this.hourlyTimestamps[0];
      const waitMs = oldest + 3_600_000 - now + randomDelay(1, 5);
      printTimestampedLog(`Hourly limit of ${MAX_FOLLOWS_PER_HOUR} reached. Pausing ${formatDuration(waitMs)}...`);
      await sleep(waitMs);
      return this.pauseIfRateLimitReached();
    }
  }

  recordFollowTimestamp(): void {
    const now = Date.now();
    this.hourlyTimestamps.push(now);
    this.dailyTimestamps.push(now);
  }

  get followedToday(): number { return this.dailyTimestamps.length; }
  get followedThisHour(): number { return this.hourlyTimestamps.length; }
}
