# Instagram Controller — Project Context

## Objetivo do projeto

Ferramenta web para seguir automaticamente os seguidores de um perfil público do Instagram. O usuário fornece o `sessionid` do cookie de sessão e o username do perfil alvo; o bot itera por todos os seguidores e os segue com rate limiting configurável para evitar bloqueio de conta.

---

## Branches

- **`main`** — versão original CLI em Node.js/TypeScript (arquivos `src/` removidos durante migração)
- **`feature/migate-to-nuxt`** ← branch atual — app web completa com Nuxt 4

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Nuxt 4 (`nuxt ^4.4.2`) |
| UI Components | shadcn-vue (estilo `new-york`, prefixo vazio) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` + `tw-animate-css` |
| Componentes base | reka-ui |
| Ícones | lucide-vue-next |
| HTTP Client | axios |
| Utilities | `@vueuse/core`, `clsx`, `tailwind-merge` |
| Linguagem | TypeScript |

---

## Estrutura de arquivos

```
instagram-controller/
├── app/
│   ├── app.vue                        # Entrada (NuxtPage + TooltipProvider global)
│   ├── assets/css/tailwind.css        # Tema CSS com variáveis oklch (light + dark)
│   ├── lib/utils.ts                   # cn() helper (clsx + tailwind-merge)
│   ├── pages/
│   │   └── index.vue                  # Página principal — formulário + tela de progresso
│   └── components/ui/                 # Componentes shadcn instalados
│       ├── badge/, card/, checkbox/
│       ├── input/, label/, radio-group/, tooltip/
├── server/
│   ├── api/follow/
│   │   ├── start.post.ts              # POST — inicia o job em background
│   │   ├── status.get.ts              # GET  — SSE com eventos de progresso em tempo real
│   │   └── stop.post.ts               # POST — seta flag shouldStop no job ativo
│   └── utils/
│       ├── instagram-client.ts        # Classe HTTP para o Instagram (axios)
│       ├── rate-limiter.ts            # Controle de limites por hora/dia
│       ├── runner.ts                  # Loop principal de seguimento
│       ├── job-manager.ts             # Estado do job ativo + sistema de listeners SSE
│       └── helpers.ts                 # sleep, randomDelay, formatDuration
├── nuxt.config.ts
├── components.json                    # Config shadcn-vue CLI
└── tsconfig.json
```

---

## Página principal (`app/pages/index.vue`)

Duas views no mesmo componente, alternadas pelo estado `running`:

**Formulário (view inicial):**
- Input Session ID (`type="password"`) com tooltip explicando como obter o cookie
- Input Usuário alvo com tooltip
- RadioGroup de modos de seguimento com tooltip

| value | Label | Por hora | Por dia |
|---|---|---|---|
| `ultra-safe` | Ultra Segura | 20 | 60 |
| `safe` | Segura *(padrão)* | 40 | 120 |
| `risky` | Arriscada | 80 | 300 |

- Checkboxes de filtros: seguir contas privadas, seguir quem já me segue, mínimo de seguidores (com input condicional)
- Botão "Iniciar seguimento" → POST `/api/follow/start` + abre SSE

**Tela de progresso:**
- Badge de status (Em andamento / Pausado / Concluído / Erro / Interrompido)
- Barra de progresso com percentual
- Cards de contadores: Seguidos / Pulados
- Aviso de pausa por rate limit (com ícone Clock)
- Log em tempo real (fonte monospace, auto-scroll, colorização por tipo de linha)
- Botão "Parar seguimento" → POST `/api/follow/stop`
- Botão "Novo seguimento" (quando encerrado)

---

## Backend — InstagramClient (`server/utils/instagram-client.ts`)

Dois clientes axios:
- `webClient` → `https://www.instagram.com` (User-Agent browser)
- `mobileClient` → `https://i.instagram.com` (User-Agent Android)

**Cabeçalhos obrigatórios:**
- `X-IG-App-ID: 936619743392459`
- `X-CSRFToken` (extraído dos cookies em `initializeSession`)
- Cookie header construído manualmente: `sessionid` + `csrftoken` + cookies extras

**Métodos públicos:**

