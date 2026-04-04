<template>
	<div>
		<Tooltip>
			<TooltipTrigger as-child>
				<button
					v-if="!open"
					class="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 h-10 text-sm font-medium transition-all hover:bg-primary/90 hover:scale-105"
					@click="open = true"
				>
					<MessageSquarePlus class="w-4 h-4" />
					{{ $t('feedback.trigger') }}
				</button>
			</TooltipTrigger>
			<TooltipContent side="left">{{ $t('feedback.subtitle') }}</TooltipContent>
		</Tooltip>

		<AppFeedbackModal v-model="open" />
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MessageSquarePlus } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const open = ref(false)
</script>
