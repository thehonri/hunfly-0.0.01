import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  Mic,
  CheckCheck,
  Brain,
  Sparkles,
  FileText,
  ArrowRight,
  User,
  Building2,
  Bot,
  Target,
  Wand2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useInboxSSE } from "@/hooks/useInboxSSE";
import { useToast } from "@/hooks/use-toast";

// Helper functions
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return diff < 2 * 24 * 60 * 60 * 1000 ? 'Ontem' : date.toLocaleDateString('pt-BR', { weekday: 'short' });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

async function apiFetch(endpoint: string) {
  const token = localStorage.getItem('supabase.auth.token');
  const response = await fetch(`http://localhost:3001${endpoint}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error('API Error');
  return response.json();
}

const aiInsights = [
  { type: "summary", title: "Resumo da Conversa", text: "Lead interessado em migração de cloud. Demonstrou urgência. Reunião agendada para terça-feira." },
  { type: "pain", title: "Dores Identificadas", text: "Infraestrutura legada, custos altos de manutenção, necessidade de escalar rapidamente." },
  { type: "next", title: "Próximos Passos", text: "Confirmar horário da reunião, preparar apresentação de cases similares, enviar agenda." },
];

const agents = [
  { id: "agent-1", name: "Hero", avatar: "H" },
  { id: "agent-2", name: "Closer", avatar: "C" },
  { id: "agent-3", name: "Consultivo", avatar: "C" },
];

const WhatsApp = () => {
  // Estados da API
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const accountId = '00000000-0000-0000-0000-000000000003';

  const { lastEvent, isConnected } = useInboxSSE({
    tenantId,
    accountId,
    enabled: true,
  });

  // Estados de conexão WhatsApp
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'disconnected' | 'connecting' | 'connected'>('checking');

  // Estados da UI
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [useCompanyBase, setUseCompanyBase] = useState(true);
  const [usePersonalBase, setUsePersonalBase] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(
    "Bom dia! Vi sua mensagem e posso te ajudar a avançar com segurança. Quer que eu te mostre o próximo passo para fechar o produto X?"
  );
  const [goalProgress, setGoalProgress] = useState(10);
  const [goalText, setGoalText] = useState("Vender produto X");
  const [reasoningSummary, setReasoningSummary] = useState([
    "Cliente informal e responde bem a CTA simples",
    "Momento adequado para proposta objetiva",
    "Reforçar benefício principal do produto X",
  ]);

  // Verificar status da conexão do WhatsApp
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Verifica no banco se tem account conectado
        const response = await apiFetch(`/api/whatsapp/status?accountId=${accountId}`);

        if (response.status === 'connected') {
          setWhatsappConnected(true);
          setConnectionStatus('connected');
        } else {
          setWhatsappConnected(false);
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        // Se der erro, assume desconectado
        setWhatsappConnected(false);
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();

    // Poll a cada 5 segundos quando estiver conectando
    const interval = setInterval(() => {
      if (connectionStatus === 'connecting') {
        checkConnection();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [accountId, connectionStatus]);

  // Gerar QR Code quando desconectado
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !qrCode) {
      const generateQR = async () => {
        try {
          setConnectionStatus('connecting');
          const response = await apiFetch(`/api/whatsapp/connect?accountId=${accountId}`);
          setQrCode(response.qrCode);
        } catch (error) {
          toast({
            title: 'Erro',
            description: 'Falha ao gerar QR Code',
            variant: 'destructive',
          });
        }
      };

      generateQR();
    }
  }, [connectionStatus, qrCode, accountId]);

  // Carregar threads (só se conectado)
  useEffect(() => {
    if (!whatsappConnected) return;

    const fetchThreads = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/inbox/threads?tenantId=${tenantId}&accountId=${accountId}&limit=50`);

        const formatted = data.threads.map((t: any) => ({
          id: t.id,
          name: t.contactName,
          company: t.remoteJid || "WhatsApp",
          lastMessage: t.lastMessageContent,
          time: formatTime(t.lastMessageAt),
          unread: t.unreadCount || 0,
          avatar: getInitials(t.contactName),
          status: "online",
          remoteJid: t.remoteJid,
        }));

        setConversations(formatted);
        if (formatted.length > 0) {
          setSelectedConversation(formatted[0]);
        }
      } catch (error) {
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

  // Carregar mensagens
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        const data = await apiFetch(`/api/inbox/messages?tenantId=${tenantId}&threadId=${selectedConversation.id}&limit=50`);

        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          text: m.body,
          sender: m.isFromMe ? 'me' : 'them',
          time: formatTime(m.timestamp),
        })));
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar mensagens',
          variant: 'destructive',
        });
      }
    };

    fetchMessages();
  }, [selectedConversation, tenantId]);

  // SSE - Tempo real
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'message.new') {
      const { threadId, messageId, body, timestamp, isFromMe } = lastEvent.data;

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

  // Tela de conexão do WhatsApp
  if (!whatsappConnected) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full"
          >
            <Card variant="glass" className="p-8">
              <div className="text-center space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-display font-bold">Conectar WhatsApp</h2>
                  <p className="text-muted-foreground">
                    Escaneie o QR Code com seu celular para começar
                  </p>
                </div>

                {/* QR Code */}
                {connectionStatus === 'connecting' && qrCode ? (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-xl inline-block mx-auto">
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Aguardando escaneamento...
                    </div>
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-sm text-muted-foreground">Gerando QR Code...</p>
                  </div>
                )}

                {/* Instruções */}
                <div className="bg-secondary/50 rounded-lg p-6 text-left space-y-3">
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Como conectar:
                  </p>
                  <ol className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
                    <li>3. Toque em <strong>Aparelhos conectados</strong></li>
                    <li>4. Toque em <strong>Conectar um aparelho</strong></li>
                    <li>5. Aponte seu celular para esta tela para escanear o código</li>
                  </ol>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-7rem)] flex gap-4">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 flex flex-col"
        >
          <Card variant="glass" className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Conversas</CardTitle>
                  {isConnected && (
                    <Badge variant="success" className="text-xs">
                      <span className="mr-1">•</span> Conectado
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary">{conversations.length}</Badge>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar contato..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedConversation?.id === conv.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center font-semibold text-primary-foreground">
                      {conv.avatar}
                    </div>
                    {conv.status === "online" && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{conv.name}</span>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.company}</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                      {conv.unread}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <Card variant="glass" className="flex-1 flex flex-col overflow-hidden">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {loading ? "Carregando..." : "Selecione uma conversa"}
              </div>
            ) : (
              <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center font-semibold text-primary-foreground">
                    {selectedConversation.avatar}
                  </div>
                  {selectedConversation.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedConversation.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {selectedConversation.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button 
                  variant={showAiPanel ? "default" : "ghost"} 
                  size="icon"
                  onClick={() => setShowAiPanel(!showAiPanel)}
                >
                  <Brain className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender === "me"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      <span className="text-xs">{msg.time}</span>
                      {msg.sender === "me" && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Digite uma mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="gradient" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    Agente: {selectedAgent.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Objetivo: {goalText}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  Gerar
                </Button>
              </div>
            </div>
          </Card>
          </>
            )}
        </motion.div>

        {/* AI Insights Panel */}
        {showAiPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-80 flex flex-col gap-4"
          >
            {/* AI Header */}
            <Card variant="gradient" className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                      {selectedAgent.avatar}
                    </div>
                    <div>
                      <p className="font-display font-semibold">{selectedAgent.name}</p>
                      <p className="text-xs text-muted-foreground">Copiloto em ação</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={useCompanyBase ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCompanyBase(!useCompanyBase)}
                    >
                      Base da Empresa
                    </Button>
                    <Button
                      variant={usePersonalBase ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUsePersonalBase(!usePersonalBase)}
                    >
                      Materiais Pessoais
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestion */}
            <Card variant="glass" className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Resposta Recomendada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground leading-relaxed">{aiSuggestion}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm">Copiar</Button>
                  <Button size="sm" variant="outline">Editar</Button>
                  <Button size="sm" variant="gradient">Enviar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card variant="glass" className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Objetivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{goalText}</p>
                <div className="w-full h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${goalProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{goalProgress}% de progresso</p>
              </CardContent>
            </Card>

            {/* Reasoning */}
            <Card variant="glass" className="flex-1 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Estratégia resumida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reasoningSummary.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Insights */}
            <Card variant="glass" className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Resumo do Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100%-4rem)]">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {insight.type === "summary" && <FileText className="w-4 h-4 text-primary" />}
                      {insight.type === "pain" && <User className="w-4 h-4 text-warning" />}
                      {insight.type === "next" && <ArrowRight className="w-4 h-4 text-success" />}
                      <span className="text-sm font-medium">{insight.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.text}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                <FileText className="w-4 h-4" />
                Gerar Resumo para CRM
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                <ArrowRight className="w-4 h-4" />
                Criar Follow-up
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WhatsApp;
