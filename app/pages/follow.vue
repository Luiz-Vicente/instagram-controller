<template>
	<TooltipProvider>
		<!-- Hero cover -->
		<div class="w-full relative overflow-hidden" style="background: var(--brand-gradient)">
			<div class="absolute inset-0 bg-black/30" />
			<div class="relative w-full max-w-lg mx-auto px-4 py-10 flex flex-col gap-3">
				<nav class="flex items-center gap-1.5 text-xs text-white/70">
					<NuxtLink to="/" class="hover:text-white transition-colors">{{ $t('nav.tools') }}</NuxtLink>
					<ChevronRight class="w-3 h-3" />
					<span class="text-white/90">{{ $t('home.follower.title') }}</span>
				</nav>
				<h1 class="text-4xl text-white leading-none">{{ $t('home.follower.title') }}</h1>
				<p class="text-sm text-white/75">{{ $t('home.follower.description') }}</p>
				<NuxtLink
					to="/about"
					class="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors w-fit mt-1"
				>
					<Info class="w-3.5 h-3.5" />
					{{ $t('nav.howItWorks') }}
				</NuxtLink>
			</div>
		</div>

		<div class="w-full max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">

			<!-- Config form -->
			<div v-if="!running" class="flex flex-col gap-8">
				<div class="flex flex-col gap-1">
					<div class="flex items-center justify-between gap-2">
						<h1 class="text-2xl font-semibold tracking-tight">{{ $t('form.title') }}</h1>
						<span v-if="followedToday > 0" class="text-xs text-muted-foreground border rounded-md px-2 py-1 shrink-0">
							{{ $t('form.followedToday', { count: followedToday }) }}
						</span>
					</div>
					<p class="text-sm text-muted-foreground">{{ $t('form.description') }}</p>
				</div>

				<div class="flex flex-col gap-6">
					<!-- Credenciais -->
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-1.5">
							<div class="flex items-center gap-1.5">
								<Label for="session-id">Session ID</Label>
								<Tooltip>
									<TooltipTrigger as-child>
										<button type="button" class="text-muted-foreground hover:text-foreground transition-colors">
											<Info class="w-3.5 h-3.5" />
										</button>
									</TooltipTrigger>
									<TooltipContent class="max-w-64">{{ $t('form.sessionId.tooltip') }}</TooltipContent>
								</Tooltip>
							</div>
							<div class="relative">
								<Input
									id="session-id"
									v-model="sessionId"
									:type="showSessionId ? 'text' : 'password'"
									:placeholder="$t('form.sessionId.placeholder')"
									class="pr-9"
								/>
								<button
									type="button"
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									:aria-label="showSessionId ? $t('form.sessionId.hide') : $t('form.sessionId.show')"
									@click="showSessionId = !showSessionId"
								>
									<EyeOff v-if="showSessionId" class="w-4 h-4" />
									<Eye v-else class="w-4 h-4" />
								</button>
							</div>
						</div>

						<div class="flex flex-col gap-1.5">
							<div class="flex items-center gap-1.5">
								<Label for="target-user">{{ $t('form.targetUser.label') }}</Label>
								<Tooltip>
									<TooltipTrigger as-child>
										<button type="button" class="text-muted-foreground hover:text-foreground transition-colors">
											<Info class="w-3.5 h-3.5" />
										</button>
									</TooltipTrigger>
									<TooltipContent class="max-w-64">{{ $t('form.targetUser.tooltip') }}</TooltipContent>
								</Tooltip>
							</div>
							<Input
								id="target-user"
								v-model="targetUser"
								:placeholder="$t('form.targetUser.placeholder')"
							/>
						</div>
					</div>

					<!-- Modos de seguimento -->
					<div class="flex flex-col gap-3">
						<div class="flex items-center gap-1.5">
							<Label>{{ $t('form.mode.label') }}</Label>
							<Tooltip>
								<TooltipTrigger as-child>
									<button type="button" class="text-muted-foreground hover:text-foreground transition-colors">
										<Info class="w-3.5 h-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent class="max-w-64">{{ $t('form.mode.tooltip') }}</TooltipContent>
							</Tooltip>
						</div>
						<RadioGroup v-model="followMode" class="flex flex-col gap-3">
							<label
								v-for="mode in followModes"
								:key="mode.value"
								:for="mode.value"
								class="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors"
								:class="followMode === mode.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
							>
								<RadioGroupItem :id="mode.value" :value="mode.value" class="mt-0.5" />
								<div class="flex flex-col gap-1">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm">{{ mode.label }}</span>
										<Badge :variant="mode.badgeVariant">{{ mode.badge }}</Badge>
									</div>
									<span class="text-xs text-muted-foreground">
										{{ $t('form.mode.rateInfo', { perHour: mode.perHour, perDay: mode.perDay }) }}
									</span>
								</div>
							</label>
						</RadioGroup>
					</div>

					<!-- Filtros de conta -->
					<div class="flex flex-col gap-3">
						<Label>{{ $t('form.filters.label') }}</Label>

						<div class="flex items-center gap-3 cursor-pointer" @click="followPrivate = !followPrivate">
							<Checkbox v-model="followPrivate" class="pointer-events-none" />
							<span class="text-sm select-none">{{ $t('form.filters.private') }}</span>
						</div>

						<div class="flex items-center gap-3 cursor-pointer" @click="followAlreadyFollowers = !followAlreadyFollowers">
							<Checkbox v-model="followAlreadyFollowers" class="pointer-events-none" />
							<span class="text-sm select-none">{{ $t('form.filters.alreadyFollowers') }}</span>
						</div>

						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-3 cursor-pointer" @click="filterByFollowers = !filterByFollowers">
								<Checkbox v-model="filterByFollowers" class="pointer-events-none" />
								<span class="text-sm select-none">{{ $t('form.filters.minFollowers') }}</span>
							</div>
							<div v-if="filterByFollowers" class="ml-7">
								<Input
									id="min-followers-count"
									v-model="minFollowers"
									type="number"
									min="0"
									:placeholder="$t('form.filters.minFollowersPlaceholder')"
									class="w-48"
								/>
							</div>
						</div>
					</div>
				</div>

				<button
					class="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
					:disabled="!sessionId || !targetUser || starting"
					@click="start"
				>
					<Loader2 v-if="starting" class="w-4 h-4 mr-2 animate-spin" />
					{{ starting ? $t('form.submitting') : $t('form.submit') }}
				</button>
			</div>

			<!-- Progress view -->
			<div v-else class="flex flex-col gap-6">
				<div class="flex flex-col gap-1">
					<div class="flex items-center justify-between gap-2">
						<h1 class="text-2xl font-semibold tracking-tight truncate">{{ $t('progress.title', { user: targetUser.replace(/^@/, '') }) }}</h1>
						<Badge :variant="statusBadgeVariant" class="shrink-0">{{ statusLabel }}</Badge>
					</div>
					<p class="text-sm text-muted-foreground">{{ $t('progress.description') }}</p>
				</div>

				<!-- Keep tab open warning -->
				<div v-if="jobStatus === 'running' || jobStatus === 'paused'" class="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400">
					<span>⚠</span>
					<span>{{ $t('progress.keepTabOpen') }}</span>
				</div>

				<!-- Progress bar -->
				<div class="flex flex-col gap-2">
					<div class="flex justify-between text-sm text-muted-foreground">
						<span>{{ progress.followed }} {{ $t('progress.followed').toLowerCase() }}</span>
						<span v-if="progress.total > 0">{{ progressPct }}% {{ $t('progress.of') }} {{ progress.total.toLocaleString(locale) }}</span>
					</div>
					<div class="w-full h-2 bg-muted rounded-full overflow-hidden">
						<div
							class="h-full bg-primary transition-all duration-500 rounded-full"
							:style="{ width: `${progressPct}%` }"
						/>
					</div>
				</div>

				<!-- Stats -->
				<div class="grid grid-cols-3 gap-2 sm:gap-3">
					<div class="rounded-lg border p-2 sm:p-3 flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground">{{ $t('progress.followed') }}</span>
						<span class="text-xl sm:text-2xl font-semibold">{{ progress.followed }}</span>
					</div>
					<div class="rounded-lg border p-2 sm:p-3 flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground">{{ $t('progress.skipped') }}</span>
						<span class="text-xl sm:text-2xl font-semibold">{{ progress.skipped }}</span>
					</div>
					<div class="rounded-lg border p-2 sm:p-3 flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground">{{ $t('progress.today') }}</span>
						<span class="text-xl sm:text-2xl font-semibold">{{ followedToday }}</span>
					</div>
				</div>

				<!-- Pause notice -->
				<div v-if="pauseInfo" class="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
					<Clock class="w-4 h-4 mt-0.5 shrink-0" />
					<span>{{ pauseInfo }}</span>
				</div>

				<!-- Log -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Log</span>
					<div ref="logEl" class="h-48 overflow-y-auto rounded-lg border bg-muted/30 p-3 flex flex-col gap-1 font-mono text-xs">
						<span v-for="(line, i) in logs" :key="i" :class="line.startsWith('[+]') ? 'text-green-600 dark:text-green-400' : line.startsWith('[!]') ? 'text-destructive' : 'text-muted-foreground'">
							{{ line }}
						</span>
						<span v-if="logs.length === 0" class="text-muted-foreground italic">{{ $t('progress.awaitingLogs') }}</span>
					</div>
				</div>

				<button
					v-if="jobStatus === 'running' || jobStatus === 'paused'"
					class="w-full inline-flex items-center justify-center rounded-md border border-destructive text-destructive text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-destructive/10 disabled:opacity-50 disabled:pointer-events-none"
					:disabled="stopping"
					@click="stop"
				>
					<Loader2 v-if="stopping" class="w-4 h-4 mr-2 animate-spin" />
					{{ stopping ? $t('progress.stopping') : $t('progress.stop') }}
				</button>
				<button
					v-else
					class="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-primary/90"
					@click="reset"
				>
					{{ $t('progress.newFollow') }}
				</button>
			</div>

		</div>
	</TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useLocalStorage, useEventSource } from '@vueuse/core'
