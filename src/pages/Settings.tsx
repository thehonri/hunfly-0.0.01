import { motion } from "framer-motion";
import { 
  User,
  Bell,
  MessageSquare,
  Save,
  BookOpen,
  Link2,
  Plus,
  Check,
  X,
  ExternalLink,
  Key,
  RefreshCw,
  Sparkles
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type AutoJoinRule = {
  id: string;
  funnel: string;
  stage: string;
  autoJoin: boolean;
  recordMeeting: boolean;
  guidanceEnabled: boolean;
};

const crmIntegrations = [
  { id: "hubspot", name: "HubSpot", connected: false, icon: "🔶" },
  { id: "salesforce", name: "Salesforce", connected: false, icon: "☁️" },
  { id: "pipedrive", name: "Pipedrive", connected: false, icon: "🎯" },
  { id: "rdstation", name: "RD Station", connected: false, icon: "🚀" },
  { id: "zoho", name: "Zoho CRM", connected: false, icon: "📊" },
  { id: "custom", name: "API Personalizada", connected: false, icon: "🔧" },
];

const settingsSections = [
  {
    value: "ai",
    label: "Inteligência Artificial",
    description: "Ative assistentes e recursos inteligentes.",
    icon: Sparkles,
  },
  {
    value: "integrations",
    label: "Integrações",
    description: "Conecte agenda, CRM e canais.",
    icon: Link2,
  },
  {
    value: "profile",
    label: "Perfil",
    description: "Dados pessoais e preferências.",
    icon: User,
  },
  {
    value: "methodology",
    label: "Metodologia de Vendas",
    description: "Scripts e playbooks da equipe.",
    icon: BookOpen,
  },
  {
    value: "notifications",
    label: "Notificações",
    description: "Alertas e lembretes importantes.",
    icon: Bell,
  },
] as const;

const Settings = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState(crmIntegrations);
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [selectedCrm, setSelectedCrm] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState("");
  const [googleCalendarId, setGoogleCalendarId] = useState("primary");
  const [autoJoinRules, setAutoJoinRules] = useState<AutoJoinRule[]>([]);
  const [ruleFunnel, setRuleFunnel] = useState("Funil Principal");
  const [ruleStage, setRuleStage] = useState("Diagnóstico");
  const [ruleAutoJoin, setRuleAutoJoin] = useState(true);
  const [ruleRecordMeeting, setRuleRecordMeeting] = useState(true);
  const [ruleGuidanceEnabled, setRuleGuidanceEnabled] = useState(true);

  const handleConnect = (crmId: string) => {
    if (crmId === "custom") {
      setShowApiConfig(true);
      setSelectedCrm(crmId);
    } else {
      setSelectedCrm(crmId);
      setShowApiConfig(true);
    }
  };

  const handleSaveIntegration = () => {
    if (selectedCrm) {
      setIntegrations(prev => 
        prev.map(crm => 
          crm.id === selectedCrm ? { ...crm, connected: true } : crm
        )
      );
      toast({
        title: "Integração configurada!",
        description: `${integrations.find(c => c.id === selectedCrm)?.name} foi conectado com sucesso.`,
      });
      setShowApiConfig(false);
      setSelectedCrm(null);
      setCustomApiUrl("");
      setCustomApiKey("");
    }
  };

  const handleDisconnect = (crmId: string) => {
    setIntegrations(prev => 
      prev.map(crm => 
        crm.id === crmId ? { ...crm, connected: false } : crm
      )
    );
    toast({
      title: "Integração removida",
      description: "A conexão foi desfeita com sucesso.",
    });
  };

  const handleConnectGoogle = () => {
    setGoogleConnected(true);
    toast({
      title: "Google Agenda conectado!",
      description: "Sua agenda foi vinculada para detectar reuniões automaticamente.",
    });
  };

  const handleDisconnectGoogle = () => {
    setGoogleConnected(false);
    toast({
      title: "Integração removida",
      description: "A conexão com o Google Agenda foi desfeita.",
    });
  };

  const handleAddRule = () => {
    const newRule: AutoJoinRule = {
      id: crypto.randomUUID(),
      funnel: ruleFunnel,
      stage: ruleStage,
      autoJoin: ruleAutoJoin,
      recordMeeting: ruleRecordMeeting,
      guidanceEnabled: ruleGuidanceEnabled,
    };
    setAutoJoinRules((prev) => [newRule, ...prev]);
    toast({
      title: "Regra adicionada",
      description: `A IA vai acompanhar reuniões do funil ${ruleFunnel} na etapa ${ruleStage}.`,
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    setAutoJoinRules((prev) => prev.filter((rule) => rule.id !== ruleId));
    toast({
      title: "Regra removida",
      description: "A regra de acompanhamento foi excluída.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">Personalize sua experiência na plataforma</p>
        </motion.div>

        <Tabs defaultValue="ai" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Seções</p>
              <TabsList className="flex h-auto w-full flex-col items-stretch gap-2 bg-transparent p-0">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <TabsTrigger
                      key={section.value}
                      value={section.value}
                      className="w-full items-start justify-start gap-3 rounded-lg border border-transparent px-3 py-2 text-left data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
                    >
                      <span className="mt-0.5 rounded-md bg-muted p-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {section.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {section.description}
                        </span>
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="space-y-6">
        
        {/* AI Settings */}
          <TabsContent value="ai">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="gradient" className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Inteligência Artificial
                  </CardTitle>
                  <CardDescription>Configure os recursos de IA da plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">Assistente IA em Reuniões</p>
                      <p className="text-sm text-muted-foreground">Pop-ups inteligentes durante calls</p>
                    </div>
                    <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">Análise de WhatsApp</p>
                      <p className="text-sm text-muted-foreground">Resumos automáticos de conversas</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">Sugestões de Follow-up</p>
                      <p className="text-sm text-muted-foreground">IA sugere próximos passos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-success" />
                      <span className="font-medium text-success">IA Ativada</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sua plataforma está usando IA para análise de conversas e reuniões.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        
          <TabsContent value="integrations" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    Google Agenda
                  </CardTitle>
                  <CardDescription>
                    Vincule sua agenda para a IA entrar nas reuniões e gerar direcionamentos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">Status da integração</p>
                        <p className="text-sm text-muted-foreground">
                          {googleConnected
                            ? "Conectado e monitorando sua agenda."
                            : "Conecte sua conta Google para habilitar o assistente em reuniões."}
                        </p>
                      </div>
                      {googleConnected ? (
                        <Badge
                          variant="outline"
                          className="bg-success/10 text-success border-success/30"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline">Desconectado</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="google-email">E-mail vinculado</Label>
                        <Input
                          id="google-email"
                          type="email"
                          placeholder="ex: agenda@empresa.com"
                          value={googleAccountEmail}
                          onChange={(e) => setGoogleAccountEmail(e.target.value)}
                          disabled={!googleConnected}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="google-calendar">ID do calendário</Label>
                        <Input
                          id="google-calendar"
                          placeholder="primary"
                          value={googleCalendarId}
                          onChange={(e) => setGoogleCalendarId(e.target.value)}
                          disabled={!googleConnected}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {googleConnected ? (
                        <>
                          <Button variant="outline" className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Sincronizar agora
                          </Button>
                          <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={handleDisconnectGoogle}
                          >
                            Desconectar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="gradient"
                          className="gap-2"
                          onClick={handleConnectGoogle}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Conectar Google
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Regras de acompanhamento automático</p>
                        <p className="text-sm text-muted-foreground">
                          Defina quais reuniões devem ser acompanhadas pela IA com gravação e insights.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Funil</Label>
                          <Select value={ruleFunnel} onValueChange={setRuleFunnel}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o funil" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Funil Principal">Funil Principal</SelectItem>
                              <SelectItem value="Outbound Enterprise">Outbound Enterprise</SelectItem>
                              <SelectItem value="Inbound Marketing">Inbound Marketing</SelectItem>
                              <SelectItem value="Parcerias">Parcerias</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Etapa</Label>
                          <Select value={ruleStage} onValueChange={setRuleStage}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a etapa" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Diagnóstico">Diagnóstico</SelectItem>
                              <SelectItem value="Demonstração">Demonstração</SelectItem>
                              <SelectItem value="Proposta">Proposta</SelectItem>
                              <SelectItem value="Negociação">Negociação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                          <div>
                            <p className="font-medium">IA entra automaticamente</p>
                            <p className="text-sm text-muted-foreground">
                              O assistente entra na call quando detectar reunião qualificada.
                            </p>
                          </div>
                          <Switch checked={ruleAutoJoin} onCheckedChange={setRuleAutoJoin} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                          <div>
                            <p className="font-medium">Gravar e transcrever reunião</p>
                            <p className="text-sm text-muted-foreground">
                              Gere transcrição e destaques.
                            </p>
                          </div>
                          <Switch checked={ruleRecordMeeting} onCheckedChange={setRuleRecordMeeting} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                          <div>
                            <p className="font-medium">Direcionamento em tempo real</p>
                            <p className="text-sm text-muted-foreground">
                              Dicas rápidas da IA durante a reunião.
                            </p>
                          </div>
                          <Switch
                            checked={ruleGuidanceEnabled}
                            onCheckedChange={setRuleGuidanceEnabled}
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full gap-2"
                        onClick={handleAddRule}
                        disabled={!googleConnected}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar regra
                      </Button>
                      {!googleConnected && (
                        <p className="text-xs text-muted-foreground">
                          Conecte o Google Agenda para habilitar o cadastro de regras.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {autoJoinRules.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                          Nenhuma regra criada ainda. Adicione uma regra para a IA acompanhar reuniões.
                        </div>
                      ) : (
                        autoJoinRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">
                                {rule.funnel} · {rule.stage}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">
                                  Auto-join: {rule.autoJoin ? "On" : "Off"}
                                </Badge>
                                <Badge variant="outline">
                                  Gravação: {rule.recordMeeting ? "On" : "Off"}
                                </Badge>
                                <Badge variant="outline">
                                  Direcionamento: {rule.guidanceEnabled ? "On" : "Off"}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveRule(rule.id)}>
                              Remover
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Integrações CRM
                  </CardTitle>
                  <CardDescription>Conecte seu CRM para sincronização automática</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showApiConfig && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-4 bg-secondary rounded-lg border border-border space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Configurar {integrations.find(c => c.id === selectedCrm)?.name}
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setShowApiConfig(false);
                            setSelectedCrm(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">URL da API</label>
                          <Input
                            placeholder="https://api.seucrm.com/v1"
                            value={customApiUrl}
                            onChange={(e) => setCustomApiUrl(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            Chave de API
                          </label>
                          <Input
                            type="password"
                            placeholder="sk_live_xxxxxxxxxxxxx"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="gradient" 
                          className="gap-2"
                          onClick={handleSaveIntegration}
                        >
                          <Check className="w-4 h-4" />
                          Salvar Integração
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Testar Conexão
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {integrations.map((crm) => (
                      <div
                        key={crm.id}
                        className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{crm.icon}</span>
                          <div>
                            <p className="font-medium">{crm.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {crm.connected ? "Conectado" : "Não conectado"}
                            </p>
                          </div>
                        </div>
                        {crm.connected ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              <Check className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDisconnect(crm.id)}
                            >
                              Desconectar
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleConnect(crm.id)}
                          >
                            Conectar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <p>
                      <strong>Dica:</strong> A integração permite enviar automaticamente resumos de reuniões e 
                      conversas do WhatsApp para seu CRM.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Perfil
                  </CardTitle>
                  <CardDescription>Suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                      JD
                    </div>
                    <Button variant="outline">Alterar foto</Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome</label>
                      <Input defaultValue="João Davi" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">E-mail</label>
                      <Input defaultValue="joao@empresa.com" type="email" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo</label>
                    <Input defaultValue="Vendedor Sênior" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        
          <TabsContent value="methodology">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Metodologia de Vendas
                  </CardTitle>
                  <CardDescription>Configure os scripts e metodologias para sua IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">SPIN Selling</p>
                      <p className="text-sm text-muted-foreground">Situação, Problema, Implicação, Necessidade</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">GPCT</p>
                      <p className="text-sm text-muted-foreground">Goals, Plans, Challenges, Timeline</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">BANT</p>
                      <p className="text-sm text-muted-foreground">Budget, Authority, Need, Timeline</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Criar Script Personalizado
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notificações
                  </CardTitle>
                  <CardDescription>Configure como deseja ser notificado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de reunião</p>
                      <p className="text-sm text-muted-foreground">Receber lembretes antes das reuniões</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sugestões da IA</p>
                      <p className="text-sm text-muted-foreground">Pop-ups durante reuniões ao vivo</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Resumos por e-mail</p>
                      <p className="text-sm text-muted-foreground">Receber resumo semanal de performance</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
            </div>
          </div>
        </Tabs>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <Button variant="gradient" size="lg" className="gap-2">
            <Save className="w-5 h-5" />
            Salvar Alterações
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
