# Refatoração do WhatsApp.tsx para Usar Dados Reais

Este documento descreve as mudanças necessárias em [src/pages/WhatsApp.tsx](../src/pages/WhatsApp.tsx) para conectar com APIs reais.

---

## 📋 Estado Atual

✅ Hook SSE criado: [src/hooks/useInboxSSE.ts](../src/hooks/useInboxSSE.ts)
✅ Backend aceita token via query: [server/routes/inbox.ts](../server/routes/inbox.ts)
⏳ Frontend usa dados mockados

---

## 🔄 Mudanças Necessárias

### 1. Adicionar Imports

No topo do arquivo, adicionar:

```typescript
import { useEffect } from 'react';
import { useInboxSSE } from '@/hooks/useInboxSSE';
import { apiFetch } from '@/lib/api'; // Cliente HTTP (já existe)
import { useToast } from '@/hooks/use-toast';
```

### 2. Substituir Dados Mock por State Real

**REMOVER** (linhas 27-88):
```typescript
const conversations = [...]; // Mock
const messages = [...]; // Mock
const aiInsights = [...]; // Mock
const agents = [...]; // Mock
```

**ADICIONAR** no componente (dentro de `const WhatsApp = () => {`):

```typescript
// Estados para dados reais
const [conversations, setConversations] = useState<any[]>([]);
const [messages, setMessages] = useState<any[]>([]);
const [agents, setAgents] = useState<any[]>([]);
const [aiInsights, setAiInsights] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const { toast } = useToast();

// IDs do tenant e account (obter do contexto de auth ou props)
// TODO: Substituir pelos valores reais do usuário logado
const tenantId = '00000000-0000-0000-0000-000000000001';
const accountId = '00000000-0000-0000-0000-000000000003';

// Conectar ao SSE
const { lastEvent, isConnected, error: sseError } = useInboxSSE({
  tenantId,
  accountId,
  enabled: true,
});
```

### 3. Carregar Threads (Conversas) da API

Adicionar useEffect para carregar conversas:

```typescript
// Carregar threads ao montar o componente
useEffect(() => {
  const fetchThreads = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(
        `/api/inbox/threads?tenantId=${tenantId}&accountId=${accountId}&limit=50&offset=0`
      );

      const formattedConversations = data.threads.map((t: any) => ({
        id: t.id,
        name: t.contactName || t.contactPhone,
        company: '', // TODO: Buscar de metadata
        lastMessage: t.lastMessageContent,
        time: formatTime(t.lastMessageAt),
        unread: t.unreadCount || 0,
        avatar: getInitials(t.contactName || t.contactPhone),
        status: 'offline', // TODO: Status real (online/offline)
        remoteJid: t.remoteJid,
      }));

      setConversations(formattedConversations);

      // Selecionar primeira conversa
      if (formattedConversations.length > 0) {
        setSelectedConversation(formattedConversations[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar conversas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  fetchThreads();
}, [tenantId, accountId]);

// Helper para formatar horário
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Menos de 1 dia: mostrar hora
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Menos de 7 dias: mostrar "Ontem" ou dia da semana
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    if (diff < 2 * 24 * 60 * 60 * 1000) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  }

  // Mais de 7 dias: mostrar data
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Helper para obter iniciais
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
```

### 4. Carregar Mensagens ao Selecionar Thread

Adicionar useEffect para carregar mensagens quando thread muda:

```typescript
// Carregar mensagens quando thread selecionada muda
useEffect(() => {
  if (!selectedConversation) return;

  const fetchMessages = async () => {
    try {
      const data = await apiFetch(
        `/api/inbox/messages?tenantId=${tenantId}&threadId=${selectedConversation.id}&limit=50&offset=0`
      );

      const formattedMessages = data.messages.map((m: any) => ({
        id: m.id,
        text: m.body,
        sender: m.isFromMe ? 'me' : 'them',
        time: formatTime(m.timestamp),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar mensagens',
        variant: 'destructive',
      });
    }
  };

  fetchMessages();
}, [selectedConversation, tenantId]);
```

### 5. Escutar Eventos SSE em Tempo Real

Adicionar useEffect para processar eventos SSE:

```typescript
// Processar eventos SSE (mensagens em tempo real)
useEffect(() => {
  if (!lastEvent) return;

  console.log('[WhatsApp] SSE Event:', lastEvent.type);

  if (lastEvent.type === 'message.new') {
    const { threadId, messageId, body, timestamp, isFromMe } = lastEvent.data;

    // Atualizar lista de conversas (última mensagem + unread count)
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === threadId) {
          return {
            ...conv,
            lastMessage: body,
            time: formatTime(timestamp),
            unread: isFromMe ? 0 : (conv.unread || 0) + 1,
          };
        }
        return conv;
      })
    );

    // Se a thread ativa é a que recebeu mensagem, adicionar à lista
    if (selectedConversation?.id === threadId) {
      setMessages(prev => [
        ...prev,
        {
          id: messageId,
          text: body,
          sender: isFromMe ? 'me' : 'them',
          time: formatTime(timestamp),
        },
      ]);
    }
  }
}, [lastEvent, selectedConversation]);
```

### 6. Implementar Envio de Mensagem Real

Modificar a função de envio (procurar por `handleSendMessage` ou similar):

