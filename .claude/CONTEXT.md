# Instagram Controller — Project Context

## Objetivo do projeto

Ferramenta web para seguir automaticamente os seguidores de um perfil público do Instagram. O usuário fornece o `sessionid` do cookie de sessão e o username do perfil alvo; o bot itera por todos os seguidores e os segue com rate limiting configurável, delays humanizados e persistência de histórico diário para evitar bloqueio de conta.

---

## Configuração do Nuxt

- `ssr: false` — modo SPA puro. Necessário para evitar hydration mismatch com `useDark` (`@vueuse/core`)
- Alias `~` e `@` apontam para `app/` — server files **devem** usar imports relativos (`../../utils/...`)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Nuxt 4 (`nuxt ^4.4.2`) |
| UI Components | shadcn-vue (estilo `new-york`, prefixo vazio) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` |
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
│   ├── app.vue                        # Entrada — TooltipProvider global + AppNavbar + NuxtPage
│   ├── assets/css/tailwind.css        # Tema CSS com variáveis oklch (light + dark)
│   ├── lib/utils.ts                   # cn() helper (clsx + tailwind-merge)
│   ├── components/
│   │   ├── AppNavbar.vue              # Navbar global: logo, link "Como funciona", toggle dark mode
│   │   └── ui/                        # Componentes shadcn instalados
│   │       ├── badge/, card/, checkbox/
│   │       ├── input/, label/, radio-group/, tooltip/
│   └── pages/
│       ├── index.vue                  # Página principal — formulário + tela de progresso
│       └── about.vue                  # Página explicativa — mecanismos, modos, riscos, boas práticas
├── server/
│   ├── api/follow/
│   │   ├── start.post.ts              # POST — inicia o job em background
│   │   ├── status.get.ts              # GET  — SSE com eventos de progresso em tempo real
│   │   └── stop.post.ts               # POST — seta flag shouldStop no job ativo
│   └── utils/
│       ├── instagram-client.ts        # Classe HTTP para o Instagram (axios)
│       ├── rate-limiter.ts            # Controle de limites por hora/dia com janela deslizante
│       ├── runner.ts                  # Loop principal de seguimento
│       ├── job-manager.ts             # Estado do job ativo + sistema de listeners SSE
│       └── helpers.ts                 # sleep, interruptibleSleep, randomDelay, formatDuration
├── nuxt.config.ts
├── components.json                    # Config shadcn-vue CLI
└── tsconfig.json
```

---

## Páginas

### `app/pages/index.vue` — Página principal

Duas views no mesmo componente, alternadas pelo estado `running`.

**Formulário (view inicial):**
- Input Session ID com `type="password"` + toggle de visibilidade (Eye/EyeOff)
- Input Usuário alvo
- Tooltips em Session ID, Usuário alvo e Modo de seguimento
- RadioGroup de modos de seguimento
- Checkboxes de filtros (padrão correto: `@click` no container, `v-model` + `pointer-events-none` no Checkbox)
- Badge "X seguidos hoje" no header (lido do localStorage)
- Botão "Iniciar seguimento" → POST `/api/follow/start` + abre SSE

**Tela de progresso:**
- Badge de status (Em andamento / Pausado / Concluído / Erro / Interrompido)
- Barra de progresso com percentual
- Cards de contadores: **Seguidos** (sessão atual) / **Pulados** / **Hoje** (total do dia, inclui sessões anteriores)
- Aviso de pausa por rate limit (com ícone Clock)
- Log em tempo real (fonte monospace, auto-scroll, colorização por tipo de linha)
- Botão "Parar seguimento" → POST `/api/follow/stop`
- Botão "Novo seguimento" (quando encerrado)

**Persistência localStorage (`ig_follow_timestamps`):**
- Array de timestamps (ms) de cada follow realizado
- Carregado no `onMounted`, filtrado para as últimas 24h
- Atualizado em tempo real via eventos SSE (delta entre `event.followed` e `progress.followed` anterior)
- Enviado ao backend em `previousTimestamps` ao iniciar o job

### `app/pages/about.vue` — Página explicativa

Explica: visão geral, mecanismos de defesa (delays, pausas de lote, janela deslizante, retry), modos e riscos de cada um, consequências de ultrapassar limites (Action Blocked, shadowban, suspensão), boas práticas.

---

## AppNavbar (`app/components/AppNavbar.vue`)

Navbar global, sticky, com backdrop blur. Contém:
- Logo/nome do app + badge "Beta" (link para `/`)
- Link "Como funciona" (link para `/about`)
- Botão toggle dark/light mode (useDark + useToggle do @vueuse/core)

O botão de tema **vive apenas aqui**. Não deve ser adicionado nas páginas individualmente.

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

| Método | Parâmetros extras | Descrição |
|---|---|---|
| `initializeSession()` | — | Captura csrftoken e cookies extras |
| `fetchUserProfile(username, maxAttempts?)` | `maxAttempts` default 3 | search → `/api/v1/users/{pk}/info/` |
| `fetchFollowersPage(userId, maxId?)` | — | Paginado, 50 por página |
| `fetchFriendshipStatus(userId, maxAttempts?)` | `maxAttempts` default 3 | Checa following/followed_by/outgoing_request |
| `followUser(userId)` | — | POST `/api/v1/friendships/create/{userId}/` |

