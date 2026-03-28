<template>
	<div class="min-h-screen bg-background flex items-center justify-center p-6">
		<Card class="w-full max-w-lg">
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
									<button
										type="button"
										class="text-muted-foreground hover:text-foreground transition-colors"
									>
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
									<button
										type="button"
										class="text-muted-foreground hover:text-foreground transition-colors"
									>
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
								<button
									type="button"
									class="text-muted-foreground hover:text-foreground transition-colors"
								>
									<Info class="w-3.5 h-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent class="max-w-64">
								Define a velocidade dos seguimentos. Modos mais rápidos aumentam o risco de bloqueio temporário pela
								plataforma. Recomendamos o modo <strong>Segura</strong> para uso contínuo.
							</TooltipContent>
						</Tooltip>
					</div>
					<RadioGroup
						v-model="followMode"
						class="flex flex-col gap-3"
					>
						<label
							v-for="mode in followModes"
							:key="mode.value"
							:for="mode.value"
							class="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors"
							:class="followMode === mode.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
						>
							<RadioGroupItem
								:id="mode.value"
								:value="mode.value"
								class="mt-0.5"
							/>
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

					<div class="flex items-center gap-3">
						<Checkbox
							id="follow-private"
							v-model:checked="followPrivate"
						/>
						<label
							for="follow-private"
							class="text-sm cursor-pointer select-none"
						>
							Seguir contas privadas
						</label>
					</div>

					<div class="flex items-center gap-3">
						<Checkbox
							id="follow-followers"
							v-model:checked="followFollowers"
						/>
						<label
							for="follow-followers"
							class="text-sm cursor-pointer select-none"
						>
							Seguir contas que já me seguem
						</label>
					</div>

					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-3">
							<Checkbox
								id="min-followers"
								v-model="filterByFollowers"
							/>
							<label
								for="min-followers"
								class="text-sm cursor-pointer select-none"
							>
								Seguir apenas contas com mínimo de seguidores
							</label>
						</div>
						<div
							v-if="filterByFollowers"
							class="ml-7"
						>
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
					:disabled="!sessionId || !targetUser"
				>
					Iniciar seguimento
				</button>
			</CardFooter>
		</Card>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-vue-next";

const sessionId = ref("");
const targetUser = ref("");
const followMode = ref("safe");
const followPrivate = ref(false);
const followFollowers = ref(false);
const filterByFollowers = ref(false);
const minFollowers = ref<string | number | undefined>(undefined);

const followModes = [
	{
		value: "ultra-safe",
		label: "Ultra Segura",
		badge: "Mínimo risco",
		badgeVariant: "secondary" as const,
		perHour: 20,
		perDay: 60,
	},
	{
		value: "safe",
		label: "Segura",
		badge: "Recomendado",
		badgeVariant: "default" as const,
		perHour: 40,
		perDay: 120,
	},
	{
		value: "risky",
		label: "Arriscada",
		badge: "Alto risco",
		badgeVariant: "destructive" as const,
		perHour: 80,
		perDay: 300,
	},
];
</script>
