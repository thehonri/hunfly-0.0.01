# 🔍 Roteiro de Investigação - Idealism

**Data**: 2026-01-30
**Tempo estimado**: 30 minutos (apenas info crítica)

---

## 🎯 INFORMAÇÕES CRÍTICAS (30min)

### 1. Network Analysis (15min)

**O que fazer**:
1. Abrir app Idealism no Chrome
2. F12 → Aba **Network**
3. Clicar "Conectar WhatsApp"
4. Tirar screenshots de TODAS as requisições

**O que me enviar**:
📸 Screenshot mostrando:
- Lista de requisições (lado esquerdo)
- URL completa do endpoint
- Headers (Request/Response)
- Response data

**O que procurar**:
- Domínio da API (ex: `api.dealism.com.br`)
- WebSocket? (`wss://...`)
- Endpoints `/whatsapp/*`, `/instance/*`

---

### 2. Wappalyzer (5min)

**O que fazer**:
1. Instalar: https://chrome.google.com/webstore/detail/wappalyzer
2. Abrir Idealism
3. Clicar no ícone Wappalyzer
4. Tirar screenshot

**O que me enviar**:
📸 Screenshot das tecnologias detectadas

---

### 3. Teste de Funcionalidades (10min)

**Medir e me dizer**:

**Tempo de conexão**:
- Cronometrar: Gerar QR → Conectado
- Tempo: _____ segundos

**Histórico**:
- Puxa mensagens antigas? Sim / Não
- De quanto tempo atrás? (dias/semanas/meses)

**Grupos**:
- Aparecem grupos pessoais? Sim / Não

**Performance**:
- Velocidade geral: Rápido / Normal / Lento
- Teve bugs? Sim / Não

---

## 📋 TEMPLATE DE RESPOSTA

```
### INVESTIGAÇÃO IDEALISM

**Network Analysis**:
- Domínio API: [ex: api.dealism.com.br]
- WebSocket: Sim / Não
- Screenshots: [anexar]

**Wappalyzer**:
- Frontend: [ex: React, Next.js]
- Backend: [ex: Node.js, Python]
- Screenshots: [anexar]

**Funcionalidades**:
- Tempo conexão: [X segundos]
- Histórico: Sim/Não - [quanto tempo]
- Grupos: Sim/Não
- Performance: Rápido/Lento
- Screenshots: [anexar]
```

---

## 📸 Screenshots Importantes

Preciso de:
1. Network tab (requisições)
2. Wappalyzer (tech stack)
3. Tela do chat (pode censurar dados)

---

## 🎯 Próximos Passos

Depois que você me enviar:
1. Analiso tech stack
2. Comparo com Hunfly
3. Crio plano de migração detalhado
4. Estimamos custos/prazos

**Meta**: Hunfly = Idealism em 60-90 dias

---

**DÚVIDAS?** Me pergunte antes de começar!
