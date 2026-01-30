# 🚀 Hunfly - Sistema Pronto para Vender

**Tempo para rodar**: 45 minutos
**Status**: WhatsApp ✅ | Extensão IA ⏳ (30 min)

## 📚 Documentação Completa

| Documento | Conteúdo |
|-----------|----------|
| **START_HERE.md** (este) | Setup rápido, como rodar |
| [README.md](README.md) | Overview técnico completo |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Decisões técnicas (ADRs) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy produção (AWS/VPS) |
| [docs/CONCORRENTES.md](docs/CONCORRENTES.md) | Análise competitiva (Idealism, Umbler) |
| [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) | Mudanças recentes (40% → 90%) |

---

## ⚡ SETUP RÁPIDO

### 1. Instalar Dependências (5 min)
```bash
npm install
npm install openai
cd extension && npm install && cd ..
```

### 2. Configurar .env (5 min)
```bash
cp .env.example .env
```

**Editar `.env` com:**
```bash
# Supabase (https://supabase.com/dashboard)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (usar Supabase URL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# JWT
APP_JWT_SECRET=$(openssl rand -base64 32)

# Redis (Docker local)
REDIS_URL=redis://localhost:6379
REDIS_TLS=false

# OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-...

# Evolution API (opcional)
EVOLUTION_API_URL=http://localhost:8080
```

### 3. Iniciar Infra (2 min)
```bash
# Redis local
docker run -d --name hunfly-redis -p 6379:6379 redis:7-alpine
```

### 4. Banco de Dados (5 min)
```bash
# Migrations
npm run db:push

# Seed (editar scripts/seed.sql com seu user_id do Supabase)
npm run setup:seed
```

### 5. Rodar Sistema (3 terminais)
```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Worker
npm run dev:worker

# Terminal 3 - Frontend
npm run dev
```

✅ **Sistema rodando**: http://localhost:3000

---

## 📱 WHATSAPP (100% FUNCIONAL ✅)

### Como Funciona
1. Login no sistema
2. WhatsApp → Escanear QR Code
3. Conversas aparecem em tempo real
4. Enviar/receber mensagens

### Testar
```bash
# Simular mensagem recebida
curl -X POST http://localhost:3001/api/webhooks/whatsapp/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGES_UPSERT",
    "instanceId": "demo-instance",
    "data": [{
      "key": {"id": "msg001", "remoteJid": "5511999999999@c.us", "fromMe": false},
      "messageTimestamp": 1706745600,
      "message": {"conversation": "Oi, preciso de ajuda!"},
      "pushName": "João Silva"
    }]
  }'
```

**Resultado**: Mensagem aparece instantaneamente no inbox.

---

## 🤖 EXTENSÃO IA - REUNIÕES AO VIVO (30 min para finalizar)

### O Que Falta

**1. Conectar extensão ao backend (15 min)**

Arquivo: `extension/src/components/Overlay.tsx`

**Linha 108**, substituir:
```typescript
const handleAiSubmit = async () => {
  if (!aiQuery.trim()) return;
  setIsAiLoading(true);
  setAiResponse(null);

  try {
    const transcription = messages
      .map(m => `${m.sender}: ${m.text}`)
      .join('\n');

    const response = await fetch('http://localhost:3001/api/copilot/meeting-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcription, question: aiQuery }),
    });

    const data = await response.json();
    setAiResponse(data.suggestion);
  } catch (error) {
    setAiResponse('Erro. Verifique se o backend está rodando.');
  } finally {
    setIsAiLoading(false);
  }
};
```

**2. Build da extensão (5 min)**
```bash
cd extension
npm run build
```

**3. Instalar no Chrome (5 min)**
1. chrome://extensions/
2. "Modo do desenvolvedor" → ON
3. "Carregar sem compactação"
4. Selecionar: `extension/dist`

**4. Testar no Google Meet (5 min)**
1. Abrir: https://meet.google.com/new
2. Extensão Hunfly aparece no canto direito
3. Clicar "Iniciar" → transcrição em tempo real
4. Clicar 🧠 (cérebro)
5. Perguntar: "Cliente achou caro, como contornar?"
6. IA responde com sugestão

✅ **Pronto para vender!**

---

## 💰 CUSTOS OPERACIONAIS

| Serviço | Custo | Descrição |
|---------|-------|-----------|
| Supabase | **$0** | Free tier (500MB DB) |
| Redis (local) | **$0** | Docker local |
| OpenAI GPT-4o-mini | **~$0.30/mês** | 100 sugestões/dia |
| Evolution API | **$0** | Self-hosted |
| **TOTAL** | **< $1/mês** | Por tenant |

---

## 🎯 VENDER AGORA

### Pitch para Cliente
*"Hunfly é seu assistente de vendas inteligente que:**
- ✅ **Gerencia WhatsApp** - Todas conversas em um lugar, respostas rápidas
- 🤖 **Copiloto IA** - Sugere respostas durante reuniões ao vivo (Google Meet/Teams)
- 📊 **Analytics** - Talk ratio, checkpoints de venda automáticos
- 💼 **Multi-vendedor** - Equipes colaboram na mesma plataforma"*

### Diferenciais vs Concorrentes

**Resumo:**
| | **Hunfly** | Idealism | Umbler |
|-|-----------|----------|---------|
| WhatsApp History | ✅ | ❌ | ✅ |
| IA em Reuniões | ✅ | ❌ | ❌ |
| Tempo Real | SSE (⚡) | Long Polling (🐌) | WebSocket (⚡⚡) |
| Custo | **$29/mês** | $99/mês | $79/mês |

📊 **Análise completa**: [docs/CONCORRENTES.md](docs/CONCORRENTES.md) (stack técnico, vulnerabilidades, estratégia)

---

## 🆘 PROBLEMAS?

**Backend não inicia:**
```bash
# Ver logs
docker-compose logs -f api
```

**Redis não conecta:**
```bash
docker start hunfly-redis
redis-cli ping  # Deve retornar PONG
```

**Frontend não carrega conversas:**
- F12 → Console → ver erros
- Verificar se API está rodando: `curl http://localhost:3001/api/health`

**Extensão não conecta IA:**
- Verificar se OPENAI_API_KEY está no .env
- Verificar se backend está rodando

---

## 📞 PRÓXIMOS PASSOS (DEPOIS DE VENDER)

**Fase 2 - Melhorias:**
- Botão "Sugestão IA" no WhatsApp inbox
- Streaming de respostas (mais rápido)
- Personalização de prompts
- Métricas de conversão

**Fase 3 - Escala:**
- Multi-tenancy completo
- Billing automático
- Integrações (Salesforce, HubSpot)

---

**Última atualização**: 2026-01-30 - Sistema pronto para beta!