| Método | Endpoint | Descrição |
|---|---|---|
| `initializeSession()` | GET `https://www.instagram.com/` | Captura csrftoken e cookies extras |
| `fetchUserProfile(username)` | search → `/api/v1/users/{pk}/info/` | Busca pk via search (mobile, baixo rate-limit), depois info completa por pk |
| `fetchFollowersPage(userId, maxId?)` | `/api/v1/friendships/{userId}/followers/` | Paginado, 50 por página |
| `fetchFriendshipStatus(userId)` | `/api/v1/friendships/show/{userId}/` | Checa following/followed_by/outgoing_request |
| `followUser(userId)` | POST `/api/v1/friendships/create/{userId}/` | Executa o follow |

**Callbacks:**
- `onRetry?: (status, waitSec, attempt) => void` — chamado em cada backoff por 429/503

**Decisão de design — `fetchUserProfile`:**
- Usa search (mobile) para obter o `pk`, depois `/api/v1/users/{pk}/info/` para o perfil completo com `follower_count`
- O endpoint `web_profile_info` (web) foi abandonado para busca de perfil por ser altamente rate-limited (429 consistente)
- A combinação search → info via mobileClient é estável e sempre retorna `follower_count`

---

## Backend — RateLimiter (`server/utils/rate-limiter.ts`)

Limites configuráveis por modo:

```ts
LIMITS = {
  'ultra-safe': { perHour: 20, perDay: 60 },
  'safe':       { perHour: 40, perDay: 120 },
  'risky':      { perHour: 80, perDay: 300 },
}
```

- `pauseIfRateLimitReached()` — calcula espera até o slot mais antigo expirar
- `recordFollowTimestamp()` — registra cada follow bem-sucedido
- `onPause?: (reason, durationMs) => void` — callback para logar/exibir pausa

---

## Backend — Runner (`server/utils/runner.ts`)

Loop principal que roda em background (fire-and-forget via `runFollowJob`):

**Constantes:**
- `BATCH_SIZE = 10` — pausa longa a cada 10 follows (2–5 min)
- `MIN_DELAY_SEC = 30`, `MAX_DELAY_SEC = 75` — delay entre follows individuais

**Fluxo por usuário:**
1. Filtro: conta privada (se `followPrivate = false`, pula)
2. Filtro: mínimo de seguidores — chama `fetchUserProfile` para obter count confiável; se não conseguir, deixa passar
3. Check de friendship status — pula se já segue ou pedido pendente
4. Filtro: já me segue (se `followAlreadyFollowers = false`, pula)
5. `pauseIfRateLimitReached()` → `followUser()` → delay aleatório

**Tratamento de erros:**
- HTTP 429/400 no follow → pausa 15 min
- Erro em `fetchFollowersPage` → log + retry em 60s
- Backoff em `executeWithRetry`: 30s, 60s, 90s (para follow e fetchFollowers)
- Perfil lookup: `maxAttempts = 3` no search e no info

---

## Backend — Job Manager (`server/utils/job-manager.ts`)

Um único job ativo por vez (estado em memória do Nitro). Estrutura:

```ts
interface Job {
  status: 'running' | 'paused' | 'done' | 'error' | 'stopped'
  shouldStop: boolean
  followed: number
  skipped: number
  total: number
  listeners: Set<(event: JobEvent) => void>
}
```

Eventos SSE: `log`, `progress`, `pause`, `done`, `error`, `stopped`

---

## Convenções do projeto

- Idioma da interface: **português brasileiro**
- Componentes shadcn importados explicitamente (sem auto-import)
- CSS theme usa **oklch** color space (não hex/hsl/rgb)
- `cn()` em `app/lib/utils.ts` para merge de classes Tailwind
- Tailwind v4 — configuração via `@theme` no CSS, sem `tailwind.config.js`
- Alias `~` e `@` apontam para `app/` no Nuxt 4 — server files usam imports relativos (`../../utils/...`)

---

## Padrões aprendidos / armadilhas

### Checkbox do shadcn-vue

`v-model:checked` e `:checked + @update:checked` **não funcionam** para atualizar refs do Vue — o evento `update:checked` não propaga corretamente do `CheckboxRoot` (reka-ui) para o componente pai.

**Padrão correto:**
```html
<div class="flex items-center gap-3 cursor-pointer" @click="valor = !valor">
  <Checkbox v-model="valor" class="pointer-events-none" />
  <span class="text-sm select-none">Label</span>
</div>
```
- O estado é controlado pelo `@click` no container
- O Checkbox recebe `v-model` apenas para exibição visual do estado
- `pointer-events-none` evita duplo disparo (clique no Checkbox + clique no container)
