# 🔍 Roteiro de Investigação - Umbler

**Data**: 2026-01-30
**Tempo estimado**: 30 minutos

---

## 🎯 INFORMAÇÕES CRÍTICAS

### 1. Network Analysis (15min)

**O que fazer**:
1. Abrir app Umbler no Chrome
2. F12 → Aba **Network**
3. Conectar WhatsApp (se houver essa opção)
4. Tirar screenshots de TODAS as requisições

**O que me enviar**:
📸 Screenshots mostrando:
- Lista de requisições
- URL completa dos endpoints
- Headers (Request/Response)
- Response data

**O que procurar**:
- Domínio da API (ex: `api.umbler.com`)
- **Long Polling** ou **WebSocket**? (`wss://`)
- Endpoints de WhatsApp/Chat
- Timeout das requisições

---

### 2. Wappalyzer (5min)

**Instalado?** ✅ Sim (já tem do Idealism)

**O que fazer**:
1. Abrir Umbler
2. Clicar no ícone Wappalyzer
3. Tirar screenshot

**O que me enviar**:
📸 Screenshot das tecnologias

---

### 3. Teste de Funcionalidades (10min)

**WhatsApp**:
- [ ] Tem integração WhatsApp? Sim / Não
- [ ] Se SIM, cronometrar: Gerar QR → Conectado = _____ segundos

**Chat/Inbox**:
- [ ] Histórico: Sim/Não - quanto tempo atrás?
- [ ] Grupos: Sim/Não

**Performance**:
- [ ] Tempo de carga inicial: _____ segundos
- [ ] Velocidade: Rápido / Normal / Lento
- [ ] Bugs encontrados? Sim / Não - quais?

---

## 📋 TEMPLATE DE RESPOSTA

```
### INVESTIGAÇÃO UMBLER

**Básico**:
- URL do app: [ex: app.umbler.com]
- Tem WhatsApp? Sim / Não

**Network Analysis**:
- Domínio API: [ex: api.umbler.com]
- Comunicação: Long Polling / WebSocket / Outro
- Timeout: [X segundos]
- Screenshots: [anexar]

**Wappalyzer**:
- Frontend: [ex: React, Vue, Angular]
- Backend: [ex: Node.js, Python, PHP]
- Infraestrutura: [ex: AWS, GCP, etc]
- Screenshots: [anexar]

**Funcionalidades**:
- WhatsApp integrado: Sim/Não
- Tempo conexão: [X segundos]
- Histórico: Sim/Não
- Grupos: Sim/Não
- Performance: Rápido/Normal/Lento
- Bugs: [listar se houver]
```

---

## 🔍 Comparação com Idealism

Enquanto investiga, observe:

**Comunicação**:
- Idealism usa Long Polling (40s timeout)
- Umbler usa: ___________

**Infraestrutura**:
- Idealism usa Alibaba Cloud
- Umbler usa: ___________

**Frontend**:
- Idealism: React + Tailwind + shadcn/ui
- Umbler: ___________

---

## 📸 Screenshots Necessários

1. **Network tab** (requisições de WhatsApp/Chat)
2. **Wappalyzer** (tech stack)
3. **Tela do chat** (pode censurar)
4. **Qualquer coisa diferente** do Idealism

---

## 💡 Perguntas Estratégicas

Enquanto testa, pense:
- [ ] Umbler é mais rápido que Idealism?
- [ ] Tem funcionalidades que Idealism não tem?
- [ ] Tem bugs que Idealism não tem?
- [ ] Stack é mais moderna ou antiga?
- [ ] UX é melhor ou pior?

---

## 🎯 Próximos Passos

Depois de investigar:
1. Comparo Idealism vs Umbler
2. Identifico melhor solução
3. Roadmap Hunfly para superar ambos

---

**Pronto para começar!** 🚀

Dúvidas? Me pergunte antes de começar!
