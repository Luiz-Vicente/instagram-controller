<template>
	<div class="min-h-screen bg-background p-4 sm:p-6">
		<div class="max-w-2xl mx-auto flex flex-col gap-8 py-4 sm:py-6">
			<!-- Header -->
			<div class="flex flex-col gap-2">
				<NuxtLink to="/remove-followers" class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
					<ArrowLeft class="w-4 h-4" />
					{{ $t('aboutRemoveFollowers.back') }}
				</NuxtLink>
				<h1 class="text-2xl sm:text-3xl font-bold mt-2">{{ $t('aboutRemoveFollowers.title') }}</h1>
				<p class="text-muted-foreground">{{ $t('aboutRemoveFollowers.subtitle') }}</p>
			</div>

			<!-- Visão geral -->
			<section class="flex flex-col gap-3">
				<h2 class="text-lg font-semibold">{{ $t('aboutRemoveFollowers.overview.title') }}</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.overview.p1') }}</p>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.overview.p2') }}</p>
			</section>

			<!-- Mecanismos de defesa -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutRemoveFollowers.mechanisms.title') }}</h2>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.mechanisms.delays.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.mechanisms.delays.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Layers class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.mechanisms.batch.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.mechanisms.batch.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<ShieldCheck class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.mechanisms.rateLimit.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.mechanisms.rateLimit.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Modos e risco -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutRemoveFollowers.modes.title') }}</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.modes.intro') }}</p>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.modes.ultraSafe.label') }}</span>
							<Badge variant="secondary">{{ $t('aboutRemoveFollowers.modes.ultraSafe.badge') }}</Badge>
						</div>
						<div class="text-sm text-muted-foreground">{{ $t('aboutRemoveFollowers.modes.ultraSafe.rate') }}</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.modes.ultraSafe.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.modes.safe.label') }}</span>
							<Badge>{{ $t('aboutRemoveFollowers.modes.safe.badge') }}</Badge>
						</div>
						<div class="text-sm text-muted-foreground">{{ $t('aboutRemoveFollowers.modes.safe.rate') }}</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.modes.safe.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.modes.risky.label') }}</span>
							<Badge variant="destructive">{{ $t('aboutRemoveFollowers.modes.risky.badge') }}</Badge>
						</div>
						<div class="text-sm text-muted-foreground">{{ $t('aboutRemoveFollowers.modes.risky.rate') }}</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.modes.risky.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Consequências -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutRemoveFollowers.consequences.title') }}</h2>
				<div class="flex flex-col gap-2">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.consequences.actionBlocked.label') }}</span>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.consequences.actionBlocked.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">{{ $t('aboutRemoveFollowers.consequences.shadowban.label') }}</span>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutRemoveFollowers.consequences.shadowban.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Boas práticas -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutRemoveFollowers.bestPractices.title') }}</h2>
				<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
					<li v-for="(item, i) in $tm('aboutRemoveFollowers.bestPractices.items')" :key="i" class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>{{ $rt(item) }}</span>
					</li>
				</ul>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ArrowLeft, Clock, Layers, ShieldCheck } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
</script>
