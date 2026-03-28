import { runFollowFollowers } from './follow-followers/runner';

runFollowFollowers().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
