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
  Clock,
  Brain,
  Sparkles,
  FileText,
  ArrowRight,
  User,
  Building2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "Maria Santos",
    company: "TechCorp Solutions",
    lastMessage: "Perfeito, vamos agendar para terça então!",
    time: "10:32",
    unread: 2,
    avatar: "MS",
    status: "online"
  },
  {
    id: 2,
    name: "Pedro Lima",
    company: "CloudBase Inc",
    lastMessage: "Você: Enviei a proposta por email",
    time: "09:15",
    unread: 0,
    avatar: "PL",
    status: "offline"
  },
  {
    id: 3,
    name: "Ana Costa",
    company: "DataFlow",
    lastMessage: "Qual o próximo passo?",
    time: "Ontem",
    unread: 1,
    avatar: "AC",
    status: "online"
  },
  {
    id: 4,
    name: "Carlos Mendes",
    company: "StartupXYZ",
    lastMessage: "Você: Combinado!",
    time: "Ontem",
    unread: 0,
    avatar: "CM",
    status: "offline"
  },
];

const messages = [
  { id: 1, text: "Olá! Tudo bem? Vi que vocês trabalham com soluções em cloud.", sender: "them", time: "10:15" },
  { id: 2, text: "Olá Maria! Tudo ótimo, e você? Sim, somos especialistas em migração e gestão de cloud.", sender: "me", time: "10:18" },
  { id: 3, text: "Que bom! Estamos buscando um parceiro para migrar nossa infraestrutura. Vocês fazem isso?", sender: "them", time: "10:22" },
  { id: 4, text: "Com certeza! Podemos agendar uma call para entender melhor suas necessidades?", sender: "me", time: "10:25" },
  { id: 5, text: "Perfeito, vamos agendar para terça então!", sender: "them", time: "10:32" },
];

const aiInsights = [
  { type: "summary", title: "Resumo da Conversa", text: "Lead interessado em migração de cloud. Demonstrou urgência. Reunião agendada para terça-feira." },
  { type: "pain", title: "Dores Identificadas", text: "Infraestrutura legada, custos altos de manutenção, necessidade de escalar rapidamente." },
  { type: "next", title: "Próximos Passos", text: "Confirmar horário da reunião, preparar apresentação de cases similares, enviar agenda." },
];

const WhatsApp = () => {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageInput, setMessageInput] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(true);

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
                <CardTitle className="text-lg">Conversas</CardTitle>
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
                    selectedConversation.id === conv.id
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
            <div className="p-4 border-t border-border">
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
            </div>
          </Card>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold">Análise IA</p>
                    <p className="text-xs text-muted-foreground">Insights automáticos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card variant="glass" className="flex-1 overflow-hidden">
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
                <Clock className="w-4 h-4" />
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
