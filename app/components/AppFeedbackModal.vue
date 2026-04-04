<template>
	<Transition name="fade">
		<div
			v-if="modelValue"
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
			@click.self="$emit('update:modelValue', false)"
		>
			<div class="w-full max-w-md bg-background rounded-lg border shadow-lg flex flex-col max-h-[90vh] overflow-y-auto">
				<!-- Success state -->
				<div v-if="success" class="flex flex-col items-center gap-3 p-8 text-center">
					<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
						<CheckCircle2 class="w-6 h-6 text-primary" />
					</div>
					<h2 class="text-lg font-semibold">{{ $t('feedback.successTitle') }}</h2>
					<p class="text-sm text-muted-foreground">{{ $t('feedback.successBody') }}</p>
					<button
						class="mt-2 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-6 transition-colors hover:bg-primary/90"
						@click="close"
					>
						{{ $t('feedback.close') }}
					</button>
				</div>

				<!-- Form state -->
				<template v-else>
					<div class="flex items-center justify-between px-5 pt-5 pb-3">
						<div class="flex flex-col gap-0.5">
							<h2 class="text-base font-semibold">{{ $t('feedback.title') }}</h2>
							<p class="text-xs text-muted-foreground">{{ $t('feedback.subtitle') }}</p>
						</div>
						<button
							class="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
							@click="$emit('update:modelValue', false)"
						>
							<X class="w-4 h-4" />
						</button>
					</div>

					<div class="flex flex-col gap-4 px-5 pb-5">
						<!-- Nome, Email, Telefone -->
						<div class="grid grid-cols-1 gap-3">
							<div class="flex flex-col gap-1.5">
								<label for="fb-name" class="text-sm font-medium">{{ $t('feedback.nameLabel') }} <span class="text-destructive">*</span></label>
								<Input id="fb-name" v-model="name" :placeholder="$t('feedback.namePlaceholder')" />
							</div>
							<div class="flex flex-col gap-1.5">
								<label for="fb-email" class="text-sm font-medium">{{ $t('feedback.emailLabel') }} <span class="text-destructive">*</span></label>
								<Input id="fb-email" v-model="email" type="email" :placeholder="$t('feedback.emailPlaceholder')" />
							</div>
							<div class="flex flex-col gap-1.5">
								<label for="fb-phone" class="text-sm font-medium">{{ $t('feedback.phoneLabel') }} <span class="text-destructive">*</span></label>
								<Input id="fb-phone" v-model="phone" type="tel" :placeholder="$t('feedback.phonePlaceholder')" />
							</div>
						</div>

						<!-- Tipo -->
						<div class="flex flex-col gap-2">
							<label class="text-sm font-medium">{{ $t('feedback.typeLabel') }}</label>
							<RadioGroup v-model="type" class="flex flex-col gap-2">
								<label
									v-for="opt in typeOptions"
									:key="opt.value"
									:for="`fb-${opt.value}`"
									class="flex items-center gap-2.5 rounded-md border px-3 py-2 cursor-pointer transition-colors text-sm"
									:class="type === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
								>
									<RadioGroupItem :id="`fb-${opt.value}`" :value="opt.value" />
									{{ opt.label }}
								</label>
							</RadioGroup>
						</div>

						<!-- Mensagem -->
						<div class="flex flex-col gap-2">
							<label for="fb-message" class="text-sm font-medium">{{ $t('feedback.messageLabel') }}</label>
							<textarea
								id="fb-message"
								v-model="message"
								rows="4"
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
								:placeholder="$t('feedback.messagePlaceholder')"
							/>
						</div>

						<!-- Error -->
						<p v-if="error" class="text-xs text-destructive">{{ $t('feedback.error') }}</p>

						<!-- Submit -->
						<button
							class="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
							:disabled="submitting || !canSubmit"
							@click="submit"
						>
							<Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
							{{ submitting ? $t('feedback.submitting') : $t('feedback.submit') }}
						</button>
					</div>
				</template>
			</div>
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Loader2, CheckCircle2 } from 'lucide-vue-next'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'

const { t } = useI18n()

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const name = ref('')
const email = ref('')
const phone = ref('')
const type = ref('suggestion')
const message = ref('')
const submitting = ref(false)
const success = ref(false)
const error = ref(false)

const canSubmit = computed(() =>
	name.value.trim().length > 0 &&
	email.value.trim().length > 0 &&
	phone.value.trim().length > 0 &&
	message.value.trim().length >= 10
)

const typeOptions = computed(() => [
	{ value: 'suggestion', label: t('feedback.types.suggestion') },
	{ value: 'bug', label: t('feedback.types.bug') },
	{ value: 'other', label: t('feedback.types.other') },
])

async function submit() {
	submitting.value = true
	error.value = false
	try {
		const typeLabel = typeOptions.value.find(o => o.value === type.value)?.label ?? type.value
		const formData = new FormData()
		formData.append('name', name.value)
		formData.append('email', email.value)
		formData.append('phone', phone.value)
		formData.append('type', typeLabel)
		formData.append('message', message.value)
		formData.append('_subject', `[Instagram Controller] ${typeLabel}`)
		formData.append('_captcha', 'false')

		const res = await fetch('https://formsubmit.co/ajax/contato@devicente.com.br', {
			method: 'POST',
			headers: { Accept: 'application/json' },
			body: formData,
		})
		if (!res.ok) throw new Error()
		success.value = true
	} catch {
		error.value = true
	} finally {
		submitting.value = false
	}
}

function close() {
	emit('update:modelValue', false)
	setTimeout(() => {
		success.value = false
		name.value = ''
		email.value = ''
		phone.value = ''
		message.value = ''
		type.value = 'suggestion'
		error.value = false
	}, 300)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
