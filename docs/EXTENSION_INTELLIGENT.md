# Extensao Inteligente - Hunfly AI Sales Copilot

**Data**: 2026-02-08
**Status**: Em Desenvolvimento (Fase 1)

---

## 1. Objetivo

Transformar a extensao Chrome de um chat simples para um **copiloto de vendas em tempo real** com:

- Deteccao automatica de dores (IA + manual)
- Comando `CTRL + \` para resposta rapida
- Checkpoints dinamicos por metodologia (SPIN, GPCT, custom)
- Selecao de agente configurado na plataforma
- Base de conhecimento integrada (Texto + Links)
- Autenticacao via Supabase

---

## 2. Decisoes do Usuario

| Decisao | Escolha |
|---------|---------|
| **Metodologias** | SPIN + GPCT padrao, OU customizavel ao criar agente |
| **Autenticacao** | Com login (usuario faz login na extensao) |
| **Base de Conhecimento** | Texto + Links (simples, sem PDF) |
| **Deteccao de Dores** | Ambas: IA detecta + vendedor pode adicionar/editar |

---

## 3. Novas Tabelas (Database)

### sales_methodologies
Armazena metodologias de vendas (SPIN, GPCT, ou custom por tenant).

```sql
CREATE TABLE sales_methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  checkpoints JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Checkpoints JSONB Structure:**
```json
[
  {
    "id": "situation",
    "label": "Situacao",
    "keywords": ["empresa", "cenario", "contexto"],
    "tip": "Pergunte sobre o cenario atual do cliente",
    "description": "Entender a situacao atual do cliente"
  }
]
```

### extension_sessions
Uma sessao por call (Google Meet/Zoom).

```sql
CREATE TABLE extension_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES tenant_members(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  methodology_id UUID REFERENCES sales_methodologies(id) ON DELETE SET NULL,
  meeting_platform VARCHAR(20),
  transcript TEXT,
  checkpoints_status JSONB,
  pain_points JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
```

### detected_pain_points
Dores detectadas durante a call.

```sql
CREATE TABLE detected_pain_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extension_sessions(id) ON DELETE CASCADE,
  pain_text TEXT NOT NULL,
  context TEXT,
  source VARCHAR(20) NOT NULL,
  is_addressed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modificacao: agents
Adicionar `methodology_id` para vincular agente a metodologia.

```sql
ALTER TABLE agents ADD COLUMN methodology_id UUID REFERENCES sales_methodologies(id);
```

---

## 4. Novos Endpoints (API)

Todos endpoints requerem autenticacao via Bearer token.

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/extension/auth/login` | POST | Login via Supabase, retorna token |
| `/api/extension/agents` | GET | Lista agentes do usuario |
| `/api/extension/methodologies` | GET | Lista metodologias (padrao + custom) |
| `/api/extension/session/start` | POST | Inicia sessao, retorna agent + methodology + knowledge |
| `/api/extension/session/end` | POST | Finaliza sessao, gera resumo |
| `/api/extension/detect-pains` | POST | Detecta dores no transcript (IA) |
| `/api/extension/pain/add` | POST | Vendedor adiciona dor manualmente |
| `/api/extension/pain/toggle` | PATCH | Marca dor como resolvida |
| `/api/extension/quick-response` | POST | Atalho CTRL+\ - resposta rapida |
| `/api/extension/checkpoint-tip` | POST | Dica para completar checkpoint |

---

## 5. Fluxo do CTRL + \

1. Vendedor pressiona `CTRL + \` (atalho de teclado)
2. Extensao captura ultimos 30s de transcript
3. IA identifica ultima objecao/duvida do cliente
4. Retorna resposta rapida (1-2 frases)
5. Mostra: "Cliente disse: [objecao]" + "Responda: [sugestao]"

**Implementacao:**
```typescript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '\\') {
    e.preventDefault();
    triggerQuickResponse();
  }
});
```

---

## 6. Prompts de IA

### Deteccao de Dores
```
Analise o transcript e identifique DORES do CLIENTE:
- Problemas, dificuldades, desafios
- Frustracoes ou reclamacoes
- Restricoes de budget/tempo/recursos

OUTPUT: [{ pain, quote, severity }]
```

### Resposta Rapida (CTRL+\)
```
CONTEXTO DO AGENTE: {agent.promptBase}
BASE DE CONHECIMENTO: {knowledge}
TRANSCRIPT (ultimos 30s): {transcript}

Identifique a ultima objecao/duvida do cliente.
Sugira resposta RAPIDA (1-2 frases).
```

### Dica de Checkpoint
```
METODOLOGIA: {methodology.name}
CHECKPOINT ATUAL: {checkpoint.label}
OBJETIVO: {checkpoint.description}

