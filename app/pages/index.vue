<template>
	<div class="w-full max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">
		<div class="flex flex-col gap-1">
			<h1 class="text-3xl">{{ $t('home.title') }}</h1>
			<p class="text-sm text-muted-foreground">{{ $t('home.subtitle') }}</p>
		</div>

		<!-- Aviso de sessão não configurada -->
		<div v-if="!sessionId" class="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
			<AlertCircle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
			<span class="text-amber-700 dark:text-amber-400">
				{{ $t('account.noSession.notice') }}
				<NuxtLink to="/account" class="underline font-medium">{{ $t('account.noSession.cta') }}</NuxtLink>
			</span>
		</div>

		<div class="flex flex-col gap-3">
			<!-- Seguidor de seguidores -->
			<NuxtLink
				to="/follow"
				class="flex items-start gap-4 rounded-lg border p-5 transition-colors hover:bg-muted/50 hover:border-primary/50 group"
			>
				<div class="mt-0.5 p-2 rounded-md bg-primary/10 text-primary shrink-0">
					<UserPlus class="w-5 h-5" />
				</div>
				<div class="flex flex-col gap-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-sm">{{ $t('home.follower.title') }}</span>
						<span class="text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.new') }}</span>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.follower.description') }}</p>
				</div>
				<ArrowRight class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
			</NuxtLink>

			<!-- Removedor de seguimentos -->
			<NuxtLink
				to="/unfollow"
				class="flex items-start gap-4 rounded-lg border p-5 transition-colors hover:bg-muted/50 hover:border-primary/50 group"
			>
				<div class="mt-0.5 p-2 rounded-md bg-primary/10 text-primary shrink-0">
					<UserMinus class="w-5 h-5" />
				</div>
				<div class="flex flex-col gap-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-sm">{{ $t('home.unfollower.title') }}</span>
						<span class="text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.new') }}</span>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.unfollower.description') }}</p>
				</div>
				<ArrowRight class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
			</NuxtLink>
			<!-- Removedor de seguidores -->
			<NuxtLink
				to="/remove-followers"
				class="flex items-start gap-4 rounded-lg border p-5 transition-colors hover:bg-muted/50 hover:border-primary/50 group"
			>
				<div class="mt-0.5 p-2 rounded-md bg-primary/10 text-primary shrink-0">
					<UserX class="w-5 h-5" />
				</div>
				<div class="flex flex-col gap-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-sm">{{ $t('home.removeFollowers.title') }}</span>
						<span class="text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.new') }}</span>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.removeFollowers.description') }}</p>
				</div>
				<ArrowRight class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
			</NuxtLink>

			<!-- Gerenciador de posts -->
			<NuxtLink
				to="/posts"
				class="flex items-start gap-4 rounded-lg border p-5 transition-colors hover:bg-muted/50 hover:border-primary/50 group"
			>
				<div class="mt-0.5 p-2 rounded-md bg-primary/10 text-primary shrink-0">
					<LayoutGrid class="w-5 h-5" />
				</div>
				<div class="flex flex-col gap-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-sm">{{ $t('home.postManager.title') }}</span>
						<span class="text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.new') }}</span>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.postManager.description') }}</p>
				</div>
				<ArrowRight class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
			</NuxtLink>
		</div>
	</div>
</template>

<script setup lang="ts">
import { UserPlus, UserMinus, UserX, ArrowRight, LayoutGrid, AlertCircle } from 'lucide-vue-next'

const { sessionId } = useSession()
</script>
