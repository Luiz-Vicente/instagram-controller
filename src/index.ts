import * as readlineSync from 'readline-sync';
import { InstagramClient, sleep, randomDelay } from './instagram';
import type { UserInfo } from './instagram';

// ─── Safe rate-limit thresholds ──────────────────────────────────────────────
// Instagram's undocumented limits are ~60/hour and ~150-200/day.
// We stay well below to minimise block risk.
const MAX_FOLLOWS_PER_HOUR = 40;
const MAX_FOLLOWS_PER_DAY  = 120;
const MIN_DELAY_SEC        = 30;   // min wait between individual follows
const MAX_DELAY_SEC        = 75;   // max wait between individual follows
const BATCH_SIZE           = 10;   // follows before a longer mid-session pause
const BATCH_PAUSE_MIN_SEC  = 120;  // 2 min
const BATCH_PAUSE_MAX_SEC  = 300;  // 5 min

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function log(msg: string): void {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function logSection(msg: string): void {
  console.log('\n' + '─'.repeat(60));
  log(msg);
  console.log('─'.repeat(60));
}

// ─── Rate-limit tracker ───────────────────────────────────────────────────────
class RateLimiter {
  private hourlyTimestamps: number[] = [];
  private dailyTimestamps: number[] = [];

  /** Returns how many ms to wait before the next follow (0 = proceed now). */
  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    // Prune old entries
    this.hourlyTimestamps = this.hourlyTimestamps.filter(t => now - t < 3_600_000);
    this.dailyTimestamps  = this.dailyTimestamps.filter(t => now - t < 86_400_000);

    // Daily cap
    if (this.dailyTimestamps.length >= MAX_FOLLOWS_PER_DAY) {
      const oldest = this.dailyTimestamps[0];
      const waitMs = oldest + 86_400_000 - now + randomDelay(5, 15);
      logSection(
        `Daily limit of ${MAX_FOLLOWS_PER_DAY} follows reached.\n` +
        `  Resuming in ${fmt(waitMs)} (${new Date(Date.now() + waitMs).toLocaleTimeString()}).`
      );
      await sleep(waitMs);
      return this.waitIfNeeded(); // re-check after waking up
    }

    // Hourly cap
    if (this.hourlyTimestamps.length >= MAX_FOLLOWS_PER_HOUR) {
      const oldest = this.hourlyTimestamps[0];
      const waitMs = oldest + 3_600_000 - now + randomDelay(1, 5);
      log(`Hourly limit of ${MAX_FOLLOWS_PER_HOUR} reached. Pausing ${fmt(waitMs)}...`);
      await sleep(waitMs);
      return this.waitIfNeeded();
    }
  }

  record(): void {
    const now = Date.now();
    this.hourlyTimestamps.push(now);
    this.dailyTimestamps.push(now);
  }

  get followedToday(): number { return this.dailyTimestamps.length; }
  get followedThisHour(): number { return this.hourlyTimestamps.length; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  Instagram Auto-Follow  —  follow all followers of a profile');
  console.log('='.repeat(60));
  console.log();

  const sessionId = readlineSync
    .question('Paste your Instagram session_id cookie: ', { hideEchoBack: true })
    .trim();
  if (!sessionId) { console.error('session_id cannot be empty.'); process.exit(1); }

  const targetUsername = readlineSync
    .question('Target Instagram username (without @): ')
    .trim()
    .replace(/^@/, '');
  if (!targetUsername) { console.error('Username cannot be empty.'); process.exit(1); }

  console.log();
  log('Initialising session...');

  const ig = new InstagramClient(sessionId);
  try {
    await ig.init();
  } catch (err) {
    console.error(`Session init failed: ${(err as Error).message}`);
    process.exit(1);
  }

  log('Session ready. Fetching target profile...');

  let targetUser: UserInfo | null = null;
  let currentUsername = targetUsername;

  while (!targetUser) {
    try {
      const candidate = await ig.getUserInfo(currentUsername);
      if (candidate.is_private) {
        log(`"${currentUsername}" is private — followers are not accessible.`);
      } else {
        targetUser = candidate;
      }
    } catch (err) {
      log(`Could not fetch "${currentUsername}": ${(err as Error).message}`);
    }

    if (!targetUser) {
      currentUsername = readlineSync
        .question('Try another username (leave empty to quit): ')
        .trim()
        .replace(/^@/, '');
      if (!currentUsername) { log('Aborted.'); process.exit(0); }
    }
  }

  const totalFollowers = targetUser.follower_count ?? 0;
  log(
    `Found: @${targetUser.username} (${targetUser.full_name}) — ` +
    `${totalFollowers.toLocaleString()} followers`
  );

  // Rough ETA: each follow costs ~50s on average; daily limit adds overnight pauses
  const avgSecPerFollow = (MIN_DELAY_SEC + MAX_DELAY_SEC) / 2;
  const daysNeeded = Math.ceil(totalFollowers / MAX_FOLLOWS_PER_DAY);
  log(
    `Will follow ALL of them continuously.\n` +
    `  Limits: ${MAX_FOLLOWS_PER_HOUR}/hour · ${MAX_FOLLOWS_PER_DAY}/day\n` +
    `  Avg delay: ~${avgSecPerFollow}s between follows\n` +
    `  Rough estimate: ~${daysNeeded} day(s) of total runtime`
  );
  console.log();

  const confirmed = readlineSync.keyInYNStrict('Start? ');
  if (!confirmed) { log('Aborted.'); process.exit(0); }
  console.log();

  const limiter = new RateLimiter();
  let followed = 0;
  let skipped = 0;
  let nextMaxId: string | undefined;
  const followedIds = new Set<string>();

  while (true) {
    // ── Fetch next page of followers ────────────────────────────────────────
    let page;
    try {
      page = await ig.getFollowersPage(targetUser.pk, nextMaxId);
    } catch (err) {
      log(`Error fetching followers page: ${(err as Error).message}. Retrying in 60s...`);
      await sleep(60_000);
      continue;
    }

    if (page.users.length === 0) {
      logSection('No more followers to process — all done!');
      break;
    }

    // ── Process each user on this page ──────────────────────────────────────
    for (const user of page.users) {
      if (followedIds.has(user.pk)) continue;

      // Check real friendship status before attempting follow
      let fs;
      try {
        fs = await ig.showFriendship(user.pk);
      } catch {
        fs = { following: false, followed_by: false, outgoing_request: false };
      }

      if (fs.following || fs.outgoing_request || fs.followed_by) {
        followedIds.add(user.pk);
        const reason = fs.following        ? 'already following'
                     : fs.outgoing_request ? 'request pending'
                     :                       'already follows you';
        log(`[=] @${user.username} — ${reason}, skipping`);
        continue;
      }

      // Check and apply rate-limit pauses BEFORE attempting the follow
      await limiter.waitIfNeeded();

      try {
        const success = await ig.followUser(user.pk);
        followedIds.add(user.pk);

        if (success) {
          followed++;
          limiter.record();
          const progress = totalFollowers > 0
            ? ` (${((followed / totalFollowers) * 100).toFixed(1)}%)`
            : '';
          log(
            `[+] Followed @${user.username}${progress} — ` +
            `today: ${limiter.followedToday}/${MAX_FOLLOWS_PER_DAY} · ` +
            `this hour: ${limiter.followedThisHour}/${MAX_FOLLOWS_PER_HOUR}`
          );
        } else {
          skipped++;
          log(`[~] @${user.username} — already following or request pending`);
          followedIds.add(user.pk);
        }
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 429 || status === 400) {
          log('Unexpected rate-limit signal. Pausing 15 minutes...');
          await sleep(15 * 60_000);
          continue;
        }
        log(`[!] Error following @${user.username}: ${(err as Error).message}`);
        skipped++;
      }

      // ── Per-follow delay ────────────────────────────────────────────────
      const delay = randomDelay(MIN_DELAY_SEC, MAX_DELAY_SEC);
      const isBatchEnd = (followed + skipped) % BATCH_SIZE === 0 && (followed + skipped) > 0;
      if (isBatchEnd) {
        const pause = randomDelay(BATCH_PAUSE_MIN_SEC, BATCH_PAUSE_MAX_SEC);
        log(`Batch pause: ${fmt(pause)}`);
        await sleep(pause);
      } else {
        log(`Next follow in ${fmt(delay)}...`);
        await sleep(delay);
      }
    }

    // ── Advance to next page ─────────────────────────────────────────────
    nextMaxId = page.next_max_id;
    if (!nextMaxId) {
      logSection('Reached end of followers list — all done!');
      break;
    }
  }

  console.log();
  console.log('='.repeat(60));
  log(`Finished! Total followed: ${followed} | Skipped: ${skipped}`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
