# WhatsApp Integration Setup

Este documento descreve como configurar a integração do WhatsApp com QR Code no projeto Ascend Sales Engine.

## Arquitetura

O projeto agora possui:

### Frontend (React + Vite)
- **Página `/whatsapp-connect`**: Exibe QR Code em tempo real via WebSocket
- **Página `/whatsapp`**: Interface de chat com conversas reais

### Backend (Node.js + Express)
- **whatsapp-web.js**: Integração com WhatsApp Web
- **WebSocket**: Comunicação em tempo real para QR Code
- **tRPC**: API tipada para operações de chat
- **Drizzle ORM**: Gerenciamento de banco de dados

## Requisitos

- Node.js 18+
- npm ou pnpm
- Banco de dados MySQL/TiDB (opcional para desenvolvimento local)

## Instalação

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
Crie um arquivo `.env` na raiz do projeto:

```env
# Frontend
VITE_API_URL=http://localhost:3000

# Backend
DATABASE_URL=mysql://user:password@localhost:3306/ascend_db
JWT_SECRET=your-secret-key-here
```

### 4. Executar o projeto

**Desenvolvimento:**
```bash
# Frontend (porta 5173)
pnpm dev

# Backend (em outro terminal, porta 3000)
pnpm dev:server
```

**Produção:**
```bash
pnpm build
pnpm start
```

## Fluxo de Uso

### 1. Conectar WhatsApp
1. Navegue para `/whatsapp-connect`
2. Um QR Code será exibido em tempo real
3. Abra o WhatsApp no seu telefone
4. Vá para **Configurações → Dispositivos Vinculados → Vincular um Dispositivo**
5. Escaneie o QR Code com a câmera do seu telefone
6. Após autenticação bem-sucedida, você será redirecionado para `/whatsapp`

### 2. Gerenciar Conversas
Na página `/whatsapp`:
- Visualize todas as suas conversas
- Selecione uma conversa para ver o histórico de mensagens
- Envie mensagens em tempo real
- Receba sugestões de respostas com IA
- Visualize análises automáticas da conversa

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
│   ├── whatsapp.ts               # Gerenciador WhatsApp
│   ├── routers-whatsapp.ts       # Rotas tRPC
│   └── db-whatsapp.ts            # Helpers de banco de dados
├── drizzle/
│   └── schema.ts                 # Schema do banco de dados
└── package.json
```

## Funcionalidades Implementadas

✅ QR Code em tempo real via WebSocket
✅ Autenticação com WhatsApp Web
✅ Carregamento de conversas reais
✅ Visualização de mensagens
✅ Envio de mensagens
✅ Sugestões de respostas com IA
✅ Notificações ao proprietário
✅ Armazenamento de mídia em S3
✅ Testes unitários

## Troubleshooting

### QR Code não aparece
- Verifique se o servidor backend está rodando
- Verifique se o WebSocket está conectado (abra DevTools → Network → WS)
- Verifique os logs do servidor

### Erro ao conectar WhatsApp
- Certifique-se de que está usando a versão mais recente do WhatsApp
- Tente desconectar e reconectar
- Verifique se há múltiplas instâncias do navegador abertas

### Mensagens não aparecem
- Verifique a conexão do banco de dados
- Verifique os logs do servidor para erros
- Tente fazer refresh da página

## Próximos Passos

- [ ] Implementar envio de mídia (imagens, áudios, documentos)
- [ ] Adicionar indicadores de digitação
- [ ] Criar dashboard de analytics
- [ ] Implementar automação de respostas
- [ ] Adicionar suporte a múltiplas contas WhatsApp

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório GitHub.
