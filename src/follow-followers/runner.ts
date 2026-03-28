import * as readlineSync from 'readline-sync';
import { InstagramClient } from './instagram-client';
import type { UserInfo } from './instagram-client';
import { RateLimiter, MAX_FOLLOWS_PER_HOUR, MAX_FOLLOWS_PER_DAY } from './rate-limiter';
import { sleep, randomDelay, formatDuration, printTimestampedLog, printSectionHeader } from './helpers';

const MIN_DELAY_SEC       = 30;   // min wait between individual follows
const MAX_DELAY_SEC       = 75;   // max wait between individual follows
const BATCH_SIZE          = 10;   // follows before a longer mid-session pause
const BATCH_PAUSE_MIN_SEC = 120;  // 2 min
const BATCH_PAUSE_MAX_SEC = 300;  // 5 min

export async function runFollowFollowers(): Promise<void> {
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
  printTimestampedLog('Initialising session...');

  const ig = new InstagramClient(sessionId);
  try {
    await ig.initializeSession();
  } catch (err) {
    console.error(`Session init failed: ${(err as Error).message}`);
    process.exit(1);
  }

  printTimestampedLog('Session ready. Fetching target profile...');

  let targetUser: UserInfo | null = null;
  let currentUsername = targetUsername;

  while (!targetUser) {
    try {
      const candidate = await ig.fetchUserProfile(currentUsername);
      if (candidate.is_private) {
        printTimestampedLog(`"${currentUsername}" is private — followers are not accessible.`);
      } else {
        targetUser = candidate;
      }
    } catch (err) {
      printTimestampedLog(`Could not fetch "${currentUsername}": ${(err as Error).message}`);
    }

    if (!targetUser) {
      currentUsername = readlineSync
        .question('Try another username (leave empty to quit): ')
        .trim()
        .replace(/^@/, '');
      if (!currentUsername) { printTimestampedLog('Aborted.'); process.exit(0); }
    }
  }

  const totalFollowers = targetUser.follower_count ?? 0;
  printTimestampedLog(
    `Found: @${targetUser.username} (${targetUser.full_name}) — ` +
    `${totalFollowers.toLocaleString()} followers`
  );

  // Rough ETA: each follow costs ~50s on average; daily limit adds overnight pauses
  const avgSecPerFollow = (MIN_DELAY_SEC + MAX_DELAY_SEC) / 2;
  const daysNeeded = Math.ceil(totalFollowers / MAX_FOLLOWS_PER_DAY);
  printTimestampedLog(
    `Will follow ALL of them continuously.\n` +
    `  Limits: ${MAX_FOLLOWS_PER_HOUR}/hour · ${MAX_FOLLOWS_PER_DAY}/day\n` +
    `  Avg delay: ~${avgSecPerFollow}s between follows\n` +
    `  Rough estimate: ~${daysNeeded} day(s) of total runtime`
  );
  console.log();

  const confirmed = readlineSync.keyInYNStrict('Start? ');
  if (!confirmed) { printTimestampedLog('Aborted.'); process.exit(0); }
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
      page = await ig.fetchFollowersPage(targetUser.pk, nextMaxId);
    } catch (err) {
      printTimestampedLog(`Error fetching followers page: ${(err as Error).message}. Retrying in 60s...`);
      await sleep(60_000);
      continue;
    }

    if (page.users.length === 0) {
      printSectionHeader('No more followers to process — all done!');
      break;
    }

    // ── Process each user on this page ──────────────────────────────────────
    for (const user of page.users) {
      if (followedIds.has(user.pk)) continue;

      // Check real friendship status before attempting follow
      let fs;
      try {
        fs = await ig.fetchFriendshipStatus(user.pk);
      } catch {
        fs = { following: false, followed_by: false, outgoing_request: false };
      }

      if (fs.following || fs.outgoing_request || fs.followed_by) {
        followedIds.add(user.pk);
        const reason = fs.following        ? 'already following'
                     : fs.outgoing_request ? 'request pending'
                     :                       'already follows you';
        printTimestampedLog(`[=] @${user.username} — ${reason}, skipping`);
        continue;
      }

      // Check and apply rate-limit pauses BEFORE attempting the follow
      await limiter.pauseIfRateLimitReached();

      try {
        const success = await ig.followUser(user.pk);
        followedIds.add(user.pk);

        if (success) {
          followed++;
          limiter.recordFollowTimestamp();
          const progress = totalFollowers > 0
            ? ` (${((followed / totalFollowers) * 100).toFixed(1)}%)`
            : '';
          printTimestampedLog(
            `[+] Followed @${user.username}${progress} — ` +
            `today: ${limiter.followedToday}/${MAX_FOLLOWS_PER_DAY} · ` +
            `this hour: ${limiter.followedThisHour}/${MAX_FOLLOWS_PER_HOUR}`
          );

          // ── Delay only after an actual follow ──────────────────────────
          const isBatchEnd = followed % BATCH_SIZE === 0;
          if (isBatchEnd) {
            const pause = randomDelay(BATCH_PAUSE_MIN_SEC, BATCH_PAUSE_MAX_SEC);
            printTimestampedLog(`Batch pause: ${formatDuration(pause)}`);
            await sleep(pause);
          } else {
            const delay = randomDelay(MIN_DELAY_SEC, MAX_DELAY_SEC);
            printTimestampedLog(`Next follow in ${formatDuration(delay)}...`);
            await sleep(delay);
          }
        } else {
          skipped++;
          printTimestampedLog(`[~] @${user.username} — already following or request pending`);
          followedIds.add(user.pk);
        }
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 429 || status === 400) {
          printTimestampedLog('Unexpected rate-limit signal. Pausing 15 minutes...');
          await sleep(15 * 60_000);
          continue;
        }
        printTimestampedLog(`[!] Error following @${user.username}: ${(err as Error).message}`);
        skipped++;
      }
    }

    // ── Advance to next page ─────────────────────────────────────────────
    nextMaxId = page.next_max_id;
    if (!nextMaxId) {
      printSectionHeader('Reached end of followers list — all done!');
      break;
    }
  }

  console.log();
  console.log('='.repeat(60));
  printTimestampedLog(`Finished! Total followed: ${followed} | Skipped: ${skipped}`);
  console.log('='.repeat(60));
}
