<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Telegram - Trocar de usuário

Para trocar o Telegram de um celular pra outro:

1. Trocar `TELEGRAM_BOT_TOKEN` no `.env.local` e nas env vars do Vercel
2. Pessoa nova envia `/start` pro novo bot no Telegram
3. Rodar `npm run dev` e acessar `http://localhost:3000/api/telegram-registrar` pra pegar o novo `chatId`
4. Atualizar `TELEGRAM_CHAT_ID` no `.env.local` e no Vercel
5. Fazer deploy no Vercel

**Sempre precisa trocar AMBAS** (token + chat id) — não adianta trocar só o token.