const { t, locale } = useI18n()
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, Loader2, Clock, Eye, EyeOff, ChevronRight } from 'lucide-vue-next'

// ── Follow timestamps (localStorage) ────────────────────────────────────────
const allTimestamps = useLocalStorage<number[]>('ig_follow_timestamps', [])
const followTimestamps = computed(() => {
	const cutoff = Date.now() - 86_400_000
	return allTimestamps.value.filter(ts => ts > cutoff)
})
const followedToday = computed(() => followTimestamps.value.length)

// ── Form state ──────────────────────────────────────────────────────────────
const sessionId = ref('')
const showSessionId = ref(false)
const targetUser = ref('')
const followMode = ref('safe')
const followPrivate = ref(false)
const followAlreadyFollowers = ref(false)
const filterByFollowers = ref(false)
const minFollowers = ref<string | number | undefined>(undefined)

// ── UI state ────────────────────────────────────────────────────────────────
const running = ref(false)
const starting = ref(false)
const stopping = ref(false)
const jobStatus = ref<'running' | 'paused' | 'done' | 'error' | 'stopped'>('running')
const progress = ref({ followed: 0, skipped: 0, total: 0 })
const logs = ref<string[]>([])
const pauseInfo = ref('')
const logEl = ref<HTMLElement | null>(null)