```typescript
const handleSendMessage = async () => {
  if (!messageInput.trim() || !selectedConversation) return;

  try {
    await apiFetch('/api/inbox/send_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceId: accountId, // TODO: Usar instanceId real
        remoteJid: selectedConversation.remoteJid,
        message: messageInput.trim(),
      }),
    });

    // Limpar input
    setMessageInput('');

    // Mensagem aparecerá via SSE quando worker processar
    toast({
      title: 'Enviado',
      description: 'Mensagem enviada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    toast({
      title: 'Erro',
      description: 'Falha ao enviar mensagem',
      variant: 'destructive',
    });
  }
};
```

### 7. Integrar Copilot Real (Opcional - M5)

Substituir sugestão mock por chamada real:

```typescript
const handleGenerateSuggestion = async () => {
  try {
    const data = await apiFetch('/api/copilot/suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId,
        threadId: selectedConversation.id,
        agentId: selectedAgent.id,
        useCompanyBase,
        usePersonalBase,
      }),
    });

    setAiSuggestion(data.suggestion.suggestedText);
    setReasoningSummary(data.suggestion.reasoningSummary);
    setGoalProgress(data.suggestion.goalProgress);
    setGoalText(data.suggestion.goalText);
  } catch (error) {
    console.error('Erro ao gerar sugestão:', error);
    toast({
      title: 'Erro',
      description: 'Falha ao gerar sugestão do copiloto',
      variant: 'destructive',
    });
  }
};
```

### 8. Adicionar Indicador de Conexão SSE

No UI, adicionar badge de status:

```typescript
{/* No header do chat */}
<div className="flex items-center gap-2">
  <h3 className="font-semibold">Chat</h3>
  {isConnected ? (
    <Badge variant="success" className="text-xs">
      • Conectado
    </Badge>
  ) : (
    <Badge variant="warning" className="text-xs">
      • Reconectando...
    </Badge>
  )}
</div>
```

### 9. Adicionar Loading States

Mostrar skeleton enquanto carrega:

```typescript
{loading ? (
  <div className="space-y-2 p-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
    ))}
  </div>
) : (
  <div className="flex-1 overflow-y-auto">
    {conversations.map(conv => (
      <ConversationItem key={conv.id} {...conv} />
    ))}
  </div>
)}
```

---

## 🧪 Como Testar

### 1. Pré-requisitos

```bash
# M1 completo
npm run setup:check-infra  # ✅ Todos OK
npm run setup:validate-env # ✅ Todos OK

# Processos rodando
npm run dev:api     # Terminal 1
npm run dev:worker  # Terminal 2
npm run dev         # Terminal 3
```

### 2. Criar Threads de Teste

Enviar webhook fake para criar dados no DB:

```bash
curl -X POST http://localhost:3001/api/webhooks/whatsapp/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGES_UPSERT",
    "instanceId": "demo-instance",
    "data": [{
      "key": {
        "id": "msg001",
        "remoteJid": "5511999999999@c.us",
        "fromMe": false
      },
      "messageTimestamp": 1706745600,
      "message": {
        "conversation": "Olá! Gostaria de saber sobre seus produtos."
      },
      "pushName": "Cliente Teste"
    }]
  }'
```

### 3. Verificar no Frontend

1. Login no Hunfly (http://localhost:3000)
2. Navegar para /whatsapp
3. Ver thread criada na lista
4. Clicar → ver mensagem
5. Enviar nova mensagem
6. Verificar que aparece em tempo real (SSE)

---

## 🎯 Critérios de Sucesso

✅ Lista de conversas carrega do DB (não mock)
✅ Mensagens carregam do DB
✅ SSE conectado (badge "• Conectado")
✅ Enviar mensagem funciona
✅ Nova mensagem aparece em tempo real via SSE
✅ Sem erros no console

---

## 🔧 Troubleshooting

### Conversas não aparecem

1. Verificar se seed foi executado
2. Verificar se há threads no DB:
   ```sql
   SELECT * FROM threads WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
   ```
3. Criar thread via webhook (comando acima)

### SSE não conecta

1. Verificar console do navegador (erros de CORS, 401, etc.)
2. Verificar se token está sendo passado
3. Verificar se Redis está rodando: `redis-cli ping`

### Mensagens não atualizam em tempo real

1. Verificar badge de conexão SSE
2. Verificar logs do worker (deve publicar no Redis)
3. Testar webhook e ver logs:
   ```bash
   # Terminal worker deve mostrar:
   # ✓ Message processed successfully
   ```

---

## 📝 Notas Importantes

1. **tenantId e accountId**: Atualmente hardcoded. Em produção, buscar do contexto de autenticação do usuário logado.

2. **Copilot**: Ainda retorna mock. Para funcionar de verdade, precisa integração LLM (M5).

3. **Loading states**: Adicionar para melhor UX.

4. **Error handling**: Sempre exibir toast em caso de erro.

5. **Pagination**: Implementar scroll infinito para histórico de mensagens.

---

## ✅ Checklist Final

- [ ] Imports adicionados
- [ ] Estados convertidos de mock para real
- [ ] SSE hook integrado
- [ ] Fetch de threads implementado
- [ ] Fetch de mensagens implementado
- [ ] Eventos SSE processados
- [ ] Envio de mensagem funcional
- [ ] Loading states adicionados
- [ ] Error handling implementado
- [ ] Badge de conexão SSE visível
- [ ] Testado end-to-end

Quando todos os itens estiverem marcados, **M4 está completo!** 🎉
