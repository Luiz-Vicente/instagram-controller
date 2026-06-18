<template>
	<TooltipProvider>
		<!-- Hero cover -->
		<div class="w-full relative overflow-hidden" style="background: var(--brand-gradient)">
			<div class="absolute inset-0 bg-black/30" />
			<div class="relative w-full max-w-lg mx-auto px-4 py-10 flex flex-col gap-3">
				<h1 class="text-4xl text-white leading-none">{{ $t('account.title') }}</h1>
				<p class="text-sm text-white/75">{{ $t('account.subtitle') }}</p>
			</div>
		</div>

		<div class="w-full max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">

			<!-- Profile card -->
			<div v-if="profile" class="rounded-lg border p-4 flex items-center gap-4">
				<div class="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
					<img v-if="profile.profile_pic_url" :src="`/api/account/avatar?url=${encodeURIComponent(profile.profile_pic_url)}`" alt="" class="w-full h-full object-cover" />
					<User v-else class="w-6 h-6 text-primary" />
				</div>
				<div class="flex flex-col gap-0.5 min-w-0 flex-1">
					<span class="font-semibold truncate">{{ profile.full_name || profile.username }}</span>
					<span class="text-sm text-muted-foreground">{{ '@' }}{{ profile.username }}</span>
					<div class="flex items-center gap-3 mt-0.5">
						<span class="text-xs text-muted-foreground">
							<span class="font-medium text-foreground">{{ profile.follower_count.toLocaleString(locale) }}</span>
							{{ ' ' }}{{ $t('account.profile.followers') }}
						</span>
						<span class="text-xs text-muted-foreground">
							<span class="font-medium text-foreground">{{ profile.following_count.toLocaleString(locale) }}</span>
							{{ ' ' }}{{ $t('account.profile.following') }}
						</span>
					</div>
				</div>
				<span class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
					<CheckCircle class="w-3.5 h-3.5" />
					{{ $t('account.verified') }}
				</span>
			</div>

			<!-- Session ID form -->
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
							<TooltipContent class="max-w-64">{{ $t('account.sessionId.tooltip') }}</TooltipContent>
						</Tooltip>
					</div>
					<div class="relative">
						<Input
							id="session-id"
							v-model="inputValue"
							:type="showSessionId ? 'text' : 'password'"
							:placeholder="$t('account.sessionId.placeholder')"
							class="pr-9"
						/>
						<button
							type="button"
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
							:aria-label="showSessionId ? $t('account.sessionId.hide') : $t('account.sessionId.show')"
							@click="showSessionId = !showSessionId"
						>
							<EyeOff v-if="showSessionId" class="w-4 h-4" />
							<Eye v-else class="w-4 h-4" />
						</button>
					</div>
					<p class="text-xs text-muted-foreground">{{ $t('account.sessionId.hint') }}</p>
				</div>

				<p v-if="error" class="flex items-center gap-1.5 text-sm text-destructive">
					<AlertCircle class="w-4 h-4 shrink-0" />
					{{ error }}
				</p>

				<div class="flex gap-2">
					<button
						class="flex-1 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
						:disabled="!inputValue.trim() || verifying"
						@click="save"
					>
						<Loader2 v-if="verifying" class="w-4 h-4 mr-2 animate-spin" />
						{{ verifying ? $t('account.saving') : $t('account.save') }}
					</button>
					<button
						v-if="sessionId"
						class="inline-flex items-center justify-center rounded-md border border-destructive text-destructive text-sm font-medium h-9 px-4 py-2 transition-colors hover:bg-destructive/10"
						@click="clear"
					>
						{{ $t('account.remove') }}
					</button>
				</div>
			</div>

		</div>
	</TooltipProvider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const { t, locale } = useI18n()
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, Loader2, Eye, EyeOff, User, CheckCircle, AlertCircle } from 'lucide-vue-next'

const { sessionId } = useSession()

const inputValue = ref(sessionId.value)
const showSessionId = ref(false)
const verifying = ref(false)
const error = ref('')
const profile = ref<{
	username: string
	full_name: string
	follower_count: number
	following_count: number
	profile_pic_url: string | null
} | null>(null)

onMounted(async () => {
	if (sessionId.value) {
		await fetchProfile(sessionId.value)
	}
})

async function fetchProfile(sid: string) {
	verifying.value = true
	error.value = ''
	try {
		const data = await $fetch<{
			username: string
			full_name: string
			follower_count: number
			following_count: number
			profile_pic_url: string | null
		}>('/api/account/profile', { params: { sessionId: sid } })
		profile.value = data
	} catch {
		error.value = t('account.error')
		profile.value = null
	} finally {
		verifying.value = false
	}
}

async function save() {
	const sid = inputValue.value.trim()
	if (!sid) return
	await fetchProfile(sid)
	if (profile.value) {
		sessionId.value = sid
	}
}

function clear() {
	sessionId.value = ''
	inputValue.value = ''
	profile.value = null
	error.value = ''
}
</script>
