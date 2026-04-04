<template>
	<nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="mx-auto max-w-5xl flex h-12 items-center justify-between px-4">
			<NuxtLink to="/" class="flex items-center gap-2 font-bold text-sm tracking-tight">
				<span class="bg-clip-text text-transparent" style="background-image: var(--brand-gradient)">{{ $t('nav.title') }}</span>
				<Tooltip>
					<TooltipTrigger as-child>
						<Badge variant="secondary" class="text-xs cursor-default">Beta</Badge>
					</TooltipTrigger>
					<TooltipContent class="max-w-56 text-center">
						{{ $t('nav.betaWarning') }}
					</TooltipContent>
				</Tooltip>
			</NuxtLink>

			<div class="flex items-center gap-2">
				<!-- Hamburguer — visível apenas fora da home -->
				<button
					v-if="!isHome"
					class="p-1.5 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
					:aria-label="$t('nav.tools')"
					@click="sidebarOpen = true"
				>
					<Menu class="w-4 h-4" />
				</button>

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

	<!-- Sidebar overlay -->
	<Transition name="fade">
		<div
			v-if="sidebarOpen"
			class="fixed inset-0 z-50 bg-black/50"
			@click="sidebarOpen = false"
		/>
	</Transition>

	<!-- Sidebar panel -->
	<Transition name="slide">
		<aside
			v-if="sidebarOpen"
			class="fixed top-0 right-0 z-50 h-full w-72 bg-background border-l flex flex-col"
		>
			<div class="flex items-center justify-between px-4 h-12 border-b shrink-0">
				<span class="text-sm font-semibold">{{ $t('nav.tools') }}</span>
				<button
					class="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
					@click="sidebarOpen = false"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<div class="flex flex-col gap-2 p-4">
				<!-- Seguidor de seguidores -->
				<NuxtLink
					to="/follow"
					class="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/50 group"
					@click="sidebarOpen = false"
				>
					<div class="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
						<UserPlus class="w-4 h-4" />
					</div>
					<div class="flex flex-col gap-0.5 min-w-0">
						<div class="flex items-center gap-1.5 flex-wrap">
							<span class="text-sm font-medium">{{ $t('home.follower.title') }}</span>
							<span class="text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.new') }}</span>
						</div>
						<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.follower.description') }}</p>
					</div>
				</NuxtLink>

				<!-- Removedor (em breve) -->
				<div class="flex items-start gap-3 rounded-lg border p-3 opacity-50 cursor-not-allowed select-none">
					<div class="p-1.5 rounded-md bg-muted text-muted-foreground shrink-0 mt-0.5">
						<UserMinus class="w-4 h-4" />
					</div>
					<div class="flex flex-col gap-0.5 min-w-0">
						<div class="flex items-center gap-1.5 flex-wrap">
							<span class="text-sm font-medium">{{ $t('home.unfollower.title') }}</span>
							<span class="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.soon') }}</span>
						</div>
						<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.unfollower.description') }}</p>
					</div>
				</div>

				<!-- Gerenciador de posts (em breve) -->
				<div class="flex items-start gap-3 rounded-lg border p-3 opacity-50 cursor-not-allowed select-none">
					<div class="p-1.5 rounded-md bg-muted text-muted-foreground shrink-0 mt-0.5">
						<LayoutGrid class="w-4 h-4" />
					</div>
					<div class="flex flex-col gap-0.5 min-w-0">
						<div class="flex items-center gap-1.5 flex-wrap">
							<span class="text-sm font-medium">{{ $t('home.postManager.title') }}</span>
							<span class="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.soon') }}</span>
						</div>
						<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.postManager.description') }}</p>
					</div>
				</div>
			</div>
		</aside>
	</Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { Menu, X, Sun, Moon, UserPlus, UserMinus, LayoutGrid } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const route = useRoute()
const isHome = computed(() => route.path === '/')
const sidebarOpen = ref(false)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