// ── SSE ──────────────────────────────────────────────────────────────────────
const sseUrl = ref<string | null>(null)
const { data: sseData, close: closeSSE } = useEventSource(sseUrl)

watch(sseData, async (raw) => {
	if (!raw) return
	const event = JSON.parse(raw) as {
		type: string
		message?: string
		followed?: number
		skipped?: number
		total?: number
	}

	if (event.followed !== undefined) {
		const delta = event.followed - progress.value.followed
		if (delta > 0) {
			const now = Date.now()
			const cutoff = now - 86_400_000
			allTimestamps.value = [
				...allTimestamps.value.filter(ts => ts > cutoff),
				...Array<number>(delta).fill(now),
			]
		}
		progress.value.followed = event.followed
	}
	if (event.skipped !== undefined) progress.value.skipped = event.skipped
	if (event.total !== undefined) progress.value.total = event.total

	if (event.type === 'log' && event.message) {
		logs.value.push(event.message)
		await nextTick()
		if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
	}

	if (event.type === 'pause') {
		jobStatus.value = 'paused'
		pauseInfo.value = event.message ?? ''
	}

	if (event.type === 'progress') {
		jobStatus.value = 'running'
		pauseInfo.value = ''
	}

	if (event.type === 'done' || event.type === 'error' || event.type === 'stopped') {
		jobStatus.value = event.type as typeof jobStatus.value
		if (event.message) logs.value.push(event.message)
		pauseInfo.value = ''
		sseUrl.value = null
	}
})

