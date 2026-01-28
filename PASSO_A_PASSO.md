# 🚀 Hunfly - Guia Simples

**Tempo: 30 minutos** | **100% Grátis**

---

## PASSO 1: REDIS (3 min)

### Tem Docker?

```bash
docker run -d --name hunfly-redis -p 6379:6379 redis:7-alpine
```

Pronto. Vá pro Passo 2.

### Não tem Docker?

1. Abra: https://upstash.com/
2. Clique "Sign Up" (use GitHub)
3. Clique "Create Database"
4. Nome: `hunfly-redis`
5. Região: qualquer
6. Tipo: Regional (grátis)
7. Clique "Create"
8. **Copie a URL** (começa com `rediss://`)

---

## PASSO 2: SUPABASE (5 min)

1. Abra: https://supabase.com/dashboard
2. Clique "New Project"
3. Nome: `Hunfly`
4. Senha: escolha uma (anote!)
5. Região: São Paulo
6. Plano: Free
7. Clique "Create"
8. Aguarde 2 minutos

### Copiar 3 coisas:

9. Clique "Settings" (engrenagem) → "API"
10. **Copie:**
    - Project URL
    - anon public (chave grande)
    - service_role (outra chave grande)

### Criar usuário:

11. Clique "Authentication" → "Users"
12. Clique "Add user" → "Create new user"
13. Email: seu email
14. Senha: Senha123!
15. **Marque:** "Auto Confirm User"
16. Clique "Create user"
17. **Copie o UUID** (ID do usuário)

---

## PASSO 3: .ENV (3 min)

1. Abra `.env` no VS Code
2. Cole as 3 coisas do Supabase:

```bash
SUPABASE_URL=cole_aqui
SUPABASE_ANON_KEY=cole_aqui
SUPABASE_SERVICE_ROLE_KEY=cole_aqui
```

3. Cole a URL do Redis:

**Docker:**
```bash
REDIS_URL=redis://localhost:6379
REDIS_TLS=false
```

**Upstash:**
```bash
REDIS_URL=cole_aqui_url_upstash
REDIS_TLS=true
```

4. Gere senha:

```bash
openssl rand -base64 32
```

5. Cole o resultado:

```bash
APP_JWT_SECRET=cole_aqui
```

6. Salve (Ctrl+S)

7. Teste:

```bash
npm run setup:validate-env
```

---

## PASSO 4: BANCO (3 min)

1. Criar tabelas:

```bash
npm run db:push
```

2. Abra `scripts/seed.sql`
3. Linha 22: substitua `SEU_USER_ID_AQUI` pelo UUID que você copiou
4. Salve (Ctrl+S)

5. Execute:

```bash
npm run setup:seed
```

---

## PASSO 5: RODAR (5 min)

Abra 3 terminais (Ctrl+` e clique no +):

**Terminal 1:**
```bash
npm run dev:api
```

**Terminal 2:**
```bash
npm run dev:worker
```

**Terminal 3:**
```bash
npm run dev
```

Aguarde cada um mostrar "Ready" ou "listening".

### Teste:

Abra 4º terminal:

```bash
curl http://localhost:3001/api/health
```

Deve retornar: `{"ok":true}`

### Criar conversa de teste:

```bash
curl -X POST http://localhost:3001/api/webhooks/whatsapp/evolution -H "Content-Type: application/json" -d '{"event":"MESSAGES_UPSERT","instanceId":"demo-instance","data":[{"key":{"id":"msg001","remoteJid":"5511999999999@c.us","fromMe":false},"messageTimestamp":1706745600,"message":{"conversation":"Oi, preciso de ajuda!"},"pushName":"João Silva"}]}'
```

Terminal 2 deve mostrar: "Message processed"

---

## PASSO 6: ENTRAR (1 min)

1. Abra: http://localhost:3000
2. Email: seu email
3. Senha: Senha123!
4. Clique "WhatsApp"

Vai ver conversas fake.

---

## PASSO 7: DADOS REAIS (10 min)

### Ver no banco:

1. Supabase Dashboard → "SQL Editor"
2. Execute:

```sql
SELECT contact_name, last_message_content FROM threads;
```

Deve aparecer "João Silva".

### Editar código:

1. Abra `src/pages/WhatsApp.tsx`
2. Siga: [docs/WHATSAPP_REFACTOR.md](docs/WHATSAPP_REFACTOR.md)
3. Copie/cole as mudanças do documento
4. Salve (Ctrl+S)

### Teste realtime:

Recarregue o navegador. Deve ver "João Silva".

No terminal:

```bash
curl -X POST http://localhost:3001/api/webhooks/whatsapp/evolution -H "Content-Type: application/json" -d '{"event":"MESSAGES_UPSERT","instanceId":"demo-instance","data":[{"key":{"id":"msg002","remoteJid":"5511999999999@c.us","fromMe":false},"messageTimestamp":1706745660,"message":{"conversation":"Tudo bem?"},"pushName":"João Silva"}]}'
```

Mensagem aparece INSTANTANEAMENTE no navegador.

---

## ✅ PRONTO!

Sistema 100% funcional:
- Backend rodando
- Worker processando
- SSE tempo real
- Frontend com dados reais

---

## 🆘 PROBLEMAS?

**Redis não conecta:**
```bash
docker start hunfly-redis
redis-cli ping
```

**Worker não processa:**
```bash
redis-cli LLEN bull:whatsapp-events:waiting
```

**Frontend sem conversas:**
- Volte ao Passo 5 e rode o curl de novo
- Verifique console do navegador (F12)

**SSE não conecta:**
- Badge deve mostrar "Conectado"
- Console do navegador (F12) mostra erros?