**Callbacks:**
- `onRetry?: (status, waitSec, attempt) => void` — chamado em cada backoff por 429/503

**`maxAttempts` nas chamadas de filtro:**
- No runner, `fetchUserProfile` e `fetchFriendshipStatus` são chamados com `maxAttempts = 1` para evitar que o processo trave em retries longos (30s+60s+90s por conta)

---

## Backend — RateLimiter (`server/utils/rate-limiter.ts`)

```ts
LIMITS = {
  'ultra-safe': { perHour: 20, perDay: 60 },
  'safe':       { perHour: 40, perDay: 120 },
  'risky':      { perHour: 80, perDay: 300 },
}
```

**Constructor:** `new RateLimiter(mode, initialTimestamps?)` — recebe timestamps anteriores do localStorage para pré-seed dos contadores. Filtra automaticamente para últimas 24h (daily) e última 1h (hourly).

**Callbacks:**
- `onPause?: (reason, durationMs) => void` — chamado ao entrar em pausa
- `shouldStop?: () => boolean` — conectado ao `job.shouldStop`; todas as esperas internas usam `interruptibleSleep`

---

## Backend — Runner (`server/utils/runner.ts`)

**Constantes de delay:**
```ts
MIN_DELAY_SEC = 60   // delay após followUser (mínimo)
MAX_DELAY_SEC = 120  // delay após followUser (máximo)
BATCH_SIZE = 10      // pausa longa a cada N follows
BATCH_PAUSE_MIN_SEC = 120  // 2 min
BATCH_PAUSE_MAX_SEC = 300  // 5 min
```

**Delays por operação:**
| Operação | Delay |
|---|---|
| `fetchUserProfile` (filtro min. seguidores) | 5–10s (randomDelay) |
| `fetchFriendshipStatus` | 5–15s (randomDelay) |
| `followUser` bem-sucedido | 60–120s (interruptibleSleep) |
| Pausa de lote (a cada 10 follows) | 120–300s (interruptibleSleep) |
| Rate limit atingido | até horas (interruptibleSleep, interrompível) |

**Todas as esperas usam `interruptibleSleep`** — o botão "Parar" responde em até 1 segundo em qualquer ponto do fluxo.

**`RunnerConfig`:**
```ts
interface RunnerConfig {
  sessionId: string
  targetUser: string
  followMode: FollowMode
  followPrivate: boolean
  followAlreadyFollowers: boolean
  filterByFollowers: boolean
  minFollowers: number
  previousTimestamps: number[]  // ← timestamps do localStorage para pré-seed do RateLimiter
}
```

**Fluxo por usuário:**
1. Filtro: conta privada (se `followPrivate = false`, pula — sem delay)
2. Filtro: mínimo de seguidores — `fetchUserProfile(username, 1)` + delay 5–10s; se falhar, deixa passar
3. `fetchFriendshipStatus(pk, 1)` + delay 5–15s — pula se já segue ou pedido pendente
4. Filtro: já me segue (se `followAlreadyFollowers = false`, pula)
5. `pauseIfRateLimitReached()` → `followUser()` → delay 60–120s (ou pausa de lote)

---

## Backend — Helpers (`server/utils/helpers.ts`)

```ts
sleep(ms): Promise<void>                              // sleep comum
interruptibleSleep(ms, shouldStop): Promise<void>     // verifica shouldStop a cada 1s
randomDelay(minSec, maxSec): number                   // retorna ms (multiplica por 1000)
formatDuration(ms): string                            // formata para "Xm Ys"
```

---

## Backend — Job Manager (`server/utils/job-manager.ts`)

Um único job ativo por vez (estado em memória do Nitro).

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

---

## Padrões aprendidos / armadilhas

### Checkbox do shadcn-vue

`v-model:checked` e `:checked + @update:checked` **não funcionam** — o evento `update:checked` não propaga corretamente do `CheckboxRoot` (reka-ui) para o componente pai.

**Padrão correto:**
```html
<div class="flex items-center gap-3 cursor-pointer" @click="valor = !valor">
  <Checkbox v-model="valor" class="pointer-events-none" />
  <span class="text-sm select-none">Label</span>
</div>
```
- Estado controlado pelo `@click` no container
- `v-model` no Checkbox apenas para exibição visual
- `pointer-events-none` evita duplo disparo

### CardHeader usa CSS Grid interno

O componente `CardHeader` renderiza um `grid auto-rows-min grid-rows-[auto_auto] px-6`. Não coloque botões ou elementos que precisem de `shrink-0` diretamente dentro do CardHeader esperando comportamento flex — o grid pode não respeitar `min-w-0` / `shrink` da forma esperada. Para elementos de layout complexo no header, prefira reestruturar fora do CardHeader ou use o slot `CardAction`.

### Toggle dark mode

O botão de toggle dark/light mode vive em **`AppNavbar.vue`** exclusivamente. Não adicionar nas páginas — o componente é global via `app.vue`.

### Endpoint `web_profile_info`

O endpoint web `https://www.instagram.com/api/v1/users/web_profile_info/` é altamente rate-limited. **Não usar** para busca de perfil — usar a estratégia search (mobile) → `/api/v1/users/{pk}/info/` (mobile).
