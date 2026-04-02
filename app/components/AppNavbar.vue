<template>
	<nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="mx-auto max-w-5xl flex h-12 items-center justify-between px-4">
			<NuxtLink to="/" class="flex items-center gap-2 font-semibold text-sm">
				Seguidor de Seguidores
				<Badge variant="secondary" class="text-xs">Beta</Badge>
			</NuxtLink>

			<div class="flex items-center gap-2">
				<NuxtLink
					to="/about"
					class="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1"
				>
					<Info class="w-3.5 h-3.5" />
					Como funciona
				</NuxtLink>
				<button
					class="p-1.5 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
					:aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
					@click="toggleDark()"
				>
					<Sun v-if="isDark" class="w-4 h-4" />
					<Moon v-else class="w-4 h-4" />
				</button>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Info, Sun, Moon } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
