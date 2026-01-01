# WhatsApp Integration Setup

Este documento descreve como configurar e rodar a integração completa do WhatsApp com QR Code no projeto Ascend Sales Engine.

## Arquitetura

O projeto agora possui uma **arquitetura full-stack**:

### Frontend (React + Vite)
- **Página `/whatsapp-connect`**: Exibe QR Code em tempo real via WebSocket
- **Página `/whatsapp`**: Interface de chat com conversas reais
- **Comunicação**: WebSocket para atualizações em tempo real

### Backend (Node.js + Express)
- **Express Server**: API REST para gerenciar WhatsApp
- **whatsapp-web.js**: Integração com WhatsApp Web
- **WebSocket**: Comunicação em tempo real para QR Code
- **LocalAuth**: Autenticação persistente do WhatsApp

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm ou pnpm
- Chromium/Chrome (para whatsapp-web.js)
- Banco de dados MySQL/TiDB (opcional para desenvolvimento local)

## Instalação Rápida

### 1. Clonar o repositório
```bash
git clone https://github.com/agathashaeed/ascend-sales-engine.git
cd ascend-sales-engine
```

### 2. Instalar dependências
```bash
pnpm install
# ou
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`):

```bash
cp .env.example .env
```

Edite `.env` se necessário:
```env
PORT=3000
NODE_ENV=development
```

### 4. Rodar o projeto em desenvolvimento

**Terminal 1 - Frontend (Vite):**
```bash
pnpm dev
```
Acesse: http://localhost:5173

**Terminal 2 - Backend (Express + WebSocket):**
```bash
pnpm dev:server
```
Server rodando em: http://localhost:3000

## Fluxo de Uso Completo

### 1. Iniciar o Backend
```bash
pnpm dev:server
```

Você verá:
```
Server running on http://localhost:3000
WebSocket available at ws://localhost:3000
```

### 2. Iniciar o Frontend
```bash
pnpm dev
```

Você verá:
```
VITE v5.4.19  ready in 123 ms
➜  Local:   http://localhost:5173/
```

### 3. Conectar WhatsApp
1. Navegue para: http://localhost:5173/whatsapp-connect
2. Um **QR Code será gerado automaticamente** em tempo real
3. Abra o **WhatsApp no seu telefone**
4. Vá para: **Configurações → Dispositivos Vinculados → Vincular um Dispositivo**
5. **Escaneie o QR Code** com a câmera do seu telefone
6. Após autenticação bem-sucedida, você será **redirecionado para `/whatsapp`**

### 4. Gerenciar Conversas
Na página `/whatsapp`:
- ✅ Visualize todas as suas conversas reais
- ✅ Selecione uma conversa para ver o histórico de mensagens
- ✅ Envie mensagens em tempo real
- ✅ Receba sugestões de respostas com IA
- ✅ Visualize análises automáticas da conversa

## Estrutura de Pastas

```
ascend-sales-engine/
├── src/                          # Frontend React
│   ├── pages/
│   │   ├── WhatsAppConnect.tsx   # Página de conexão com QR Code
│   │   └── WhatsApp.tsx          # Página de conversas
│   ├── components/
│   └── App.tsx
├── server/                        # Backend Node.js
│   └── whatsapp.ts               # Gerenciador WhatsApp com QR Code
├── server.ts                      # Express + WebSocket server
├── drizzle/
│   └── schema.ts                 # Schema do banco de dados
├── package.json
├── .env.example
└── WHATSAPP_SETUP.md
```

## Funcionalidades Implementadas

✅ **QR Code em tempo real** via WebSocket
✅ **Autenticação com WhatsApp Web** usando LocalAuth
✅ **Carregamento de conversas reais** do WhatsApp
✅ **Visualização de mensagens** com histórico
✅ **Envio de mensagens** bidirecional
✅ **Persistência de autenticação** (não precisa escanear QR toda vez)
✅ **Tratamento de erros** robusto
✅ **Graceful shutdown** do servidor

## Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia apenas o frontend (Vite)
pnpm dev:server       # Inicia apenas o backend (Express + WebSocket)

# Build
pnpm build            # Build do frontend
pnpm build:full       # Build frontend + backend

# Produção
pnpm start            # Inicia o servidor em produção

# Utilitários
pnpm lint             # Executa ESLint
pnpm preview          # Preview do build
```

## Troubleshooting

### ❌ QR Code não aparece
**Solução:**
- Verifique se o backend está rodando: `pnpm dev:server`
- Verifique se o WebSocket está conectado (DevTools → Network → WS)
- Verifique os logs do servidor para erros
- Tente recarregar a página

### ❌ Erro: "WhatsApp not ready"
**Solução:**
- Aguarde o QR Code aparecer completamente
- Escaneie o QR Code com o WhatsApp
- Verifique se há múltiplas instâncias do navegador abertas
- Limpe a pasta `.wwebjs_auth` e tente novamente

### ❌ Mensagens não aparecem
**Solução:**
- Verifique se está conectado ao WhatsApp (QR Code desapareceu)
- Tente enviar uma mensagem de teste
- Verifique os logs do servidor
- Tente fazer refresh da página

### ❌ Erro de Chromium/Puppeteer
**Solução:**
```bash
# Instale as dependências do sistema (Linux)
sudo apt-get install -y chromium-browser

# Ou configure o caminho do Chrome
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### ❌ Porta 3000 já em uso
**Solução:**
```bash
# Use uma porta diferente
PORT=3001 pnpm dev:server
```

## Próximos Passos

- [ ] Implementar envio de mídia (imagens, áudios, documentos)
- [ ] Adicionar indicadores de digitação
- [ ] Criar dashboard de analytics
- [ ] Implementar automação de respostas
- [ ] Adicionar suporte a múltiplas contas WhatsApp
- [ ] Integrar com banco de dados para persistência
- [ ] Adicionar autenticação de usuários

## Segurança

⚠️ **Importante:**
- Nunca commite arquivos `.env` com credenciais reais
- A pasta `.wwebjs_auth` contém dados sensíveis - adicione ao `.gitignore`
- Use variáveis de ambiente para dados sensíveis
- Em produção, use HTTPS e WSS (WebSocket Secure)

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do servidor
2. Abra uma issue no repositório GitHub
3. Consulte a documentação do [whatsapp-web.js](https://docs.wwebjs.dev/)

## Licença

Este projeto é fornecido como está para fins educacionais e comerciais.
