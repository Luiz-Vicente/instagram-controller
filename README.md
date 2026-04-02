# Instagram Controller

Ferramenta web para seguir automaticamente os seguidores de um perfil público do Instagram. Forneça o `sessionid` do cookie de sessão e o username do perfil alvo; o bot itera pelos seguidores com rate limiting configurável, delays humanizados e persistência do histórico diário para evitar bloqueio de conta.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Nuxt 4 (modo SPA — `ssr: false`) |
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
2. Cole o `sessionid` do Instagram (obtenha via DevTools → Application → Cookies → `sessionid`)
3. Informe o username do perfil alvo
4. Escolha o modo de seguimento:
   - **Ultra Segura** — 20/hora · 60/dia
   - **Segura** *(recomendado)* — 40/hora · 120/dia
   - **Arriscada** — 80/hora · 300/dia
5. Configure os filtros opcionais (contas privadas, que já te seguem, mínimo de seguidores)
6. Clique em **Iniciar seguimento** e acompanhe o progresso em tempo real

O app salva o histórico de follows do dia no `localStorage` do navegador. Ao reabrir a página, o contador "hoje" é restaurado e enviado ao backend para que os limites diários sejam respeitados mesmo entre sessões.

## Mecanismos de defesa

- **Delays aleatórios**: 5–15s após verificações de amizade, 60–120s após cada follow
- **Pausas de lote**: 2–5 minutos a cada 10 follows consecutivos
- **Rate limiting com janela deslizante**: controla follows por hora e por dia com base em timestamps reais
- **Persistência entre sessões**: histórico diário salvo no `localStorage`, enviado ao iniciar cada job
- **Parada imediata**: todas as esperas são interrompíveis — o botão "Parar" responde em até 1 segundo
- **Retry com backoff**: 30s/60s/90s em erros 429/503 nas chamadas críticas; falha rápida nas chamadas de filtro

## Build

```bash
npm run build
npm run preview
```

## Licença

[CC BY-NC 4.0](LICENSE) — uso pessoal e educacional permitido. Uso comercial proibido.
