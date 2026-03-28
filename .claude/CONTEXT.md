# Instagram Controller — Project Context

## Objetivo do projeto

Ferramenta para seguir automaticamente os seguidores de um perfil público do Instagram. O usuário fornece o `session_id` do cookie de sessão e o username do perfil alvo; a ferramenta itera por todos os seguidores e os segue com rate limiting para evitar bloqueio de conta.

---

## Histórico / branches

- **`main`** — versão original em Node.js/TypeScript CLI (sem UI). Os arquivos `src/` foram deletados nessa branch durante a migração.
- **`feature/migate-to-nuxt`** ← branch atual — migração para Nuxt 3 com interface web.

---

## Stack atual (branch feature/migate-to-nuxt)

| Camada | Tecnologia |
|---|---|
| Framework | Nuxt 4 (`nuxt ^4.4.2`) |
| UI Components | shadcn-vue (estilo `new-york`, prefixo vazio) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` + `tw-animate-css` |
| Componentes base | reka-ui ^2.2 |
| Utilities | `@vueuse/core`, `clsx`, `tailwind-merge` |
| Linguagem | TypeScript |
| Runtime | Vue 3 + vue-router 5 |

---

## Estrutura de arquivos relevante

```
instagram-controller/
├── app/
│   ├── app.vue                        # Entrada da aplicação (usa <NuxtPage />)
│   ├── assets/css/tailwind.css        # Tema CSS com variáveis oklch (light + dark)
│   ├── lib/utils.ts                   # cn() helper (clsx + tailwind-merge)
│   ├── pages/
│   │   └── index.vue                  # Página principal (única página até agora)
│   └── components/ui/                 # Componentes shadcn instalados
│       ├── badge/
│       ├── card/
│       ├── input/
│       ├── label/
│       └── radio-group/
├── nuxt.config.ts                     # Config do Nuxt (shadcn-nuxt module, tailwind vite plugin)
├── components.json                    # Config do shadcn-vue CLI
├── tsconfig.json                      # Referência para os tsconfigs gerados pelo Nuxt
└── public/                            # favicon.ico, robots.txt
```

---

## Página principal (`app/pages/index.vue`)

Card centralizado na tela com:

1. **Input Session ID** — `type="password"`, v-model `sessionId`
2. **Input Usuário alvo** — placeholder `@username`, v-model `targetUser`
3. **RadioGroup de modos de seguimento:**

| value | Label | Por hora | Por dia | Badge |
|---|---|---|---|---|
| `ultra-safe` | Ultra Segura | 20 | 60 | Mínimo risco (secondary) |
| `safe` | Segura *(padrão)* | 40 | 120 | Recomendado (default) |
| `risky` | Arriscada | 80 | 300 | Alto risco (destructive) |

4. **Botão "Iniciar seguimento"** — desabilitado se `sessionId` ou `targetUser` estiver vazio. **Ainda não tem lógica de backend/API conectada.**

---

## Lógica original (branch main — referência para reimplementação no Nuxt)

### InstagramClient (`src/follow-followers/instagram-client.ts`)

Classe que faz todas as chamadas HTTP ao Instagram. Usa dois clientes axios:
- `webClient` → `https://www.instagram.com` com User-Agent de browser
- `mobileClient` → `https://i.instagram.com` com User-Agent Android

**Métodos principais:**
- `initializeSession()` — GET na home do IG para capturar `csrftoken` e cookies extras
- `fetchUserProfile(username)` — tenta 3 estratégias em sequência:
  1. `/api/v1/users/search/` (mobile)
  2. Scraping do HTML do perfil
  3. `/api/v1/users/web_profile_info/` (web, mais rate-limited)
- `fetchFollowersPage(userId, maxId?)` — `/api/v1/friendships/{userId}/followers/` paginado (50 por página)
- `fetchFriendshipStatus(userId)` — `/api/v1/friendships/show/{userId}/`
- `followUser(userId)` — POST `/api/v1/friendships/create/{userId}/`
- `executeWithRetry(fn, maxAttempts=3)` — retry com backoff exponencial em HTTP 429/503

**Cabeçalhos importantes:**
- `X-IG-App-ID: 936619743392459`
- `X-CSRFToken` (extraído dos cookies na inicialização)
- Cookie header construído manualmente com `sessionid` + `csrftoken` + extras

### RateLimiter (`src/follow-followers/rate-limiter.ts`)

Controla os limites de seguimento usando timestamps em memória:
- `MAX_FOLLOWS_PER_HOUR = 40`
- `MAX_FOLLOWS_PER_DAY = 120`
- `pauseIfRateLimitReached()` — calcula o tempo de espera até o slot mais antigo expirar e dorme
- `recordFollowTimestamp()` — registra cada follow bem-sucedido

### Runner (`src/follow-followers/runner.ts`)

Loop principal de execução:
- `BATCH_SIZE = 10` follows antes de uma pausa longa (2–5 min)
- `MIN_DELAY_SEC = 30`, `MAX_DELAY_SEC = 75` entre follows individuais
- Verifica `friendshipStatus` antes de tentar seguir (pula se já segue, pedido pendente ou já segue de volta)
- Trata HTTP 429/400 com pausa de 15 minutos
- Pagina todos os seguidores com `next_max_id` até acabar

---

## Convenções do projeto

- Idioma da interface: **português brasileiro**
- Componentes shadcn são importados explicitamente (sem auto-import de `@/components/ui/...`)
- CSS theme usa **oklch** color space (não hex/hsl)
- `cn()` helper em `app/lib/utils.ts` para merge de classes Tailwind
- Tailwind v4 — sem arquivo `tailwind.config.js`, config via `@theme` no CSS

---

## Próximos passos prováveis

- Criar server routes Nuxt (`server/api/`) para encapsular a lógica do `InstagramClient` e `RateLimiter`
- Conectar o botão "Iniciar seguimento" a uma API route
- Adicionar feedback em tempo real do progresso (SSE ou polling)
- Possível page de status/progresso separada
