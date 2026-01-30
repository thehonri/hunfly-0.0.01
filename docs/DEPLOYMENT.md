# 🚀 Guia de Deployment - Hunfly

**Última Atualização**: 2026-01-30

---

## 📋 Pré-requisitos

### Infraestrutura Necessária

- ✅ **PostgreSQL** 15+ (Supabase / RDS / Neon)
- ✅ **Redis** 7+ (ElastiCache / Upstash / self-hosted)
- ✅ **Docker** 20.10+ (para containerização)
- ✅ **Node.js** 18+ (para builds)

### Serviços Externos

- Supabase Account (Auth + Database)
- Domínio configurado (ex: app.hunfly.com)
- SSL Certificate (Let's Encrypt / AWS ACM)

---

## 🏃 Quick Start (VPS - $6/mês)

### Opção 1: DigitalOcean Droplet

```bash
# 1. Provisionar Droplet
# - Specs: 2 vCPU, 2GB RAM, 50GB SSD
# - OS: Ubuntu 22.04 LTS
# - Custo: $6/mês

# 2. Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Logout e login novamente

# 3. Clonar repositório
git clone https://github.com/seu-usuario/hunfly.git
cd hunfly

# 4. Configurar .env
cp .env.example .env
nano .env
# Preencher TODAS as variáveis (ver seção abaixo)

# 5. Deploy com Docker Compose
docker-compose up -d

# 6. Ver logs
docker-compose logs -f

# 7. Health check
curl http://localhost:3001/api/health
# Esperado: {"ok":true}
```

---

## 🔐 Configuração de Environment Variables

### Arquivo .env (NUNCA commitar!)

```bash
# ==============================================
# SERVER
# ==============================================
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# ==============================================
# DATABASE (PostgreSQL)
# ==============================================
DATABASE_URL=postgresql://user:pass@host:5432/hunfly_db

# ==============================================
# REDIS
# ==============================================
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_redis_password_here
REDIS_TLS=false

# ==============================================
# JWT
# ==============================================
# Gerar: openssl rand -base64 64
APP_JWT_SECRET=<64-char-random-string>

# ==============================================
# SUPABASE (Auth + Database)
# ==============================================
# Obter em: Settings > API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ==============================================
# WHATSAPP (Evolution API)
# ==============================================
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://evolution:8080
EVOLUTION_API_KEY=<random-api-key>
EVOLUTION_WEBHOOK_SECRET=<random-webhook-secret>

# Gerar secrets:
# openssl rand -hex 32

# ==============================================
# MONITORING (Opcional)
# ==============================================
SENTRY_DSN=https://...@sentry.io/...
```

### Validar Configuração

```bash
# Script de validação
node scripts/validate-env.js

# Esperado: ✅ All environment variables are configured
```

---

## 🐳 Deploy com Docker Compose

### docker-compose.yml (Incluído no Repo)

```yaml
services:
  - api (API Server)
  - worker (BullMQ Worker)
  - redis (Cache + Queue + Pub/Sub)
  - evolution (WhatsApp Engine)
```

### Comandos Úteis

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f api
docker-compose logs -f worker

# Parar todos os serviços
docker-compose down

# Rebuild após mudanças no código
docker-compose build --no-cache
docker-compose up -d

# Ver status dos containers
docker-compose ps

# Acessar shell de um container
docker-compose exec api sh
```

---

## ☁️ Deploy na AWS (Produção)

### Arquitetura Recomendada

```
CloudFront (CDN)
    ↓
ALB (Load Balancer)
    ↓
ECS Fargate (API + Worker)
    ↓
RDS PostgreSQL + ElastiCache Redis
```

### Passo 1: Setup RDS PostgreSQL

```bash
# AWS Console > RDS > Create Database
- Engine: PostgreSQL 15
- Template: Production
- DB Instance: db.t3.micro ($15/mês)
- Storage: 20GB SSD
- Multi-AZ: Não (para economia)
- VPC: Default VPC
- Security Group: Permitir 5432 do ECS
- Backup: 7 dias

# Obter connection string
DATABASE_URL=postgresql://admin:pass@hunfly-db.xxxxx.us-east-1.rds.amazonaws.com:5432/hunfly
```

### Passo 2: Setup ElastiCache Redis

```bash
# AWS Console > ElastiCache > Create Cluster
- Engine: Redis 7
- Node Type: cache.t4g.micro ($13/mês)
- Number of replicas: 0 (para economia)
- VPC: Mesmo do RDS
- Security Group: Permitir 6379 do ECS

# Obter connection string
REDIS_URL=redis://hunfly-redis.xxxxx.cache.amazonaws.com:6379
```

### Passo 3: Setup ECS Fargate

```bash
# 1. Create ECR Repository
aws ecr create-repository --repository-name hunfly-api

# 2. Build e Push Image
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t hunfly-api .
docker tag hunfly-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/hunfly-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/hunfly-api:latest

# 3. Create Task Definition
# Ver: aws/task-definition.json (no repo)

# 4. Create ECS Service
aws ecs create-service \
  --cluster hunfly-cluster \
  --service-name hunfly-api \
  --task-definition hunfly-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "..."
```

### Passo 4: Setup ALB

```bash
# AWS Console > EC2 > Load Balancers > Create
- Type: Application Load Balancer
- Scheme: Internet-facing
- Listeners: HTTP (80) + HTTPS (443)
- Target Group: ECS Fargate tasks
- Health Check: /api/health

# SSL Certificate
# AWS Console > Certificate Manager > Request Certificate
- Domain: api.hunfly.com
- Validation: DNS (adicionar CNAME no Route53)
```

### Passo 5: Setup CloudFront (CDN)

```bash
# AWS Console > CloudFront > Create Distribution
- Origin: ALB DNS name
- Viewer Protocol: Redirect HTTP to HTTPS
- Allowed Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- Cache Policy: CachingDisabled (para API)
- Alternate Domain: api.hunfly.com

# Route53
# Criar A record: api.hunfly.com -> CloudFront distribution
```

---

## 🔄 CI/CD com GitHub Actions

### .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Build and push Docker image
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        run: aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}

      - name: Build and push
        run: |
          docker build -t hunfly-api .
          docker tag hunfly-api:latest ${{ secrets.ECR_REGISTRY }}/hunfly-api:${{ github.sha }}
          docker push ${{ secrets.ECR_REGISTRY }}/hunfly-api:${{ github.sha }}

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster hunfly-cluster \
            --service hunfly-api \
            --force-new-deployment
```

---

## 📊 Monitoramento Pós-Deploy

### 1. Health Checks

```bash
# API Health
curl https://api.hunfly.com/health
# Esperado: {"ok":true,"timestamp":"2026-01-30T10:00:00.000Z"}

# Metrics
curl https://api.hunfly.com/metrics
# Esperado: Prometheus metrics

# SSE Connection Test
curl -N -H "Authorization: Bearer <token>" \
  "https://api.hunfly.com/api/inbox/events?tenantId=xxx&accountId=xxx"
# Esperado: Conexão mantida aberta
```

### 2. Grafana Dashboards

```bash
# Importar dashboards pré-configurados
# Ver: monitoring/grafana-dashboards/*.json

Dashboards incluídos:
- Overview (requests, errors, latency)
- Workers (queue size, processing time)
- Database (query time, connections)
- WhatsApp (messages, connection status)
```

### 3. Alertas

```yaml
# Configurar no Grafana
Alertas Críticos:
- P95 latência > 2s
- Error rate > 1%
- Queue backlog > 1000
- Evolution API down

Notificações:
- Slack: #alerts
- Email: ops@hunfly.com
- PagerDuty (produção)
```

---

## 🔧 Troubleshooting

### Problema: API não inicia

```bash
# Ver logs
docker-compose logs api

# Erros comuns:
# 1. DATABASE_URL incorreto
#    Solução: Verificar connection string

# 2. Redis não acessível
#    Solução: Verificar REDIS_URL e network

# 3. Port 3001 em uso
#    Solução: Mudar PORT no .env
```

### Problema: Worker não processa jobs

```bash
# Ver logs
docker-compose logs worker

# Ver queue no Redis
redis-cli LLEN bull:whatsapp-events:waiting
redis-cli LLEN bull:whatsapp-events:failed

# Reprocessar jobs failed
# Ver: scripts/retry-failed-jobs.js
```

### Problema: SSE não conecta

```bash
# Verificar CORS
curl -H "Origin: https://app.hunfly.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS https://api.hunfly.com/api/inbox/events

# Ver logs de SSE
docker-compose logs -f api | grep SSE
```

---

## 📋 Checklist Pré-Produção

### Segurança
- [ ] `.env` não está commitado
- [ ] Secrets em AWS Secrets Manager
- [ ] SSL configurado (HTTPS)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativado
- [ ] Webhook signature validation ativa

### Performance
- [ ] Database indexes criados
- [ ] Redis configurado corretamente
- [ ] Worker concurrency otimizada (10)
- [ ] Health checks configurados

### Monitoramento
- [ ] Grafana dashboards importados
- [ ] Alertas configurados
- [ ] Sentry configurado
- [ ] Logs centralizados

### Backup
- [ ] PostgreSQL backup diário
- [ ] Redis persistence ativada
- [ ] Plano de disaster recovery

---

## 🚨 Runbook de Emergência

### API Down

```bash
# 1. Ver logs
docker-compose logs --tail=100 api

# 2. Restart API
docker-compose restart api

# 3. Se não resolver, rollback
git revert HEAD
docker-compose build api --no-cache
docker-compose up -d api
```

### Database Lento

```bash
# 1. Ver queries lentas
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# 2. Ver conexões ativas
SELECT count(*) FROM pg_stat_activity;

# 3. Se necessário, scale vertical (aumentar instance)
```

### Redis Down

```bash
# 1. Restart Redis
docker-compose restart redis

# 2. Ver logs
docker-compose logs redis

# 3. Se dados corrompidos
# CUIDADO: Isso apaga a fila
docker-compose down redis
docker volume rm hunfly_redis-data
docker-compose up -d redis
```

---

## 📚 Referências

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Docker Compose Production](https://docs.docker.com/compose/production/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)
