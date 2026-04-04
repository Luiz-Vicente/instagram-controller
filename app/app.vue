<script setup lang="ts">
import { TooltipProvider } from './components/ui/tooltip';

useHead({
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap',
    },
  ],
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <TooltipProvider>
      <AppNavbar />
      <NuxtRouteAnnouncer />
      <main class="flex-1">
        <NuxtPage />
      </main>
      <AppFooter />
      <AppFeedbackButton />
    </TooltipProvider>
  </div>
</template>
