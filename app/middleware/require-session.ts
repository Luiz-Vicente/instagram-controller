export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const sessionId = localStorage.getItem('ig_session_id')
  if (!sessionId) {
    return navigateTo('/account')
  }
})
