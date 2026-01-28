# Hunfly WhatsApp Inbox - Setup Completo

## 🚀 Implementação Realizada

✅ **ETAPA 1: Observabilidade** - COMPLETA
- Correlation ID em todas as requests
- Prometheus metrics (HTTP, queue, inbox)
- Logging estruturado com PII redaction
- Endpoint `/api/metrics` para scraping

✅ **ETAPA 2: Webhooks com Queue** - COMPLETA
- BullMQ para processamento assíncrono
- Signature validation (Evolution + Cloud API)
- Idempotency automática (Redis)
- Tenant resolution (instanceId → tenantId)

⏳ **ETAPA 3: RBAC** - Planejada (próxima)

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
npm install
```

**Novas dependências instaladas:**
- `bullmq` - Job queue com Redis
- `ioredis` - Cliente Redis
- `prom-client` - Métricas Prometheus
- `express-rate-limit` + `rate-limit-redis` - Rate limiting
- `tsx` - TypeScript runner para desenvolvimento

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

**Edite `.env` com suas credenciais:**

```bash
# Database (Postgres)
DATABASE_URL=postgresql://user:password@localhost:5432/hunfly_db

# Redis (obrigatório para queue)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_TLS=false

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
APP_JWT_SECRET=<gere com: openssl rand -base64 64>

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_evolution_api_key
EVOLUTION_WEBHOOK_SECRET=<gere com: openssl rand -hex 32>

# Cloud API (Meta)
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret

# Server
PORT=3001
WEB_ORIGIN=http://localhost:5173
```

### 3. Iniciar Redis

**Opção 1: Docker**
```bash
docker run -d --name hunfly-redis -p 6379:6379 redis:7-alpine
```

**Opção 2: Local (Windows com WSL ou Memurai)**
```bash
# Instale Memurai (Redis para Windows): https://www.memurai.com/
# ou use WSL: wsl -e redis-server
```

**Verificar Redis:**
```bash
redis-cli ping
# Resposta esperada: PONG
```

### 4. Setup Database

**Gerar migrations:**
```bash
npm run db:generate
```

**Aplicar ao database:**
```bash
npm run db:push
```

---

## 🏃 Executar o Sistema

### Desenvolvimento (3 processos)

**Terminal 1: API Server**
```bash
npm run dev:api
```
Logs esperados:
```
API listening on http://localhost:3001
Redis connected
Redis subscriber connected
Redis publisher connected
```

**Terminal 2: Webhook Worker**
```bash
npm run dev:worker
```
Logs esperados:
```
Redis connected
Webhook worker started { concurrency: 10 }
```

**Terminal 3: Frontend (opcional)**
```bash
npm run dev
```

### Produção

```bash
# Build
npm run build

# Iniciar (use PM2 ou similar)
pm2 start npm --name "hunfly-api" -- run start:api
pm2 start npm --name "hunfly-worker" -- run start:worker
pm2 start npm --name "hunfly-web" -- start
```

---

## ✅ Testes de Verificação

### 1. Health Check

```bash
curl -i http://localhost:3001/api/health
```

**Esperado:**
```
HTTP/1.1 200 OK
X-Correlation-Id: <uuid>
Content-Type: application/json

{"ok":true}
```

### 2. Prometheus Metrics

```bash
curl http://localhost:3001/api/metrics
```

**Esperado (exemplo):**
```
# HELP hunfly_http_requests_total Total number of HTTP requests
# TYPE hunfly_http_requests_total counter
hunfly_http_requests_total{method="GET",route="/api/health",status_code="200"} 1

