<script setup lang="ts">
import { TooltipProvider } from './components/ui/tooltip';

useHead({
  link: [
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
  <div>
    <TooltipProvider>
      <AppNavbar />
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </TooltipProvider>
  </div>
</template>
