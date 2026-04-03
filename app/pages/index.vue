<template>
	<div class="min-h-screen bg-background flex items-center justify-center p-3 sm:p-6">
		<TooltipProvider>
			<div class="w-full max-w-lg">
			<!-- Config form -->
			<Card v-if="!running" class="w-full">
				<CardHeader>
					<div class="flex items-center justify-between gap-2">
						<CardTitle class="text-xl sm:text-2xl">{{ $t('form.title') }}</CardTitle>
						<span v-if="followedToday > 0" class="text-xs text-muted-foreground border rounded-md px-2 py-1 shrink-0">
							{{ $t('form.followedToday', { count: followedToday }) }}
						</span>
					</div>
					<CardDescription>{{ $t('form.description') }}</CardDescription>
				</CardHeader>

				<CardContent class="flex flex-col gap-6">
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
				</CardContent>

				<CardFooter>
					<button
						class="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
						:disabled="!sessionId || !targetUser || starting"
						@click="start"
					>
						<Loader2 v-if="starting" class="w-4 h-4 mr-2 animate-spin" />
						{{ starting ? $t('form.submitting') : $t('form.submit') }}
					</button>
				</CardFooter>
			</Card>

			<!-- Progress view -->
			<Card v-else class="w-full">
				<CardHeader>
					<div class="flex items-center justify-between gap-2">
						<CardTitle class="text-xl sm:text-2xl truncate">{{ $t('progress.title', { user: targetUser.replace(/^@/, '') }) }}</CardTitle>
						<Badge :variant="statusBadgeVariant" class="shrink-0">{{ statusLabel }}</Badge>
					</div>
					<CardDescription>{{ $t('progress.description') }}</CardDescription>
				</CardHeader>

				<CardContent class="flex flex-col gap-5">
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
				</CardContent>

				<CardFooter>
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
				</CardFooter>
			</Card>
		</div>
	</TooltipProvider>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
const { t, locale } = useI18n()
import {
	Card, CardHeader, CardTitle, CardDescription,
	CardContent, CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, Loader2, Clock, Eye, EyeOff } from 'lucide-vue-next'

// ── Follow timestamps (localStorage) ────────────────────────────────────────
const LS_KEY = 'ig_follow_timestamps'

function loadTodayTimestamps(): number[] {
	try {
		const raw = localStorage.getItem(LS_KEY)
		if (!raw) return []
		const all = JSON.parse(raw) as number[]
		const cutoff = Date.now() - 86_400_000
		return all.filter(t => t > cutoff)
	} catch { return [] }
}

function saveTimestamps(ts: number[]): void {
	try { localStorage.setItem(LS_KEY, JSON.stringify(ts)) } catch {}
}

const followTimestamps = ref<number[]>([])
const followedToday = computed(() => followTimestamps.value.length)

onMounted(() => {
	followTimestamps.value = loadTodayTimestamps()
})

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

let sse: EventSource | null = null

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
		jobStatus.value = 'running'
		logs.value = []
		progress.value = { followed: 0, skipped: 0, total: 0 }
		pauseInfo.value = ''
		openSSE()
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
	sse?.close()
	sse = null
	running.value = false
	logs.value = []
	pauseInfo.value = ''
	progress.value = { followed: 0, skipped: 0, total: 0 }
}

// ── SSE ──────────────────────────────────────────────────────────────────────
function openSSE() {
	sse?.close()
	sse = new EventSource('/api/follow/status')

	sse.onmessage = async (e) => {
		const event = JSON.parse(e.data) as {
			type: string
			message?: string
			followed?: number
			skipped?: number
			total?: number
			pauseUntil?: number
		}

		if (event.followed !== undefined) {
			const delta = event.followed - progress.value.followed
			if (delta > 0) {
				const now = Date.now()
				for (let i = 0; i < delta; i++) followTimestamps.value.push(now)
				saveTimestamps(followTimestamps.value)
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
			sse?.close()
		}
	}

	sse.onerror = () => {
		sse?.close()
	}
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