# HELP hunfly_queue_backlog Number of jobs waiting in queue
# TYPE hunfly_queue_backlog gauge
hunfly_queue_backlog{queue_name="whatsapp-events"} 0
```

### 3. Correlation ID (Logs)

Faça uma request qualquer e verifique os logs da API:

```bash
curl http://localhost:3001/api/health
```

**Logs esperados:**
```json
{
  "timestamp": "2026-01-27 10:30:45.123",
  "level": "info",
  "message": "GET /api/health",
  "ip": "::1",
  "correlationId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
}
```

### 4. Webhook Evolution (Teste Completo)

**Passo 1: Configurar webhook no Evolution API**

```bash
curl -X POST http://localhost:8080/instance/webhook \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3001/api/webhooks/whatsapp/evolution",
    "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE"],
    "webhook_by_events": false,
    "webhook_base64": false,
    "secret": "'$EVOLUTION_WEBHOOK_SECRET'"
  }'
```

**Passo 2: Criar tenant e account no DB (IMPORTANTE!)**

Execute este SQL no seu Postgres:

```sql
-- Criar tenant de teste
INSERT INTO tenants (id, name, slug, status, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Teste', 'teste', 'active', 'pro');

-- Criar conta WhatsApp vinculada ao tenant
INSERT INTO whatsapp_accounts (tenant_id, instance_id, provider, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'seu_instance_id_evolution',  -- ⚠️ SUBSTITUA pelo instanceId real
  'evolution',
  'connected'
);
```

**Passo 3: Enviar mensagem de teste via WhatsApp**

- Envie uma mensagem para o número do WhatsApp conectado
- Monitore os logs

**Logs esperados:**

```
# API (Terminal 1):
INFO: Webhook received
  correlationId: abc123...
  provider: evolution
  eventType: MESSAGES_UPSERT

# Worker (Terminal 2):
INFO: Processing webhook event
  correlationId: abc123...
  tenantId: 00000000-0000-0000-0000-000000000001

INFO: Message processed successfully
  messageId: msg_xyz
  threadId: thread_uuid
```

**Passo 4: Verificar no DB**

```sql
-- Ver threads criadas
SELECT * FROM threads WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Ver mensagens
SELECT * FROM messages WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Ver eventos raw (audit)
SELECT * FROM webhook_events_raw ORDER BY received_at DESC LIMIT 5;
```

### 5. Queue Metrics

```bash
# Ver backlog da fila
curl http://localhost:3001/api/metrics | grep queue_backlog

# Esperado (fila vazia):
hunfly_queue_backlog{queue_name="whatsapp-events"} 0
```

---

## 🔍 Troubleshooting

### Redis não conecta

**Erro:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solução:**
```bash
# Verificar se Redis está rodando
redis-cli ping

# Se não estiver, inicie:
docker start hunfly-redis
# ou
redis-server
```

### Worker não processa jobs

**Sintomas:** Mensagens chegam mas não aparecem no DB

**Debug:**
```bash
# Verificar jobs na fila
redis-cli
> KEYS bull:whatsapp-events:*
> LLEN bull:whatsapp-events:waiting

# Ver logs do worker
# Deve mostrar "Job processing..."
```

### Webhook rejeitado (401 Invalid signature)

**Causa:** Secret incorreto ou formato do body alterado

**Solução:**
```bash
# Verificar secret configurado
echo $EVOLUTION_WEBHOOK_SECRET

# Reconfigurar webhook no Evolution
curl -X POST http://localhost:8080/instance/webhook \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{"secret": "'$EVOLUTION_WEBHOOK_SECRET'"}'
```

### Tenant não encontrado

**Erro nos logs:** `WhatsApp account not found for instanceId`

**Solução:**
```sql
-- Verificar se account existe
SELECT * FROM whatsapp_accounts WHERE instance_id = 'seu_instance_id';

-- Se não existir, criar:
INSERT INTO whatsapp_accounts (tenant_id, instance_id, provider, status)
VALUES ('<tenant_id>', '<instance_id>', 'evolution', 'connected');
```

---

## 📊 Monitoramento

### Grafana (Opcional)

**1. Instalar Prometheus:**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'hunfly'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3001']
```

```bash
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**2. Instalar Grafana:**

```bash
docker run -d -p 3000:3000 grafana/grafana
```

Acesse: http://localhost:3000 (admin/admin)

**3. Importar Dashboard:**

- Add Data Source → Prometheus → http://localhost:9090
- Import dashboard com métricas `hunfly_*`

### Alertas Críticos

Configure no Prometheus Alertmanager:

```yaml
# alerts.yml
groups:
  - name: hunfly_critical
    rules:
      - alert: QueueBacklogHigh
        expr: hunfly_queue_backlog > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog alto: {{ $value }} jobs"

      - alert: QueueBacklogCritical
        expr: hunfly_queue_backlog > 10000
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Queue backlog CRÍTICO: {{ $value }} jobs"

      - alert: ProviderErrorRateHigh
        expr: rate(hunfly_provider_errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taxa de erro do provider > 5%"
```

---

## 🚀 Próximos Passos

### 1. Seed de Dados (Recomendado)

Crie um script para popular dados iniciais:

```bash
# scripts/seed.ts
import { db } from '../server/db';
import { tenants, tenantMembers } from '../drizzle/schema';

async function seed() {
  // Criar tenant
  const [tenant] = await db.insert(tenants).values({
    name: 'Minha Empresa',
    slug: 'minha-empresa',
    status: 'active',
    plan: 'pro',
  }).returning();

  // Criar admin
  await db.insert(tenantMembers).values({
    tenantId: tenant.id,
    userId: '<seu_user_id_supabase>',
    role: 'tenant_admin',
    status: 'active',
  });

  console.log('Seed completo!', { tenantId: tenant.id });
}

seed();
```

```bash
npx tsx scripts/seed.ts
```

### 2. ETAPA 3: RBAC (4-6 horas)

Adicionar controle de acesso granular:

```typescript
// Exemplo em server.ts
app.post(
  "/api/inbox/send_message",
  requireAuth,
  requirePermission('inbox.write'),
  async (req: AuthenticatedRequest, res, next) => {
    // Handler com req.membership disponível
  }
);
```

### 3. SSE Realtime (2-3 horas)

Implementar `GET /api/inbox/events` para updates real-time:

```typescript
// server/routes/inbox.ts
router.get('/events', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');

  const channel = `tenant:${tenantId}:inbox`;
  await redisSub.subscribe(channel, (message) => {
    res.write(`data: ${message}\n\n`);
  });
});
```

### 4. Frontend Inbox UI (1-2 semanas)

Componentes necessários:
- `ConversationList` - Lista de threads
- `MessageThread` - Timeline de mensagens
- `MessageComposer` - Input + envio
- `AssignmentDropdown` - Atribuir vendedor
- `TagsInput` - Tags da thread

---

## 📚 Documentação Adicional

- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Status detalhado da implementação
- [drizzle/schema.ts](drizzle/schema.ts) - Schema do banco de dados
- [server/lib/permissions.ts](server/lib/permissions.ts) - Matriz de permissões RBAC

---

## 🆘 Suporte

**Issues comuns já resolvidos:**
1. ✅ Multi-tenancy no DB
2. ✅ RBAC middleware criado
3. ✅ Webhook signature validation
4. ✅ Async processing com BullMQ
5. ✅ Idempotency
6. ✅ Correlation ID
7. ✅ Prometheus metrics
8. ✅ PII redaction nos logs

**Precisa de ajuda?**
- Verifique [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) para troubleshooting
- Revise os logs com `correlationId` para rastrear requests
- Use `/api/metrics` para verificar estado da aplicação

---

## ✅ Checklist de Deploy (Futuro)

- [ ] Migrations aplicadas em produção
- [ ] Redis configurado (ElastiCache ou Upstash)
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets rotacionados (JWT, webhooks)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Alertas configurados (PagerDuty/Opsgenie)
- [ ] Backup automático do DB
- [ ] WAF configurado (Cloudflare)
- [ ] TLS/SSL habilitado
- [ ] Rate limiting por tenant

**Status Atual:** ✅ Pronto para desenvolvimento e staging. Faltam apenas configurações de produção.
