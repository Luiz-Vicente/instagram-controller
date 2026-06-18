<template>
	<div class="min-h-screen bg-background p-4 sm:p-6">
		<div class="max-w-2xl mx-auto flex flex-col gap-8 py-4 sm:py-6">
			<!-- Header -->
			<div class="flex flex-col gap-2">
				<NuxtLink to="/posts" class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
					<ArrowLeft class="w-4 h-4" />
					{{ $t('aboutPosts.back') }}
				</NuxtLink>
				<h1 class="text-2xl sm:text-3xl font-bold mt-2">{{ $t('aboutPosts.title') }}</h1>
				<p class="text-muted-foreground">{{ $t('aboutPosts.subtitle') }}</p>
			</div>

			<!-- Visão geral -->
			<section class="flex flex-col gap-3">
				<h2 class="text-lg font-semibold">{{ $t('aboutPosts.overview.title') }}</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.overview.p1') }}</p>
				<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.overview.p2') }}</p>
			</section>

			<!-- Ações -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutPosts.actions.title') }}</h2>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Archive class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.actions.archive.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.actions.archive.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Trash2 class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.actions.delete.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.actions.delete.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Filtros -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutPosts.filters.title') }}</h2>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<LayoutGrid class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.filters.types.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.filters.types.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<CalendarRange class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.filters.dateRange.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.filters.dateRange.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Combine class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.filters.combining.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.filters.combining.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Como funciona por dentro -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutPosts.mechanisms.title') }}</h2>
				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<ScanSearch class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.mechanisms.scan.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.mechanisms.scan.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.mechanisms.delays.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.mechanisms.delays.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Layers class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.mechanisms.batch.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.mechanisms.batch.body') }}</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<RotateCcw class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">{{ $t('aboutPosts.mechanisms.retry.title') }}</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{{ $t('aboutPosts.mechanisms.retry.body') }}</p>
					</div>
				</div>
			</section>

			<!-- Boas práticas -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">{{ $t('aboutPosts.bestPractices.title') }}</h2>
				<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
					<li v-for="(item, i) in $tm('aboutPosts.bestPractices.items')" :key="i" class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>{{ $rt(item) }}</span>
					</li>
				</ul>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ArrowLeft, Clock, Layers, RotateCcw, Archive, Trash2, LayoutGrid, CalendarRange, Combine, ScanSearch } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
</script>
