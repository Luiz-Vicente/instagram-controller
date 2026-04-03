<template>
	<div class="w-full max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">
		<div class="flex flex-col gap-1">
			<h1 class="text-3xl">{{ $t('home.title') }}</h1>
			<p class="text-sm text-muted-foreground">{{ $t('home.subtitle') }}</p>
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

			<!-- Removedor de seguidores (em breve) -->
			<div class="flex items-start gap-4 rounded-lg border p-5 opacity-50 cursor-not-allowed select-none">
				<div class="mt-0.5 p-2 rounded-md bg-muted text-muted-foreground shrink-0">
					<UserMinus class="w-5 h-5" />
				</div>
				<div class="flex flex-col gap-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-sm">{{ $t('home.unfollower.title') }}</span>
						<span class="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 leading-none">{{ $t('home.soon') }}</span>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">{{ $t('home.unfollower.description') }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { UserPlus, UserMinus, ArrowRight } from 'lucide-vue-next'
</script>
