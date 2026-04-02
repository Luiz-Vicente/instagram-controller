<template>
	<div class="min-h-screen bg-background p-4 sm:p-6">
		<div class="max-w-2xl mx-auto flex flex-col gap-8 py-4 sm:py-6">
			<!-- Header -->
			<div class="flex flex-col gap-2">
				<NuxtLink to="/" class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
					<ArrowLeft class="w-4 h-4" />
					Voltar
				</NuxtLink>
				<h1 class="text-2xl sm:text-3xl font-bold mt-2">Como funciona</h1>
				<p class="text-muted-foreground">
					Entenda os mecanismos de segurança, os limites configurados e os riscos de cada modo de operação.
				</p>
			</div>

			<!-- Como o app opera -->
			<section class="flex flex-col gap-3">
				<h2 class="text-lg font-semibold">Visão geral</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">
					O app percorre a lista de seguidores de um perfil alvo e tenta seguir cada conta, respeitando os filtros configurados.
					Toda a lógica roda no servidor local — nenhum dado é enviado para serviços externos além do próprio Instagram.
				</p>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Para cada conta na lista, o app verifica o status de amizade, aplica os filtros ativos e, se tudo passar, executa o follow.
					Entre cada operação, há pausas deliberadas para simular comportamento humano e reduzir o risco de detecção.
				</p>
			</section>

			<!-- Mecanismos de defesa -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">Mecanismos de defesa</h2>

				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">Delays entre requisições</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">
							Após cada verificação de status de amizade, o app aguarda entre <strong>5 e 15 segundos</strong>.
							Após cada follow bem-sucedido, a espera aumenta para <strong>60 a 120 segundos</strong>.
							Esses intervalos aleatórios evitam padrões regulares que sistemas de detecção identificam facilmente.
						</p>
					</div>

					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<Layers class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">Pausas de lote</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">
							A cada <strong>10 follows consecutivos</strong>, o app faz uma pausa extra de <strong>2 a 5 minutos</strong>.
							Isso reproduz o comportamento de alguém que para para ver o feed, responder mensagens ou simplesmente descansar.
						</p>
					</div>

					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<ShieldCheck class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">Janela deslizante de rate limit</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">
							Os limites horários e diários são aplicados com janela deslizante real — não um simples contador que reinicia à meia-noite.
							Se o limite horário for atingido, o app aguarda até que o follow mais antigo saia da janela de 60 minutos.
							O histórico do dia é salvo no navegador e carregado na próxima sessão, impedindo que fechar e reabrir o app "zere" o contador.
						</p>
					</div>

					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<RotateCcw class="w-4 h-4 text-muted-foreground" />
							<span class="font-medium text-sm">Retry com backoff em erros de API</span>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">
							Nas chamadas críticas (busca de perfil alvo, listagem de seguidores), o app tenta novamente em caso de erro HTTP 429 ou 503,
							aguardando 30s, 60s e 90s entre cada tentativa. Para verificações de filtro, a estratégia é falhar rápido — se a API não responder,
							a conta é deixada passar em vez de travar o processo por minutos.
						</p>
					</div>
				</div>
			</section>

			<!-- Modos e risco -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">Modos de seguimento e risco</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Os modos controlam quantos follows o app executa por hora e por dia. Volumes mais altos aumentam a probabilidade de acionamento
					dos sistemas de defesa do Instagram.
				</p>

				<div class="flex flex-col gap-3">
					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">Ultra Segura</span>
							<Badge variant="secondary">Mínimo risco</Badge>
						</div>
						<div class="text-sm text-muted-foreground">20 follows/hora · 60 follows/dia</div>
						<p class="text-sm text-muted-foreground leading-relaxed">
							Ritmo muito abaixo dos limites internos do Instagram. Adequado para contas novas ou que já sofreram alguma restrição.
							Com os delays atuais, esse limite raramente será atingido pelo rate limiter — o próprio tempo entre as operações já mantém o ritmo baixo.
						</p>
					</div>

					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">Segura</span>
							<Badge>Recomendado</Badge>
						</div>
						<div class="text-sm text-muted-foreground">40 follows/hora · 120 follows/dia</div>
						<p class="text-sm text-muted-foreground leading-relaxed">
							Equilíbrio entre velocidade e segurança. Contas com mais de 6 meses de uso regular geralmente toleram esse volume sem problemas.
							É o modo recomendado para uso contínuo e diário.
						</p>
					</div>

					<div class="rounded-lg border p-4 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm">Arriscada</span>
							<Badge variant="destructive">Alto risco</Badge>
						</div>
						<div class="text-sm text-muted-foreground">80 follows/hora · 300 follows/dia</div>
						<p class="text-sm text-muted-foreground leading-relaxed">
							Volume próximo aos limites internos do Instagram. Pode acionar bloqueios temporários de ação ("Action Blocked"),
							redução de alcance (shadowban) ou, em casos repetidos, suspensão da conta.
							Use apenas em contas estabelecidas e de forma pontual, nunca como rotina diária.
						</p>
					</div>
				</div>
			</section>

			<!-- O que pode acontecer -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">O que pode acontecer se os limites forem ultrapassados</h2>
				<div class="flex flex-col gap-2">
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">Action Blocked</span>
						<p class="text-sm text-muted-foreground leading-relaxed">
							O Instagram bloqueia temporariamente a ação de seguir, geralmente por 24 a 48 horas. A conta continua funcionando normalmente para outras ações.
							É o aviso mais comum e geralmente passa sem consequências se o comportamento for corrigido.
						</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">Shadowban</span>
						<p class="text-sm text-muted-foreground leading-relaxed">
							O conteúdo da conta para de aparecer em hashtags e na aba Explorar sem aviso. O perfil continua existindo e publicando normalmente,
							mas o alcance orgânico cai drasticamente. Pode durar dias ou semanas.
						</p>
					</div>
					<div class="rounded-lg border p-4 flex flex-col gap-1.5">
						<span class="font-medium text-sm">Suspensão temporária ou permanente</span>
						<p class="text-sm text-muted-foreground leading-relaxed">
							Em casos de uso abusivo e reincidente, o Instagram pode suspender a conta temporariamente (com possibilidade de recuperação)
							ou permanentemente. Essa é a situação mais grave e raramente acontece por automação de follows isolada,
							mas o risco existe especialmente em contas novas ou com histórico de violações.
						</p>
					</div>
				</div>
			</section>

			<!-- Boas práticas -->
			<section class="flex flex-col gap-4">
				<h2 class="text-lg font-semibold">Boas práticas</h2>
				<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
					<li class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>Use o modo <strong class="text-foreground">Segura</strong> como padrão. Aumente apenas em situações pontuais.</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>Não execute o app 24 horas por dia. Simule um comportamento humano com períodos de uso e de inatividade.</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>Se receber um "Action Blocked", pare o app imediatamente e aguarde pelo menos 24 horas antes de retomar.</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>Prefira contas alvo com seguidores no mesmo nicho do seu perfil — além de mais seguro, o engajamento tende a ser maior.</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>O filtro de mínimo de seguidores consome chamadas extras à API. Use-o com parcimônia ou defina um valor razoável para o seu nicho.</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-0.5 text-foreground">·</span>
						<span>O Session ID expira quando você faz logout do Instagram no navegador. Gere um novo sempre que o app reportar erro de autenticação.</span>
					</li>
				</ul>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ArrowLeft, Clock, Layers, ShieldCheck, RotateCcw } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
</script>
