"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { MessageSquare, Phone, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useInboxSSE } from "@/hooks/useInboxSSE";

const API_URL = 'http://localhost:3001';

const WhatsApp = () => {
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'disconnected' | 'connecting' | 'connected'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasCheckedConnection = useRef(false);
  const isGeneratingQR = useRef(false);

  const accountId = '00000000-0000-0000-0000-000000000003';

  // Verificar status da conexão
  useEffect(() => {
    if (hasCheckedConnection.current) return;
    hasCheckedConnection.current = true;

    const checkConnection = async () => {
      try {
        console.log('[STATUS CHECK] Checking connection status...');
        const response = await fetch(`http://localhost:3001/api/whatsapp/status?accountId=${accountId}`);

        if (!response.ok) {
          setConnectionStatus('disconnected');
          return;
        }

        const data = await response.json();

        if (data.status === 'connected') {
          setWhatsappConnected(true);
          setConnectionStatus('connected');
        } else {
          setWhatsappConnected(false);
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Connection check error:', error);
        setWhatsappConnected(false);
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();

    // Poll a cada 5 segundos para verificar se conectou
    const interval = setInterval(() => {
      checkConnection();
    }, 5000);

    return () => clearInterval(interval);
  }, [accountId]);

  // Gerar QR Code - CORRIGIDO
  useEffect(() => {
    // Não gerar se já conectado, já tem QR, ou já está gerando
    if (connectionStatus !== 'disconnected' || qrCode || isGeneratingQR.current) {
      return;
    }

    isGeneratingQR.current = true;

    const generateQR = async () => {
      try {
        console.log('[QR] Fetching QR code...');
        setErrorMessage(null);

        const response = await fetch(`http://localhost:3001/api/whatsapp/connect?accountId=${accountId}`);

        if (!response.ok) {
          console.error('[QR] Failed:', response.status);

          // Se 503, é porque Evolution API está acordando
          if (response.status === 503) {
            const data = await response.json().catch(() => ({}));
            setErrorMessage(data.message || 'Serviço temporariamente indisponível. Aguarde 1 minuto...');

            // Retry após 60s
            setTimeout(() => {
              console.log('[QR] Retrying after Evolution API wake up...');
              isGeneratingQR.current = false;
              setErrorMessage(null);
            }, 60000);
          } else {
            setErrorMessage('Erro ao gerar QR Code. Tente novamente.');
          }

          isGeneratingQR.current = false;
          return;
        }

        const data = await response.json();
        console.log('[QR] Response received:', data);

        // Se já conectado, atualizar estado
        if (data.connected) {
          console.log('[QR] ✅ WhatsApp already connected!');
          setWhatsappConnected(true);
          setConnectionStatus('connected');
          return;
        }

        // Se recebeu QR Code, exibir
        if (data.qrCode) {
          console.log('[QR] ✅ Setting QR Code!');
          setQrCode(data.qrCode);
          setErrorMessage(null);
        } else {
          console.error('[QR] ❌ No QR code in response');
          setErrorMessage('QR Code não recebido. Tente novamente.');
          isGeneratingQR.current = false;
        }
      } catch (error) {
        console.error('[QR] ❌ Exception:', error);
        setErrorMessage('Erro de conexão. Verifique se o servidor está rodando.');
        isGeneratingQR.current = false;
      }
    };

    generateQR();
  }, [connectionStatus, qrCode, accountId]);

  if (!whatsappConnected) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full"
          >
            <Card className="p-8">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Conectar WhatsApp</h2>
                  <p className="text-muted-foreground">
                    Escaneie o QR Code com seu celular para começar
                  </p>
                </div>

                {errorMessage ? (
                  <div className="py-12 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-3xl">⚠️</span>
                    </div>
                    <p className="text-sm text-yellow-600 font-medium">{errorMessage}</p>
                    <p className="text-xs text-muted-foreground">
                      A Evolution API (Render free tier) pode demorar até 1 minuto para iniciar.
                    </p>
                  </div>
                ) : qrCode ? (
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
                    <p className="mt-4 text-sm text-muted-foreground">
                      Gerando QR Code...
                      <br />
                      <span className="text-xs">(Pode demorar até 1min na primeira tentativa)</span>
                    </p>
                  </div>
                )}

                <div className="bg-secondary/50 rounded-lg p-6 text-left space-y-3">
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Como conectar:
                  </p>
                  <ol className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Toque em Menu ou Configurações</li>
                    <li>3. Toque em Aparelhos conectados</li>
                    <li>4. Toque em Conectar um aparelho</li>
                    <li>5. Aponte seu celular para esta tela</li>
                  </ol>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Estado do Chat
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tenantId = '00000000-0000-0000-0000-000000000001'; // TODO: obter do contexto de autenticação

  // SSE - Receber eventos em tempo real
  const { lastEvent } = useInboxSSE({
    tenantId,
    accountId,
    enabled: whatsappConnected,
  });

  // Processar eventos SSE
  useEffect(() => {
    if (!lastEvent) return;

    console.log('[SSE] Event received:', lastEvent.type, lastEvent.data);

    if (lastEvent.type === 'message.new') {
      const { threadId, messageId, body, timestamp, isFromMe } = lastEvent.data;

      // Atualizar lista de conversas
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === threadId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: body || '',
            time: timestamp ? new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
            unread: isFromMe ? updated[existingIndex].unread : updated[existingIndex].unread + 1,
          };
          return updated;
        }
        return prev;
      });

      // Se thread ativa, adicionar mensagem
      if (selectedConversation?.id === threadId) {
        setMessages(prev => {
          // Evitar duplicatas
          if (prev.some(m => m.id === messageId)) return prev;

          return [...prev, {
            id: messageId,
            text: body || '',
            sender: isFromMe ? 'me' : 'them',
            time: timestamp ? new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
            status: 'delivered',
          }];
        });
      }
    }
  }, [lastEvent, selectedConversation]);

  // Scroll automático para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar conversas (threads)
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/inbox/threads?tenantId=${tenantId}&accountId=${accountId}&limit=50`
        );

        if (!response.ok) {
          console.error('Failed to fetch threads:', response.status);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.ok && data.threads) {
          setConversations(data.threads.map((t: any) => ({
            id: t.id,
            remoteJid: t.remoteJid,
            name: t.contactName || t.remoteJid.split('@')[0],
            lastMessage: t.lastMessageContent || '',
            time: t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
            unread: t.unreadCount || 0,
          })));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching threads:', error);
        setLoading(false);
      }
    };

    if (whatsappConnected) {
      fetchThreads();
    }
  }, [whatsappConnected, accountId, tenantId]);

  // Carregar mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/inbox/messages?tenantId=${tenantId}&threadId=${selectedConversation.id}&limit=50`
        );

        if (!response.ok) {
          console.error('Failed to fetch messages:', response.status);
          return;
        }

        const data = await response.json();

        if (data.ok && data.messages) {
          setMessages(data.messages.map((m: any) => ({
            id: m.id,
            text: m.body || '',
            sender: m.isFromMe ? 'me' : 'them',
            time: new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: m.status,
          })).reverse()); // Reverter para ordem cronológica
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversation, tenantId]);

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      // Adicionar mensagem localmente (otimistic update)
      const tempMessage = {
        id: `temp-${Date.now()}`,
        text: messageInput,
        sender: 'me',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sending',
      };

      setMessages(prev => [...prev, tempMessage]);
      setMessageInput('');

      // Enviar para API
      const response = await fetch(`${API_URL}/api/inbox/send_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: `hunfly_${accountId}`,
          remoteJid: selectedConversation.remoteJid,
          message: messageInput,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send message:', response.status);
        // Remover mensagem temporária em caso de erro
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Gerar sugestão IA
  const handleGenerateAiSuggestion = async () => {
    if (!selectedConversation || messages.length === 0) return;

    try {
      setAiLoading(true);
      setAiSuggestion(null);

      // Montar transcrição das últimas mensagens
      const transcription = messages.slice(-10).map(m =>
        `${m.sender === 'me' ? 'Vendedor' : 'Cliente'}: ${m.text}`
      ).join('\n');

      const response = await fetch(`${API_URL}/api/extension/meeting-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription,
          question: 'Sugira a melhor resposta para continuar essa conversa de vendas'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestion) {
          setAiSuggestion(data.suggestion);
          setMessageInput(data.suggestion);
        }
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Lista de Conversas */}
        <div className="w-96 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Conversas
            </h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="space-y-2">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma conversa ainda
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 border-b hover:bg-accent transition-colors text-left ${selectedConversation?.id === conv.id ? 'bg-accent' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-primary">
                        {conv.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold truncate">{conv.name}</h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {conv.time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                        {conv.unread > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header da Conversa */}
              <div className="p-4 border-b bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-base font-semibold text-primary">
                      {selectedConversation.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.remoteJid}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma mensagem ainda
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender === 'me'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <p
                          className={`text-xs mt-1 ${msg.sender === 'me'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                            }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t bg-card space-y-2">
                {/* Sugestão IA */}
                {aiSuggestion && (
                  <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-sm text-muted-foreground">
                      <span className="font-medium text-primary">Sugestão IA:</span> Editável no campo abaixo
                    </div>
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateAiSuggestion}
                    disabled={aiLoading || messages.length === 0}
                    className="px-3 py-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    title="Gerar sugestão IA"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-primary" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">WhatsApp Conectado</h3>
                  <p className="text-muted-foreground">
                    Selecione uma conversa para começar
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsApp;
