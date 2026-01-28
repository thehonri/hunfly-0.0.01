# Guia de Setup - Hunfly WhatsApp Inbox

Este guia vai te ajudar a configurar o sistema do zero até rodar 100%.

---

## 📋 Status Atual

✅ **Postgres** - Rodando (PostgreSQL 17.6)
❌ **Redis** - Não configurado
⚠️ **Supabase** - Credenciais placeholder (precisa substituir)

---

## 🚀 Passo 1: Configurar Redis

Redis é **obrigatório** para o worker BullMQ e SSE.

### Opção A: Docker (Recomendado - Mais rápido)

```bash
# Iniciar Redis com Docker
docker run -d --name hunfly-redis -p 6379:6379 redis:7-alpine

# Verificar se está rodando
docker ps | grep hunfly-redis

# Testar conexão
redis-cli ping
# Esperado: PONG
```

### Opção B: Cloud (Produção)

**Upstash** (Free tier generoso):
1. Acesse: https://upstash.com/
2. Crie conta gratuita
3. Criar novo Redis database
4. Copie a "Redis URL" (formato: `rediss://...`)

**Outras opções**:
- Redis Cloud: https://redis.com/
- AWS ElastiCache
- Azure Cache

### Configurar no .env

Abra [.env](.env) e adicione:

```bash
# Se Docker local:
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_TLS=false

# Se Upstash (cloud):
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
REDIS_PASSWORD=sua_senha
REDIS_TLS=true
```

---

## 🔐 Passo 2: Configurar Supabase

Supabase é usado para **autenticação de usuários**.

### Criar Projeto

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `Hunfly`
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha mais próxima (ex: South America)
4. Aguarde ~2 minutos (criação do projeto)

### Obter Credenciais

1. No dashboard do projeto, vá em: **Settings** > **API**
2. Copie as seguintes chaves:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** (chave pública)
   - **service_role** (chave privada - NUNCA exponha no frontend)

### Configurar no .env

Abra [.env](.env) e **substitua**:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔑 Passo 3: Gerar JWT Secret

O `APP_JWT_SECRET` é usado para assinar tokens internos.

### Gerar novo secret

**No terminal**:

```bash
# Gerar secret seguro (32+ caracteres)
openssl rand -base64 32
```

Copie a saída (ex: `x7Y9z2A3b4C5d6E7f8G9h0I1j2K3l4M5n6O7p8Q9r0S1t2U3v4W5=`)

### Configurar no .env

Abra [.env](.env) e **substitua**:

```bash
APP_JWT_SECRET=x7Y9z2A3b4C5d6E7f8G9h0I1j2K3l4M5n6O7p8Q9r0S1t2U3v4W5=
```

---

## ✅ Passo 4: Validar Configuração

Execute o script de validação:

```bash
npm run setup:validate-env
```

**Esperado**:
```
✅ Todas as variáveis críticas configuradas!
```

Se ainda houver erros, volte aos passos anteriores.

---

## 🗄️ Passo 5: Aplicar Migrations

Criar as tabelas no banco de dados:

```bash
# Gerar migrations (se necessário)
npm run db:generate

# Aplicar ao banco
npm run db:push
```

**Verificar tabelas criadas**:

```bash
# Conectar ao Postgres (substitua pela sua DATABASE_URL)
psql "postgresql://..."

# Listar tabelas
\dt

# Deve mostrar:
# - tenants
# - tenant_members
# - whatsapp_accounts
# - threads
# - messages
# - webhook_events_raw
# - agents
# - etc.
```

---

## 🌱 Passo 6: Criar Dados Iniciais (Seed)

### 6.1. Criar Usuário no Supabase

1. Acesse: Supabase Dashboard > **Authentication** > **Users**
2. Clique em **"Add user"** > **Create new user**
3. Preencha:
   - **Email**: seu@email.com
   - **Password**: Senha123!
   - **Auto Confirm User**: ✅ (marcar)
4. Clique em **"Create user"**
5. **Copie o UUID** do usuário (coluna "UID")
   - Exemplo: `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`

### 6.2. Editar Arquivo de Seed

Abra [scripts/seed.sql](scripts/seed.sql) e **substitua** na linha 22:

```sql
-- ANTES:
'SEU_USER_ID_AQUI',

-- DEPOIS (com UUID copiado):
'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
```

### 6.3. Executar Seed

```bash
npm run setup:seed
```

**Esperado**:
```
✅ Seed executado com sucesso!

Resultados:
┌─────────┬──────────────┬─────────────┬──────────────┐
│ tenant  │ tenant_status│ user_id     │ role         │
├─────────┼──────────────┼─────────────┼──────────────┤
│Demo Co. │ active       │ a1b2c3d4... │ tenant_admin │
└─────────┴──────────────┴─────────────┴──────────────┘
```

---

## 🎬 Passo 7: Iniciar o Sistema

Abra **3 terminais** e execute:

### Terminal 1 - API Server

```bash
npm run dev:api
```

**Logs esperados**:
```
✓ Redis connected
✓ Redis subscriber connected
✓ Redis publisher connected
✓ API listening on http://localhost:3001
```

### Terminal 2 - Worker

```bash
npm run dev:worker
```

**Logs esperados**:
```
✓ Redis connected
✓ Webhook worker started { concurrency: 10 }
```

### Terminal 3 - Frontend

```bash
npm run dev
```

**Logs esperados**:
```
✓ Ready on http://localhost:3000
```

---

## 🧪 Passo 8: Testar se Está Funcionando

### 8.1. Health Check

```bash
curl http://localhost:3001/api/health
```

**Esperado**: `{"ok":true}`

### 8.2. Metrics

```bash
curl http://localhost:3001/api/metrics
```

**Esperado**: Texto com métricas Prometheus

### 8.3. Frontend

Abra no navegador: http://localhost:3000

**Esperado**: Página de login do Hunfly

---

## 📝 Passo 9: Fazer Login

1. Acesse: http://localhost:3000
2. Faça login com as credenciais criadas no Supabase:
   - **Email**: seu@email.com
   - **Password**: Senha123!

**Se funcionar**: Parabéns! 🎉 M1 (INFRA RODANDO) completo!

---

## 🔧 Troubleshooting

### Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping

# Se não responder, iniciar:
docker start hunfly-redis

# OU iniciar novo container:
docker run -d --name hunfly-redis -p 6379:6379 redis:7-alpine
```

### Postgres não conecta

Verifique o DATABASE_URL no .env e teste:

```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Supabase API falha

1. Verifique se URL e keys estão corretas
2. Teste no navegador: `https://SEU_PROJETO.supabase.co`
3. Deve abrir página do Supabase (não erro 404)

---

## ✅ Checklist Completo M1

- [x] Postgres rodando
- [ ] Redis rodando
- [ ] Supabase configurado
- [ ] .env validado
- [ ] Migrations aplicadas
- [ ] Seed executado
- [ ] API iniciada (Terminal 1)
- [ ] Worker iniciado (Terminal 2)
- [ ] Frontend iniciado (Terminal 3)
- [ ] Login funciona

---

## 🎯 Próximos Passos

Quando M1 estiver completo, seguiremos para:

**M2**: Worker processar webhooks e salvar no DB
**M3**: SSE publicar eventos em tempo real
**M4**: Conectar frontend com dados reais

Execute novamente:

```bash
npm run setup:check-infra
npm run setup:validate-env
```

Quando ambos retornarem ✅, vamos para M2!
