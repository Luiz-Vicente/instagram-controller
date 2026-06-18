import { useLocalStorage } from '@vueuse/core'

export const useSession = () => {
  const sessionId = useLocalStorage<string>('ig_session_id', '')
  return { sessionId }
}