De uma DICA para completar este checkpoint.
Sugira uma PERGUNTA especifica.
```

---

## 7. Metodologias Padrao

### SPIN Selling
```json
{
  "name": "SPIN",
  "checkpoints": [
    { "id": "situation", "label": "Situacao", "tip": "Pergunte sobre o cenario atual" },
    { "id": "problem", "label": "Problema", "tip": "Identifique as dores e dificuldades" },
    { "id": "implication", "label": "Implicacao", "tip": "Mostre o impacto do problema" },
    { "id": "need_payoff", "label": "Necessidade", "tip": "Apresente o valor da solucao" }
  ]
}
```

### GPCT
```json
{
  "name": "GPCT",
  "checkpoints": [
    { "id": "goals", "label": "Goals", "tip": "Quais sao os objetivos do cliente?" },
    { "id": "plans", "label": "Plans", "tip": "Como planeja atingir esses objetivos?" },
    { "id": "challenges", "label": "Challenges", "tip": "Quais obstaculos enfrenta?" },
    { "id": "timeline", "label": "Timeline", "tip": "Qual o prazo para resolver?" }
  ]
}
```

---

## 8. Componentes da Extensao

```
extension/src/components/
├── Overlay.tsx              # Container principal (refatorado)
├── AgentSelector.tsx        # Dropdown selecao de agente
├── PainPointsList.tsx       # Lista de dores detectadas
├── QuickCommandInput.tsx    # Input com atalho CTRL+\
├── CheckpointTimeline.tsx   # Timeline dinamica
├── AiTipBubble.tsx          # Dicas contextuais
└── SessionStatus.tsx        # Status da sessao
```

---

## 9. Layout da UI

```
┌─────────────────────────────────────────┐
│ [Agente: Joao] [*] Talk: 42% [v]        │ <- Header com seletor
├─────────────────────────────────────────┤
│ DORES DETECTADAS (3)              [+]   │
│ * "Acha o preco alto"             [x]   │
│ * "Nao tem tempo para implementar"      │
│ * "Precisa de aprovacao"                │
├─────────────────────────────────────────┤
│ Vendedor: Ola, como posso ajudar?       │
│ Cliente: Temos um problema com...       │
│ Vendedor: Entendo, isso e comum...      │
├─────────────────────────────────────────┤
│ Dica: Pergunte sobre o impacto          │ <- AI Tip dinamica
│    financeiro do problema               │
├─────────────────────────────────────────┤
│ o Situacao  * Problema  o Implicacao    │ <- Checkpoints SPIN
├─────────────────────────────────────────┤
│ [CTRL+\ para sugestao...]         [AI]  │ <- Comando rapido
└─────────────────────────────────────────┘
```

---

## 10. Fases de Implementacao

### Fase 1: Database + APIs (COMPLETA)
- [x] Documentar plano (este arquivo)
- [x] Criar tabelas: sales_methodologies, extension_sessions, detected_pain_points
- [x] Adicionar methodology_id na tabela agents
- [x] Seed metodologias padrao (SPIN, GPCT, BANT)
- [x] Endpoint: GET /api/copilot/extension/agents
- [x] Endpoint: GET /api/copilot/extension/methodologies
- [x] Endpoint: POST /api/copilot/extension/session/start
- [x] Endpoint: POST /api/copilot/extension/session/end
- [x] Endpoint: POST /api/copilot/extension/detect-pains
- [x] Endpoint: POST /api/copilot/extension/pain/add
- [x] Endpoint: PATCH /api/copilot/extension/pain/:painId/toggle
- [x] Endpoint: POST /api/copilot/extension/quick-response
- [x] Endpoint: POST /api/copilot/extension/checkpoint-tip
- [x] Endpoint: GET /api/copilot/extension/session/:sessionId/pains
- [x] Funcoes AI: detectPainPoints, generateQuickResponse, generateCheckpointTip

### Fase 2: Extensao Base (3-4 dias)
- [ ] Refatorar Overlay.tsx para componentes
- [ ] AgentSelector.tsx - dropdown de agentes
- [ ] CheckpointTimeline.tsx - dinamico
- [ ] Hook useSession.ts - gerenciar sessao
- [ ] Login na extensao via Supabase

### Fase 3: Deteccao de Dores (2-3 dias) - Endpoints prontos, falta UI
- [x] Endpoint: POST /api/extension/detect-pains
- [ ] Prompt de deteccao de dores
- [ ] PainPointsList.tsx - UI de dores
- [ ] Auto-detectar a cada 30s de transcript

### Fase 4: Comando CTRL+\ (2-3 dias)
- [ ] Endpoint: POST /api/extension/quick-response
- [ ] QuickCommandInput.tsx - detectar CTRL+\
- [ ] UI de resposta rapida
- [ ] Integrar base de conhecimento

### Fase 5: Tips + Polish (2-3 dias)
- [ ] Endpoint: POST /api/extension/checkpoint-tip
- [ ] AiTipBubble.tsx - dicas contextuais
- [ ] Plataforma: pagina Base de Conhecimento
- [ ] Testes end-to-end

---

## 11. Arquivos Criticos

| Arquivo | Mudanca |
|---------|---------|
| `drizzle/schema.ts` | Adicionar novas tabelas |
| `server/routes/copilot.ts` | Novos endpoints |
| `server/lib/ai-provider.ts` | Novos prompts |
| `extension/src/components/Overlay.tsx` | Refatorar |
| `extension/src/components/` | Novos componentes |
| `app/knowledge-base/page.tsx` | Nova pagina |
| `src/components/layout/Sidebar.tsx` | Add menu |

---

## 12. Verificacao

### Testar Endpoints
```bash
# Listar agentes
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/extension/agents

# Iniciar sessao
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "uuid", "platform": "google_meet"}' \
  http://localhost:3001/api/extension/session/start

# Resposta rapida (CTRL+\)
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "uuid", "transcript": "...ultimos 30s..."}' \
  http://localhost:3001/api/extension/quick-response
```

---

**Ultima atualizacao**: 2026-02-08
