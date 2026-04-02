<script setup lang="ts">
import { TooltipProvider } from './components/ui/tooltip';
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
