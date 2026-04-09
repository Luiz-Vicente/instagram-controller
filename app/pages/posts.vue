<template>
	<TooltipProvider>
		<!-- Hero cover -->
		<div class="w-full relative overflow-hidden" style="background: var(--brand-gradient)">
			<div class="absolute inset-0 bg-black/30" />
			<div class="relative w-full max-w-lg mx-auto px-4 py-10 flex flex-col gap-3">
				<nav class="flex items-center gap-1.5 text-xs text-white/70">
					<NuxtLink to="/" class="hover:text-white transition-colors">{{ $t('nav.tools') }}</NuxtLink>
					<ChevronRight class="w-3 h-3" />
					<span class="text-white/90">{{ $t('home.postManager.title') }}</span>
				</nav>
				<h1 class="text-4xl text-white leading-none">{{ $t('home.postManager.title') }}</h1>
				<p class="text-sm text-white/75">{{ $t('home.postManager.description') }}</p>
			</div>
		</div>

		<div class="w-full max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">

			<!-- Config form -->
			<div v-if="!running" class="flex flex-col gap-8">
				<div class="flex flex-col gap-1">
					<h1 class="text-2xl font-semibold tracking-tight">{{ $t('posts.form.title') }}</h1>
					<p class="text-sm text-muted-foreground">{{ $t('posts.form.description') }}</p>
				</div>

				<div class="flex flex-col gap-6">
					<!-- Session ID -->
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

					<!-- Ação -->
					<div class="flex flex-col gap-3">
						<Label>{{ $t('posts.form.action.label') }}</Label>
						<div class="grid grid-cols-2 gap-2">
							<label
								for="action-archive"
								class="flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors"
								:class="action === 'archive' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
							>
								<input id="action-archive" v-model="action" type="radio" value="archive" class="sr-only" />
								<Archive class="w-4 h-4 shrink-0" :class="action === 'archive' ? 'text-primary' : 'text-muted-foreground'" />
								<div class="flex flex-col gap-0.5">
									<span class="text-sm font-medium">{{ $t('posts.form.action.archive') }}</span>
									<span class="text-xs text-muted-foreground">{{ $t('posts.form.action.archiveDesc') }}</span>
								</div>
							</label>
							<label
								for="action-delete"
								class="flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors"
								:class="action === 'delete' ? 'border-destructive bg-destructive/5' : 'border-border hover:bg-muted/50'"
							>
								<input id="action-delete" v-model="action" type="radio" value="delete" class="sr-only" />
								<Trash2 class="w-4 h-4 shrink-0" :class="action === 'delete' ? 'text-destructive' : 'text-muted-foreground'" />
								<div class="flex flex-col gap-0.5">
									<span class="text-sm font-medium" :class="action === 'delete' ? 'text-destructive' : ''">{{ $t('posts.form.action.delete') }}</span>
									<span class="text-xs text-muted-foreground">{{ $t('posts.form.action.deleteDesc') }}</span>
								</div>
							</label>
						</div>
					</div>

					<!-- Aviso de exclusão -->
					<div v-if="action === 'delete'" class="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-3 text-sm text-destructive">
						<TriangleAlert class="w-4 h-4 shrink-0 mt-0.5" />
						<span>{{ $t('posts.form.deleteWarning') }}</span>
					</div>

					<!-- Tipos de post -->
					<div class="flex flex-col gap-3">
						<div class="flex items-center gap-1.5">
							<Label>{{ $t('posts.form.types.label') }}</Label>
							<Tooltip>
								<TooltipTrigger as-child>
									<button type="button" class="text-muted-foreground hover:text-foreground transition-colors">
										<Info class="w-3.5 h-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent class="max-w-64">{{ $t('posts.form.types.tooltip') }}</TooltipContent>
							</Tooltip>
						</div>
						<div class="grid grid-cols-2 gap-2">
							<div
								v-for="type in postTypeOptions"
								:key="type.value"
								class="flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors select-none"
								:class="postTypes.includes(type.value) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
								@click="togglePostType(type.value)"
							>
								<Checkbox :model-value="postTypes.includes(type.value)" class="pointer-events-none" />
								<component :is="type.icon" class="w-4 h-4 shrink-0 text-muted-foreground" />
								<span class="text-sm">{{ type.label }}</span>
							</div>
						</div>
						<p v-if="postTypes.length === 0" class="text-xs text-muted-foreground">{{ $t('posts.form.types.allHint') }}</p>
					</div>

					<!-- Filtro de data -->
					<div class="flex flex-col gap-3">
						<div class="flex items-center gap-3 cursor-pointer" @click="filterByDate = !filterByDate">
							<Checkbox v-model="filterByDate" class="pointer-events-none" />
							<span class="text-sm select-none">{{ $t('posts.form.dateFilter.label') }}</span>
						</div>
						<div v-if="filterByDate" class="flex flex-col gap-3 ml-7">
							<div class="grid grid-cols-2 gap-3">
								<div class="flex flex-col gap-1.5">
									<Label class="text-xs text-muted-foreground">{{ $t('posts.form.dateFilter.from') }}</Label>
									<Input v-model="dateFrom" type="date" class="w-full" />
								</div>
								<div class="flex flex-col gap-1.5">
									<Label class="text-xs text-muted-foreground">{{ $t('posts.form.dateFilter.to') }}</Label>
									<Input v-model="dateTo" type="date" class="w-full" />
								</div>
							</div>
							<p v-if="!dateFrom && !dateTo" class="text-xs text-muted-foreground">{{ $t('posts.form.dateFilter.hint') }}</p>
						</div>
					</div>
				</div>

				<button
					class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
					:class="action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'"
					:disabled="!sessionId || starting"
					@click="start"
				>
					<Loader2 v-if="starting" class="w-4 h-4 mr-2 animate-spin" />
					{{ starting ? $t('posts.form.submitting') : submitLabel }}
				</button>
			</div>

			<!-- Progress view -->
			<div v-else class="flex flex-col gap-6">
				<div class="flex flex-col gap-1">
					<div class="flex items-center justify-between gap-2">
						<h1 class="text-2xl font-semibold tracking-tight">{{ progressTitle }}</h1>
						<Badge :variant="statusBadgeVariant" class="shrink-0">{{ statusLabel }}</Badge>
					</div>
					<p class="text-sm text-muted-foreground">{{ $t('posts.progress.description') }}</p>
				</div>

				<!-- Keep tab open warning -->
				<div v-if="jobStatus === 'running' || jobStatus === 'paused'" class="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400">
					<span>⚠</span>
					<span>{{ $t('posts.progress.keepTabOpen') }}</span>
				</div>

				<!-- Scan phase notice -->
				<div v-if="isScanning" class="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
					<Loader2 class="w-4 h-4 shrink-0 animate-spin" />
					<span>{{ $t('posts.progress.scanning') }}</span>
				</div>

				<!-- Progress bar (only shown when total is known) -->
				<div v-if="!isScanning && progress.total > 0" class="flex flex-col gap-2">
					<div class="flex justify-between text-sm text-muted-foreground">
						<span>{{ progress.processed }} {{ processedLabel }}</span>
						<span>{{ progressPct }}% {{ $t('posts.progress.of') }} {{ progress.total.toLocaleString(locale) }}</span>
					</div>
					<div class="w-full h-2 bg-muted rounded-full overflow-hidden">
						<div
							class="h-full bg-primary transition-all duration-500 rounded-full"
							:style="{ width: `${progressPct}%` }"
						/>
					</div>
				</div>

				<!-- Stats -->
				<div v-if="!isScanning" class="grid grid-cols-3 gap-2 sm:gap-3">
					<div class="rounded-lg border p-2 sm:p-3 flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground">{{ processedLabel }}</span>
						<span class="text-xl sm:text-2xl font-semibold">{{ progress.processed }}</span>
					</div>
					<div class="rounded-lg border p-2 sm:p-3 flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground">{{ $t('posts.progress.errors') }}</span>
						<span class="text-xl sm:text-2xl font-semibold">{{ progress.errors }}</span>
					</div>
					<div class="rounded-lg border p-2 sm:p-3 flex flex-col gap-0.5">
						<span class="text-xs text-muted-foreground">{{ $t('posts.progress.total') }}</span>
						<span class="text-xl sm:text-2xl font-semibold">{{ progress.total }}</span>
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
						<span
							v-for="(line, i) in logs"
							:key="i"
							:class="line.startsWith('[✓]') ? 'text-green-600 dark:text-green-400' : line.startsWith('[!]') ? 'text-destructive' : 'text-muted-foreground'"
						>
							{{ line }}
						</span>
						<span v-if="logs.length === 0" class="text-muted-foreground italic">{{ $t('posts.progress.awaitingLogs') }}</span>
					</div>
				</div>

				<button
					v-if="jobStatus === 'running' || jobStatus === 'paused'"
					class="w-full inline-flex items-center justify-center rounded-md border border-destructive text-destructive text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-destructive/10 disabled:opacity-50 disabled:pointer-events-none"
					:disabled="stopping"
					@click="stop"
				>
					<Loader2 v-if="stopping" class="w-4 h-4 mr-2 animate-spin" />
					{{ stopping ? $t('posts.progress.stopping') : $t('posts.progress.stop') }}
				</button>
				<button
					v-else
					class="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-primary/90"
					@click="reset"
				>
					{{ $t('posts.progress.newOperation') }}
				</button>
			</div>

		</div>
	</TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useEventSource } from '@vueuse/core'
