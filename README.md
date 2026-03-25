# instagram-controller

Ferramenta de automação para seguir os seguidores de um perfil específico do Instagram, utilizando autenticação via `session_id` (cookie de sessão), sem necessidade de usuário e senha.

## Funcionalidades

- Autentica via `session_id` do Instagram
- Busca todos os seguidores de um perfil público alvo
- Verifica automaticamente se você já segue ou se a conta já te segue — pulando nesses casos
- Segue todas as contas de forma contínua até esgotar a lista
- Aplica delays aleatórios e pausas por lote para simular comportamento humano
- Respeita limites diários e por hora para evitar bloqueio da conta
- Retoma automaticamente após atingir o limite do dia

## Limites aplicados

| Regra | Valor |
|---|---|
| Máximo por hora | 40 follows |
| Máximo por dia | 120 follows |
| Delay entre follows | 30–75s (aleatório) |
| Pausa a cada 10 follows | 2–5 min |
| Pausa ao atingir limite/hora | Espera o restante da hora |
| Pausa ao atingir limite/dia | Espera 24h e retoma |

## Requisitos

- Node.js 18+
- npm

## Instalação

```bash
git clone https://github.com/Luiz-Vicente/instagram-controller.git
cd instagram-controller
npm install
npm run build
```

## Como obter o `session_id`

1. Abra o Instagram no navegador e faça login
2. Pressione `F12` para abrir o DevTools
3. Vá em **Application** → **Cookies** → `https://www.instagram.com`
4. Copie o valor do cookie `sessionid`

## Uso

```bash
npm start
```

O script irá solicitar:

1. **session_id** — cole o valor do cookie
2. **Username alvo** — perfil cujos seguidores você quer seguir (sem `@`)

A partir daí, roda continuamente até seguir todos os seguidores do perfil alvo.

## Licença

Este projeto está licenciado sob a licença CC BY-NC 4.0. Uso comercial não é permitido. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
