# WHATSAPP_PROJECT_REPORT — Hunfly

**Objetivo deste documento**
Registrar, com rigor de engenharia, tudo o que foi feito e analisado sobre WhatsApp no projeto Hunfly: stack, arquitetura, metodologias, o que foi construído, barreiras atuais e para onde queremos chegar.

---

## 1) Contexto e objetivo do projeto

**Produto:** Hunfly — plataforma de vendas com inbox WhatsApp e copiloto de resposta.

**Objetivo técnico do WhatsApp:**
- Ter **inbox próprio** dentro da Hunfly (não espelhar WhatsApp Web do usuário).
- Integrar **oficialmente** via WhatsApp Business API (Cloud API/BSP).
- Garantir **latência baixa**, **observabilidade** e **segurança**.
- Permitir **copiloto** (sugestões) e **autopiloto** (com regras e auditoria).

**Regras de produto (imutáveis):**
- Proibido WhatsApp Web/scraping.
- WhatsApp deve ficar **dentro da Hunfly** (inbox próprio).
- Autopiloto OFF por padrão + kill switch + logs/auditoria.

---

## 2) Stack atual (confirmado no repo)

**Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS + Radix UI + shadcn-ui
- React Query

**Backend**
- Express (server.ts) + WebSocket (ws)
- Supabase (Auth)
- Drizzle ORM + Postgres
- Zod para validação

**WhatsApp (estado atual)**
- `whatsapp-web.js` com QR Code (legado)
- Rota de **Webhook oficial** da Cloud API em `app/api/webhooks/whatsapp/route.ts`

**Infra**
- Logs com Winston
- Rate limit no Express
- Helmet + CORS allowlist

---

## 3) Arquitetura atual (como está hoje)

### 3.1 Backend WhatsApp (legado via WhatsApp Web)
Arquivo: `server/whatsapp.ts`

Fluxo:
1. `WhatsAppManager` inicializa `whatsapp-web.js` com `LocalAuth`.
2. Gera **QR Code** (eventos `QR_RECEIVED`).
3. Emite eventos de estado (`READY`, `AUTHENTICATED`, `DISCONNECTED`).
4. Captura mensagens recebidas (`MESSAGE_RECEIVED`).
5. Envia mensagens via `client.sendMessage(chatId, message)`.

**Endpoints relevantes (server.ts):**
- `GET /api/whatsapp/status`
- `GET /api/whatsapp/qr`
- `POST /api/whatsapp/init`
- `POST /api/whatsapp/logout`
- `POST /api/whatsapp/send`

### 3.2 Webhook oficial (Cloud API)
Arquivo: `app/api/webhooks/whatsapp/route.ts`

Fluxo:
1. **Verificação** de assinatura (`x-hub-signature-256`).
2. **Validação** do payload com Zod.
3. Parse de `messages` e `statuses`.
4. Persistência das mensagens no Postgres (Drizzle).
5. Logs estruturados com contagem de mensagens/status.

### 3.3 Banco de dados
- Schema em `drizzle/schema.ts`.
- Mensagens persistidas em `whatsappMessages`.

---

## 4) O que foi construído (WhatsApp)

**Legado (WhatsApp Web)**
- QR Code em tempo real.
- Autenticação persistente (LocalAuth).
- Carregamento de conversas reais.
- Envio de mensagens bidirecional.
- Logs e tratamento de erro.

**Oficial (Cloud API)**
- Webhook com verificação de assinatura.
- Persistência de mensagens no banco.
- Log de `statuses` (delivered/failed) quando recebidos.

---

## 5) Metodologias e boas práticas aplicadas

- **Validação de input** com Zod no boundary.
- **Rate limiting** por rota.
- **CORS allowlist** para segurança.
- **JWT curto para WebSocket** (live sessions).
- **Logs estruturados** com contexto.
- **Separação de responsabilidades** (API vs Webhook vs Manager WhatsApp).

---

## 6) Barreiras e riscos atuais

### 6.1 WhatsApp Web (bloqueio estratégico)
- **Proibido pelo escopo** (regra #1 do produto).
- Risco de banimento e instabilidade.
- Não é escalável com conformidade enterprise.

### 6.2 Coexistência de dois modelos
- Temos webhook oficial **e** whatsapp-web.js coexistindo.
- Isso gera duplicidade de fluxo e confusão na arquitetura.

### 6.3 Latência e estado
- WebSocket de live sessions ainda sem fila/worker real.
- Latência e confiabilidade não garantidas ainda.

---

## 7) Para onde queremos chegar (target architecture)

**Target:** WhatsApp Cloud API (oficial) com inbox nativo e compliance.

Arquitetura desejada:
1. **Integração oficial** com WABA (Cloud API/BSP).
2. **Webhook oficial** como única fonte de entrada.
3. **Envio oficial** via Graph API (messages endpoint).
4. **Persistência completa** (threads, mensagens, status, tags).
5. **Copiloto**: sugestões em tempo real.
6. **Autopiloto**: regras + auditoria + kill switch.

---

## 8) Próximos passos técnicos (prioridade)

**P0 — Correções obrigatórias**
- Migrar `whatsapp-web.js` → **Cloud API oficial**.
- Consolidar pipeline WhatsApp (remover duplicidade).

**P1 — Observabilidade**
- Métricas de latência no webhook.
- Logs com requestId / userId / conversationId.

**P1 — Inbox real**
- Threads, status, tags, owner.
- Persistência completa no Postgres.

**P1 — Automações**
- Copiloto com 3 respostas (curta/média/fechamento).
- Autopiloto OFF por padrão + kill switch.

---

## 9) Conclusão (engenharia)

O projeto já possui **infra e base sólida** (Next.js, Express, Supabase, Drizzle). Porém, o **WhatsApp Web** é um risco estratégico que precisa ser eliminado. O caminho correto é **Cloud API oficial** com webhook como fonte única e persistência robusta. Isso garante **escala, compliance e estabilidade** — requisitos essenciais para clientes enterprise.

---

**Última atualização:** 26/01/2026