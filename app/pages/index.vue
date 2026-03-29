<template>
	<div class="min-h-screen bg-background flex items-center justify-center p-6">
		<button
			class="fixed top-4 right-4 p-2 rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
			:aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
			@click="toggleDark()"
		>
			<Sun v-if="isDark" class="w-4 h-4" />
			<Moon v-else class="w-4 h-4" />
		</button>

		<TooltipProvider>
			<!-- Config form -->
			<Card v-if="!running" class="w-full max-w-lg">
				<CardHeader>
					<CardTitle class="text-2xl">Seguidor de Seguidores</CardTitle>
					<CardDescription>Configure suas credenciais e o modo de seguimento.</CardDescription>
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
									<TooltipContent class="max-w-64">
										Token de autenticação da sua sessão no Instagram. Para obtê-lo, acesse o Instagram pelo navegador,
										abra o DevTools (F12), vá em Application → Cookies e copie o valor do cookie
										<strong>sessionid</strong>.
									</TooltipContent>
								</Tooltip>
							</div>
							<Input
								id="session-id"
								v-model="sessionId"
								type="password"
								placeholder="Cole aqui o seu session ID"
							/>
						</div>

						<div class="flex flex-col gap-1.5">
							<div class="flex items-center gap-1.5">
								<Label for="target-user">Usuário alvo</Label>
								<Tooltip>
									<TooltipTrigger as-child>
										<button type="button" class="text-muted-foreground hover:text-foreground transition-colors">
											<Info class="w-3.5 h-3.5" />
										</button>
									</TooltipTrigger>
									<TooltipContent class="max-w-64">
										O perfil cujos seguidores você quer seguir. O bot irá percorrer a lista de seguidores desse usuário e
										seguir cada um deles conforme os filtros configurados.
									</TooltipContent>
								</Tooltip>
							</div>
							<Input
								id="target-user"
								v-model="targetUser"
								placeholder="@username"
							/>
						</div>
					</div>

					<!-- Modos de seguimento -->
					<div class="flex flex-col gap-3">
						<div class="flex items-center gap-1.5">
							<Label>Modo de seguimento</Label>
							<Tooltip>
								<TooltipTrigger as-child>
									<button type="button" class="text-muted-foreground hover:text-foreground transition-colors">
										<Info class="w-3.5 h-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent class="max-w-64">
									Define a velocidade dos seguimentos. Modos mais rápidos aumentam o risco de bloqueio temporário pela
									plataforma. Recomendamos o modo <strong>Segura</strong> para uso contínuo.
								</TooltipContent>
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
										{{ mode.perHour }} seguimentos/hora · {{ mode.perDay }} seguimentos/dia
									</span>
								</div>
							</label>
						</RadioGroup>
					</div>

					<!-- Filtros de conta -->
					<div class="flex flex-col gap-3">
						<Label>Filtros de conta</Label>

						<div class="flex items-center gap-3 cursor-pointer" @click="followPrivate = !followPrivate">
							<Checkbox v-model="followPrivate" class="pointer-events-none" />
							<span class="text-sm select-none">Seguir contas privadas</span>
						</div>

						<div class="flex items-center gap-3 cursor-pointer" @click="followAlreadyFollowers = !followAlreadyFollowers">
							<Checkbox v-model="followAlreadyFollowers" class="pointer-events-none" />
							<span class="text-sm select-none">Seguir contas que já me seguem</span>
						</div>

						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-3 cursor-pointer" @click="filterByFollowers = !filterByFollowers">
								<Checkbox v-model="filterByFollowers" class="pointer-events-none" />
								<span class="text-sm select-none">Seguir apenas contas com mínimo de seguidores</span>
							</div>
							<div v-if="filterByFollowers" class="ml-7">
								<Input
									id="min-followers-count"
									v-model="minFollowers"
									type="number"
									min="0"
									placeholder="Mínimo de seguidores"
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
						{{ starting ? 'Iniciando...' : 'Iniciar seguimento' }}
					</button>
				</CardFooter>
			</Card>

			<!-- Progress view -->
			<Card v-else class="w-full max-w-lg">
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle class="text-2xl">Seguindo @{{ targetUser.replace(/^@/, '') }}</CardTitle>
						<Badge :variant="statusBadgeVariant">{{ statusLabel }}</Badge>
					</div>
					<CardDescription>Acompanhe o progresso em tempo real.</CardDescription>
				</CardHeader>

				<CardContent class="flex flex-col gap-5">
					<!-- Progress bar -->
					<div class="flex flex-col gap-2">
						<div class="flex justify-between text-sm text-muted-foreground">
							<span>{{ progress.followed }} seguidos</span>
							<span v-if="progress.total > 0">{{ progressPct }}% de {{ progress.total.toLocaleString('pt-BR') }}</span>
						</div>
						<div class="w-full h-2 bg-muted rounded-full overflow-hidden">
							<div
								class="h-full bg-primary transition-all duration-500 rounded-full"
								:style="{ width: `${progressPct}%` }"
							/>
						</div>
					</div>

					<!-- Stats -->
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-lg border p-3 flex flex-col gap-0.5">
							<span class="text-xs text-muted-foreground">Seguidos</span>
							<span class="text-2xl font-semibold">{{ progress.followed }}</span>
						</div>
						<div class="rounded-lg border p-3 flex flex-col gap-0.5">
							<span class="text-xs text-muted-foreground">Pulados</span>
							<span class="text-2xl font-semibold">{{ progress.skipped }}</span>
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
							<span v-if="logs.length === 0" class="text-muted-foreground italic">Aguardando logs...</span>
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
						{{ stopping ? 'Parando...' : 'Parar seguimento' }}
					</button>
					<button
						v-else
						class="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-primary/90"
						@click="reset"
					>
						Novo seguimento
					</button>
				</CardFooter>
			</Card>
		</TooltipProvider>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
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
import { Info, Loader2, Clock, Sun, Moon } from 'lucide-vue-next'

// ── Form state ──────────────────────────────────────────────────────────────
const sessionId = ref('')
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
	running: 'Em andamento',
	paused: 'Pausado',
	done: 'Concluído',
	error: 'Erro',
	stopped: 'Interrompido',
}[jobStatus.value] ?? 'Em andamento'))

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
			},
		})
		running.value = true
		jobStatus.value = 'running'
		logs.value = []
		progress.value = { followed: 0, skipped: 0, total: 0 }
		pauseInfo.value = ''
		openSSE()
	} catch (err: unknown) {
		const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Erro ao iniciar.'
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

		if (event.followed !== undefined) progress.value.followed = event.followed
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
const followModes = [
	{
		value: 'ultra-safe',
		label: 'Ultra Segura',
		badge: 'Mínimo risco',
		badgeVariant: 'secondary' as const,
		perHour: 20,
		perDay: 60,
	},
	{
		value: 'safe',
		label: 'Segura',
		badge: 'Recomendado',
		badgeVariant: 'default' as const,
		perHour: 40,
		perDay: 120,
	},
	{
		value: 'risky',
		label: 'Arriscada',
		badge: 'Alto risco',
		badgeVariant: 'destructive' as const,
		perHour: 80,
		perDay: 300,
	},
]
</script>
