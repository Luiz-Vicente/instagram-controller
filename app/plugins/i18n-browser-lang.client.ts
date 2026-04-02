export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()
  const i18n = nuxtApp.$i18n as { setLocale: (locale: string) => void }

  try {
    const lang = navigator.language || navigator.languages?.[0] || ''
    i18n.setLocale(lang.toLowerCase().startsWith('pt') ? 'pt' : 'en')
  } catch {
    // keep default locale
  }
})