const { t, locale } = useI18n()
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, Loader2, Clock, Eye, EyeOff, ChevronRight, Archive, Trash2, Image, Video, Clapperboard, Images, TriangleAlert } from 'lucide-vue-next'

type PostActionType = 'archive' | 'delete'
type PostMediaType = 'photo' | 'video' | 'reel' | 'carousel'

// ── Form state ──────────────────────────────────────────────────────────────
const sessionId = ref('')
const showSessionId = ref(false)
const action = ref<PostActionType>('archive')
const postTypes = ref<PostMediaType[]>([])
const filterByDate = ref(false)
const dateFrom = ref('')
const dateTo = ref('')

// ── UI state ────────────────────────────────────────────────────────────────
const running = ref(false)
const starting = ref(false)
const stopping = ref(false)
const jobStatus = ref<'running' | 'paused' | 'done' | 'error' | 'stopped'>('running')
const progress = ref({ processed: 0, errors: 0, total: 0 })
const isScanning = ref(true)
const logs = ref<string[]>([])
const pauseInfo = ref('')
const logEl = ref<HTMLElement | null>(null)

// ── SSE ──────────────────────────────────────────────────────────────────────
const sseUrl = ref<string | null>(null)
const { data: sseData } = useEventSource(sseUrl)

watch(sseData, async (raw) => {
	if (!raw) return
	const event = JSON.parse(raw) as {
		type: string
		message?: string
		followed?: number
		skipped?: number
		total?: number
	}

	if (event.followed !== undefined) progress.value.processed = event.followed
	if (event.skipped !== undefined) progress.value.errors = event.skipped
	if (event.total !== undefined) {
		progress.value.total = event.total
		if (event.total > 0) isScanning.value = false
	}

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
		isScanning.value = false
		if (event.message) logs.value.push(event.message)
		pauseInfo.value = ''
		sseUrl.value = null
	}
})

