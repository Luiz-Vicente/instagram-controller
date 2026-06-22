<template>
	<div class="min-h-screen bg-background p-4 sm:p-6">
		<div class="max-w-2xl mx-auto flex flex-col gap-8 py-4 sm:py-6">
			<!-- Header -->
			<div class="flex flex-col gap-2">
				<NuxtLink to="/unfollow" class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
					<ArrowLeft class="w-4 h-4" />
					{{ $t('aboutUnfollow.back') }}
				</NuxtLink>
				<h1 class="text-2xl sm:text-3xl font-bold mt-2">{{ $t('aboutUnfollow.title') }}</h1>
				<p class="text-muted-foreground">{{ $t('aboutUnfollow.subtitle') }}</p>
			</div>

			<!-- Visão geral -->
			<section class="flex flex-col gap-3">
				<h2 class="text-lg font-semibold">{{ $t('aboutUnfollow.overview.title') }}</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.overview.p1') }}</p>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.overview.p2') }}</p>
			</section>

			<!-- Filtros -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutUnfollow.filters.title') }}</h2>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<UserX class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.filters.notFollowingBack.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.filters.notFollowingBack.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Mecanismos de defesa -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutUnfollow.mechanisms.title') }}</h2>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.mechanisms.delays.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.mechanisms.delays.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Layers class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.mechanisms.batch.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.mechanisms.batch.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<ShieldCheck class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.mechanisms.rateLimit.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.mechanisms.rateLimit.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<RotateCcw class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.mechanisms.retry.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.mechanisms.retry.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Modos e risco -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutUnfollow.modes.title') }}</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.modes.intro') }}</p>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.modes.ultraSafe.label') }}</span>
							<Badge variant="secondary">{{ $t('aboutUnfollow.modes.ultraSafe.badge') }}</Badge>
						</div>
						<div class="text-sm text-muted-foreground">{{ $t('aboutUnfollow.modes.ultraSafe.rate') }}</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.modes.ultraSafe.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.modes.safe.label') }}</span>
							<Badge>{{ $t('aboutUnfollow.modes.safe.badge') }}</Badge>
						</div>
						<div class="text-sm text-muted-foreground">{{ $t('aboutUnfollow.modes.safe.rate') }}</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.modes.safe.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">{{ $t('aboutUnfollow.modes.risky.label') }}</span>
							<Badge variant="destructive">{{ $t('aboutUnfollow.modes.risky.badge') }}</Badge>
						</div>
						<div class="text-sm text-muted-foreground">{{ $t('aboutUnfollow.modes.risky.rate') }}</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.modes.risky.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Consequências -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutUnfollow.consequences.title') }}</h2>
				<div class="flex flex-col gap-2">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">{{ $t('aboutUnfollow.consequences.actionBlocked.label') }}</span>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.consequences.actionBlocked.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">{{ $t('aboutUnfollow.consequences.shadowban.label') }}</span>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.consequences.shadowban.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">{{ $t('aboutUnfollow.consequences.suspension.label') }}</span>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutUnfollow.consequences.suspension.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Boas práticas -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutUnfollow.bestPractices.title') }}</h2>
				<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
					<li v-for="(item, i) in $tm('aboutUnfollow.bestPractices.items')" :key="i" class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>{{ $rt(item) }}</span>
					</li>
				</ul>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ArrowLeft, Clock, Layers, ShieldCheck, RotateCcw, UserX } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
</script>
