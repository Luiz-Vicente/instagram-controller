# Instagram Controller

Ferramenta web para seguir automaticamente os seguidores de um perfil público do Instagram. Fornece o `sessionid` do cookie de sessão e o username do perfil alvo; o bot itera por todos os seguidores com rate limiting configurável para evitar bloqueio de conta.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Nuxt 4 |
| UI Components | shadcn-vue (estilo `new-york`) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` |
| Backend | Nitro (server routes do Nuxt) |
| HTTP Client | axios |
| Linguagem | TypeScript |

## Setup

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Como usar

1. Abra o app no navegador
2. Cole o `sessionid` do Instagram (obtenha via DevTools → Application → Cookies)
3. Informe o username do perfil alvo
4. Escolha o modo de seguimento:
   - **Ultra Segura** — 20/hora · 60/dia
   - **Segura** *(recomendado)* — 40/hora · 120/dia
   - **Arriscada** — 80/hora · 300/dia
5. Configure os filtros opcionais (contas privadas, que já te seguem, mínimo de seguidores)
6. Clique em **Iniciar seguimento** e acompanhe o progresso em tempo real

## Build

```bash
npm run build
npm run preview
```
