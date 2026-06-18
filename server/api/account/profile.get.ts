import { InstagramClient } from '../../utils/instagram-client'

export default defineEventHandler(async (event) => {
  const { sessionId } = getQuery(event) as { sessionId?: string }

  if (!sessionId) {
    throw createError({ statusCode: 400, message: 'sessionId is required' })
  }

  const client = new InstagramClient(sessionId)
  await client.initializeSession()

  // current_user?edit=true doesn't return follower/following counts
  // fetch full profile by username to get accurate stats
  const currentUser = await client.fetchCurrentUser()
  const fullProfile = await client.fetchUserProfile(currentUser.username)

  return {
    username: currentUser.username,
    full_name: currentUser.full_name,
    follower_count: fullProfile.follower_count ?? 0,
    following_count: fullProfile.following_count ?? 0,
    profile_pic_url: fullProfile.profile_pic_url ?? null,
  }
})