// ── Computed ────────────────────────────────────────────────────────────────
const progressPct = computed(() => {
	if (!progress.value.total) return 0
	return Math.min(100, Math.round((progress.value.followed / progress.value.total) * 100))
})

const statusLabel = computed(() => ({
	running: t('status.running'),
	paused: t('status.paused'),
	done: t('status.done'),
	error: t('status.error'),
	stopped: t('status.stopped'),
}[jobStatus.value] ?? t('status.running')))

const statusBadgeVariant = computed(() => ({
	running: 'default',
	paused: 'secondary',
	done: 'default',
	error: 'destructive',
	stopped: 'secondary',
}[jobStatus.value] as 'default' | 'secondary' | 'destructive'))

// ── Actions ──────────────────────────────────────────────────────────────────
async function start() {
	starting.value = true
	try {
		await $fetch('/api/follow/start', {
			method: 'POST',
			body: {
				sessionId: sessionId.value,
				targetUser: targetUser.value,
				followMode: followMode.value,
				followPrivate: followPrivate.value,
				followAlreadyFollowers: followAlreadyFollowers.value,
				filterByFollowers: filterByFollowers.value,
				minFollowers: Number(minFollowers.value) || 0,
				previousTimestamps: followTimestamps.value,
			},
		})
		running.value = true
		sseUrl.value = '/api/follow/status'
		jobStatus.value = 'running'
		logs.value = []
		progress.value = { followed: 0, skipped: 0, total: 0 }
		pauseInfo.value = ''
	} catch (err: unknown) {
		const msg = (err as { data?: { message?: string } })?.data?.message ?? t('form.errorStarting')
		alert(msg)
	} finally {
		starting.value = false
	}
}

async function stop() {
	stopping.value = true
	try {
		await $fetch('/api/follow/stop', { method: 'POST' })
	} catch {}
	stopping.value = false
}

function reset() {
	sseUrl.value = null
	running.value = false
	logs.value = []
	pauseInfo.value = ''
	progress.value = { followed: 0, skipped: 0, total: 0 }
}

// ── Follow modes data ────────────────────────────────────────────────────────
const followModes = computed(() => [
	{
		value: 'ultra-safe',
		label: t('form.mode.ultraSafe.label'),
		badge: t('form.mode.ultraSafe.badge'),
		badgeVariant: 'secondary' as const,
		perHour: 20,
		perDay: 60,
	},
	{
		value: 'safe',
		label: t('form.mode.safe.label'),
		badge: t('form.mode.safe.badge'),
		badgeVariant: 'default' as const,
		perHour: 40,
		perDay: 120,
	},
	{
		value: 'risky',
		label: t('form.mode.risky.label'),
		badge: t('form.mode.risky.badge'),
		badgeVariant: 'destructive' as const,
		perHour: 80,
		perDay: 300,
	},
])
</script>
