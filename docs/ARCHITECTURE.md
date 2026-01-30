# 🏗️ Arquitetura Hunfly - Decisões Técnicas

**Última Atualização**: 2026-01-30
**Status**: Production Ready

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Decisões Arquiteturais (ADRs)](#decisões-arquiteturais-adrs)
3. [Stack Técnica](#stack-técnica)
4. [Arquitetura de Sistema](#arquitetura-de-sistema)
5. [Fluxos Críticos](#fluxos-críticos)
6. [Escalabilidade](#escalabilidade)
7. [Segurança](#segurança)
8. [Monitoramento](#monitoramento)

---

## 🎯 Visão Geral

Hunfly é uma plataforma SaaS multi-tenant para gestão de atendimento via WhatsApp com IA integrada.

**Características principais**:
- 🔐 Multi-tenancy com isolamento completo
- ⚡ Tempo real via Server-Sent Events (SSE)
- 🤖 Copiloto IA para sugestões contextuais
- 📊 RBAC granular (tenant_admin, manager, agent)
- 🔄 Processamento assíncrono com BullMQ
- 📈 Observabilidade com Prometheus + Grafana

---

## 📝 Decisões Arquiteturais (ADRs)

### ADR-001: Evolution API vs Cloud API (WhatsApp)

**Status**: ✅ ACEITO
**Data**: 2026-01-27
**Decisor**: Equipe Técnica

**Contexto**:
- Precisávamos escolher entre WhatsApp Cloud API (oficial) e Evolution API (não-oficial baseado em Baileys)

**Decisão**: Usar **Evolution API (Baileys)**

**Justificativa**:

| Critério | Cloud API | Evolution API | Vencedor |
|----------|-----------|---------------|----------|
| Histórico de mensagens | ❌ Não suporta | ✅ Últimas 1000 msgs | Evolution |
| Grupos pessoais | ❌ Não suporta | ✅ Suporta | Evolution |
| Custo | $0.005/msg enviada | Gratuito | Evolution |
| Confiabilidade | 99.9% SLA | ~95% (risco ban) | Cloud |
| Setup | Aprovação Meta | Imediato | Evolution |

**Consequências**:
- ✅ Funcionalidade completa (histórico + grupos)
- ✅ Custo zero
- ⚠️ Risco de ban (mitigado com rate limiting)
- ⚠️ Necessita infraestrutura própria

**Mitigações**:
- Rate limiting: 20 msgs/min por conta
- Monitoramento de bans via webhook
- Fallback plan para Cloud API (código preparado)

---

### ADR-002: SSE vs WebSocket para Tempo Real

**Status**: ✅ ACEITO (SSE), 🔄 FUTURO (WebSocket)
**Data**: 2026-01-28
**Decisor**: Equipe Técnica

**Contexto**:
- Precisávamos de comunicação tempo real para inbox (mensagens novas)

**Decisão**: Usar **SSE (Server-Sent Events)** na Fase 1, migrar para **WebSocket** na Fase 2

**Justificativa**:

| Critério | SSE | WebSocket |
|----------|-----|-----------|
| Direção | Server→Client | Bidirecional |
| Reconnect | Automático | Manual |
| Browser Support | 100% | 98% |
| Overhead | Baixo | Médio |
| Complexidade | Simples | Moderada |

**Fase 1 (Atual)**: SSE
- ✅ Suficiente para inbox (server→client)
- ✅ Implementação mais simples
- ✅ Reconnect automático

**Fase 2 (Futuro)**: WebSocket
- Quando precisar client→server em tempo real
- Exemplos: typing indicator, read receipts instantâneos

**Consequências**:
- ✅ Implementação rápida (SSE pronto em 1 dia)
- ✅ Funciona para 95% dos casos
- ⚠️ Não suporta typing indicator em tempo real

---

### ADR-003: PostgreSQL vs MongoDB

**Status**: ✅ ACEITO
**Data**: 2026-01-19
**Decisor**: Equipe Técnica

**Decisão**: Usar **PostgreSQL (via Drizzle ORM)**

**Justificativa**:
- ✅ Dados estruturados (multi-tenancy, RBAC)
- ✅ ACID transactions (crítico para billing)
- ✅ JSON support (flexível para metadata)
- ✅ Ecosistema maduro
- ✅ Supabase (managed Postgres) para MVP

**Consequências**:
- Schema bem definido
- Migrations versionadas
- JOINS eficientes para analytics

---

### ADR-004: BullMQ vs SQS para Jobs Assíncronos

**Status**: ✅ ACEITO
**Data**: 2026-01-20
**Decisor**: Equipe Técnica

**Decisão**: Usar **BullMQ (Redis-based)**

**Justificativa**:

| Critério | BullMQ | AWS SQS |
|----------|--------|---------|
| Latência | < 10ms | ~100ms |
| Custo | $0 (Redis já usado) | $0.40/million |
| Retry | Built-in | Manual |
| Priorização | ✅ | ❌ |
| UI | Bull Board | CloudWatch |
| Vendor Lock-in | ❌ | ✅ AWS |

**Consequências**:
- ✅ Latência baixa (crítico para webhooks)
- ✅ Custo zero
- ✅ Retry automático
- ⚠️ Dependência de Redis (já usado para cache/pub-sub)

---

### ADR-005: Drizzle ORM vs Prisma

**Status**: ✅ ACEITO
**Data**: 2026-01-19
**Decisor**: Equipe Técnica

**Decisão**: Usar **Drizzle ORM**

**Justificativa**:
- ✅ SQL-like (TypeScript)
- ✅ Zero runtime overhead
- ✅ Migrations como SQL puro
- ✅ Melhor performance que Prisma
- ✅ Type-safety completo

**Consequências**:
- Curva de aprendizado menor para quem sabe SQL
- Performance superior em queries complexas
- Ecosystem menor que Prisma (mas crescendo)

---

### ADR-006: Multi-tenancy Strategy

**Status**: ✅ ACEITO
**Data**: 2026-01-19
**Decisor**: Equipe Técnica

**Decisão**: Usar **Shared Database com Row-Level Security**

**Opções Consideradas**:
1. Database por tenant (isolamento máximo, custo alto)
2. Schema por tenant (isolamento médio, complexidade média)
3. **Shared DB com RLS** (isolamento via query, custo baixo) ← ESCOLHIDO

**Justificativa**:
- ✅ Custo otimizado (1 instância PostgreSQL)
- ✅ Backups centralizados
- ✅ Migrations mais simples
- ✅ Drizzle + WHERE clauses garantem isolamento
- ✅ 99% das SaaS usam essa abordagem

**Implementação**:
```typescript
// Todas as queries incluem tenantId
const threads = await db.query.threads.findMany({
  where: eq(threads.tenantId, req.membership.tenantId)
});
```

**Consequências**:
- ⚠️ Crítico: NUNCA esquecer WHERE tenant_id
- ✅ Middleware RBAC valida automaticamente
- ✅ Testes garantem isolamento

---

## 🛠️ Stack Técnica

### Frontend
- **Framework**: React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui (Radix)
- **State**: React Query (server state) + Zustand (client state)
- **Build**: Vite (dev), Next.js (prod SSR)
- **Auth**: Supabase Auth

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Validation**: Zod

### Database & Cache
- **Primary DB**: PostgreSQL 15 (Supabase/RDS)
- **Cache**: Redis 7 (ElastiCache/Upstash)
- **Queue**: BullMQ (Redis-based)
- **Search**: PostgreSQL Full-Text Search

### WhatsApp Integration
- **Provider**: Evolution API (Baileys)
- **Fallback**: Meta Cloud API (preparado)
- **Webhooks**: HMAC-SHA256 signature validation

### Infrastructure
- **Containers**: Docker + docker-compose
- **Orchestration**: AWS ECS Fargate / DigitalOcean App Platform
- **CDN**: CloudFront / Cloudflare
- **Logs**: CloudWatch / Grafana Loki
- **Metrics**: Prometheus + Grafana
- **Errors**: Sentry
- **Secrets**: AWS Secrets Manager / Vault

---

## 🏗️ Arquitetura de Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ QR Connect │  │ Inbox Chat │  │ Dashboard  │                │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                │
└────────┼────────────────┼────────────────┼───────────────────────┘
         │                │                │
         │ HTTP REST      │ SSE            │ HTTP REST
         ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth/RBAC    │  │ Inbox Routes │  │ WhatsApp     │          │
│  │ Middleware   │  │ (SSE)        │  │ Connection   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │ Supabase JWT    │ Redis Pub/Sub    │ HTTP             │
└─────────┼──────────────────┼──────────────────┼───────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EVOLUTION API (Baileys)                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  QR Code Generation → WhatsApp Web Protocol            │     │
│  └──────────────────────┬─────────────────────────────────┘     │
│                         │ Webhooks (HMAC-SHA256)                │
│                         ▼                                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  POST /api/webhooks/whatsapp/evolution                 │     │
│  └──────────────────────┬─────────────────────────────────┘     │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼ Add to Queue
┌─────────────────────────────────────────────────────────────────┐
│                    WORKER (BullMQ)                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  1. Validate Webhook Signature                       │       │
│  │  2. Check Idempotency (Redis: processed:<msgId>)     │       │
│  │  3. Save thread + message to PostgreSQL              │       │
│  │  4. Publish to Redis Pub/Sub                         │       │
│  │  5. SSE delivers to frontend                         │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │   Redis     │  │  Supabase   │             │
│  │ (Drizzle)   │  │(Cache/Queue)│  │   (Auth)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Fluxos Críticos

### 1. Receber Mensagem (Webhook → Frontend)

```
Tempo total: < 500ms (P95)

[WhatsApp] → [Evolution API] → [POST /webhooks] → [BullMQ Queue]
    0ms          +50ms              +100ms            +150ms
                                       ↓
                            [Worker Processa]
                                +200ms
                                  ↓
                      [Save DB + Publish Redis]
                          +350ms     +370ms
                                      ↓
                              [SSE → Frontend]
                                  +400ms
```

**Otimizações**:
- Webhook retorna 200 imediatamente (não bloqueia)
- BullMQ processa 10 jobs em paralelo
- Idempotência via Redis (evita duplicatas)
- Índices DB otimizados (queries < 50ms)

### 2. Enviar Mensagem (Frontend → WhatsApp)

```
Tempo total: < 2s (P95)

[Frontend] → [API] → [Evolution API] → [WhatsApp]
    0ms       +50ms       +500ms         +1500ms
     ↓                                      ↓
[Optimistic Update]              [Webhook Confirmação]
    +10ms                              +1700ms
                                          ↓
                              [Worker Atualiza Status]
                                      +2000ms
```

---

## 📈 Escalabilidade

### Horizontal Scaling

```
┌────────────────────────────────────────────┐
│         Load Balancer (Nginx/ALB)         │
└────────────┬───────────────────────────────┘
             │
     ┌───────┼───────┐
     │       │       │
     ▼       ▼       ▼
   [API1] [API2] [API3]  ← Auto-scaling 1-10 instâncias
     │       │       │
     └───────┼───────┘
             │
     ┌───────┼───────┐
     │       │       │
     ▼       ▼       ▼
 [Worker1][Worker2][Worker3] ← Auto-scaling 1-5 instâncias
     │       │       │
     └───────┼───────┘
             │
       [Redis Cluster]
             │
    [PostgreSQL Primary]
             │
      [Read Replicas]
```

### Bottlenecks Identificados

1. **Worker Overload** → Solução: N workers com concurrency=10
2. **DB Queries** → Solução: Índices + cache + read replicas
3. **SSE Connections** → Solução: Redis Pub/Sub (broadcast eficiente)
4. **Evolution API** → Solução: Multiple instances com load balancer

### Capacidade Estimada

| Métrica | VPS ($6/mês) | AWS (Fargate) |
|---------|--------------|---------------|
| Usuários simultâneos | 1,000 | 10,000+ |
| Msgs/min | 10,000 | 100,000+ |
| Latência P95 | < 1s | < 500ms |
| Uptime | 99% | 99.9% |

---

## 🔐 Segurança

### 1. Webhook Security
```typescript
// HMAC-SHA256 signature validation
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

if (signature !== req.headers['x-webhook-signature']) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 2. RBAC (Role-Based Access Control)
- `super_admin`: Wildcard access
- `tenant_admin`: Full tenant access
- `manager`: Read all threads + assign
- `agent`: Read only assigned threads

### 3. SQL Injection Protection
- ✅ Drizzle ORM (prepared statements)
- ❌ NUNCA usar raw SQL com input do usuário

### 4. Environment Variables
- ✅ Secrets via AWS Secrets Manager / Vault
- ❌ NUNCA commitar `.env`
- ✅ Validação em build time

### 5. Rate Limiting
- Global: 100 req/min por IP
- Evolution API: 20 msgs/min por conta (evitar ban)
- SSE: Max 1 conexão por user

---

## 📊 Monitoramento

### Métricas Críticas (Prometheus)

```typescript
// 1. Latência
hunfly_http_request_duration_seconds
hunfly_webhook_processing_duration_seconds

// 2. Taxa de erro
hunfly_http_requests_total{status="5xx"}
hunfly_worker_jobs_failed_total

// 3. Queue health
hunfly_queue_backlog
hunfly_queue_processing_time

// 4. SSE
hunfly_sse_active_connections
hunfly_sse_events_sent_total
```

### Alertas Configurados

- P95 latência > 2s
- Error rate > 1%
- Queue backlog > 1000
- SSE disconnect rate > 5%
- Evolution API down

### Dashboards Grafana

1. **Overview**: Requests, errors, latency
2. **Workers**: Queue size, processing time, failures
3. **Database**: Query time, connections, slow queries
4. **WhatsApp**: Messages sent/received, connection status

---

## 🔄 Changelog

- **2026-01-30**: Documentação completa de arquitetura
- **2026-01-28**: Decisão SSE (Fase 1) → WebSocket (Fase 2)
- **2026-01-27**: Decisão Evolution API vs Cloud API
- **2026-01-19**: Stack técnica definida

---

## 📚 Referências

- [ADR Template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Multi-tenancy Patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-api-access-authorization/welcome.html)
- [BullMQ Best Practices](https://docs.bullmq.io/guide/best-practices)
- [Evolution API Docs](https://github.com/EvolutionAPI/evolution-api)
