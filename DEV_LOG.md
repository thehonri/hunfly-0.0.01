# DEV_LOG — Tarefas Urgentes para 1º Teste Real

## Contexto
Este projeto é full-stack com React + Vite no frontend, Express + WebSocket no backend, Supabase como autenticação, Drizzle ORM para o banco e integração com WhatsApp. Há também uma extensão Chrome para captura de áudio em tempo real.

## Tarefas Prioritárias (ordem sugerida)

### 1) P0 — Conformidade com o escopo imutável (bloqueio legal/estratégico)
- [ ] **Substituir `whatsapp-web.js` pela WhatsApp Business API (Cloud API/BSP)**. Hoje o projeto usa WhatsApp Web, o que viola a regra de produto e expõe risco de banimento e compliance.
- [ ] **Revisar fluxos de inbox** para uso de API oficial (threads, mensagens, status, tags, owner).

### 2) P0 — Pipeline de tempo real e latência (primeiro teste real)
- [ ] **Implementar fila/worker** para processar áudio em background (`TODO` em `server.ts`) e evitar travar o servidor.
- [ ] **Definir serviço de STT** com SLA claro (ex: Whisper/Deepgram) e latência esperada por chunk.
- [ ] **Garantir feedback < 300ms** no fluxo de extensão (SLA da regra #5).

### 3) P0 — Extensão MV3 operacional (bloqueio técnico)
- [ ] **Implementar `tabCapture` + WebSocket** na extensão (`extension/src/background/index.ts` está com TODO).
- [ ] **Tipar mensagens (`type + payload`) e validar com zod** no boundary.
- [ ] **Estratégia de rehydration** para service worker (MV3 “dorme”).

### 4) P1 — Segurança e privacidade (não negociável)
- [ ] **Validar inputs com Zod** em todas as rotas críticas.
- [ ] **Logs com contexto** (requestId, userId, conversationId) e **mascaramento de PII**.
- [ ] **Revisar upload** (tamanho, tipo MIME, storage seguro).

### 5) P1 — Arquitetura por camadas (manutenibilidade)
- [ ] **Separar camadas**: handlers finos, domínio (use-cases) e infra (WhatsApp, DB, filas).
- [ ] **Evitar regra de negócio na UI** e reduzir re-render no front.

### 6) P1 — Banco e persistência (histórico real)
- [ ] **Confirmar uso de Postgres** com Drizzle (schema em `drizzle/schema.ts`) e rodar migrations.
- [ ] **Persistir conversas/mensagens** usando o schema existente.

### 7) P1 — Observabilidade e qualidade
- [ ] **Métricas de latência** (API e WS) e logs estruturados.
- [ ] **Testes mínimos essenciais** (1–3 por fluxo crítico: WhatsApp, login, extensão).

### 8) P2 — Documentação mínima de execução
- [ ] **Atualizar README** com instruções reais do projeto (atual está genérico do Lovable).
- [ ] **Registrar troubleshooting** específico (Windows, Chrome/Chromium, permissões de microfone).

---

## Observações críticas
- **WhatsApp via Web** é proibido pelo escopo do produto. Migrar para API oficial é obrigatório.
- **Sem worker/fila**, o backend vai travar quando começar a receber áudio real.
- **Extensão sem captura real** impede o primeiro teste de reuniões.
- **Logs atuais** não garantem contexto/PII — risco de compliance.