// ── Computed ─────────────────────────────────────────────────────────────────
const progressPct = computed(() => {
	if (!progress.value.total) return 0
	return Math.min(100, Math.round((progress.value.processed / progress.value.total) * 100))
})

const processedLabel = computed(() =>
	action.value === 'archive' ? t('posts.progress.archived') : t('posts.progress.deleted')
)

const progressTitle = computed(() =>
	action.value === 'archive' ? t('posts.progress.titleArchive') : t('posts.progress.titleDelete')
)

const submitLabel = computed(() =>
	action.value === 'archive' ? t('posts.form.submitArchive') : t('posts.form.submitDelete')
)

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

// ── Post type options ─────────────────────────────────────────────────────────
const postTypeOptions = computed(() => [
	{ value: 'photo' as PostMediaType, label: t('posts.form.types.photo'), icon: Image },
	{ value: 'video' as PostMediaType, label: t('posts.form.types.video'), icon: Video },
	{ value: 'reel' as PostMediaType, label: t('posts.form.types.reel'), icon: Clapperboard },
	{ value: 'carousel' as PostMediaType, label: t('posts.form.types.carousel'), icon: Images },
])

function togglePostType(type: PostMediaType) {
	const idx = postTypes.value.indexOf(type)
	if (idx === -1) postTypes.value.push(type)
	else postTypes.value.splice(idx, 1)
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function start() {
	starting.value = true
	try {
		await $fetch('/api/posts/start', {
			method: 'POST',
			body: {
				sessionId: sessionId.value,
				action: action.value,
				postTypes: postTypes.value,
				filterByDate: filterByDate.value,
				dateFrom: dateFrom.value,
				dateTo: dateTo.value,
			},
		})
		running.value = true
		sseUrl.value = '/api/posts/status'
		jobStatus.value = 'running'
		isScanning.value = true
		logs.value = []
		progress.value = { processed: 0, errors: 0, total: 0 }
		pauseInfo.value = ''
	} catch (err: unknown) {
		const msg = (err as { data?: { message?: string } })?.data?.message ?? t('posts.form.errorStarting')
		alert(msg)
	} finally {
		starting.value = false
	}
}

async function stop() {
	stopping.value = true
	try {
		await $fetch('/api/posts/stop', { method: 'POST' })
	} catch {}
	stopping.value = false
}

function reset() {
	sseUrl.value = null
	running.value = false
	isScanning.value = true
	logs.value = []
	pauseInfo.value = ''
	progress.value = { processed: 0, errors: 0, total: 0 }
}
</script>
