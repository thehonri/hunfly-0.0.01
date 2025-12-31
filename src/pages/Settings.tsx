import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  User,
  Bell,
  Shield,
  Palette,
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const crmIntegrations = [
  { id: "hubspot", name: "HubSpot", connected: false, icon: "🔶" },
  { id: "salesforce", name: "Salesforce", connected: false, icon: "☁️" },
  { id: "pipedrive", name: "Pipedrive", connected: false, icon: "🎯" },
  { id: "rdstation", name: "RD Station", connected: false, icon: "🚀" },
  { id: "zoho", name: "Zoho CRM", connected: false, icon: "📊" },
  { id: "custom", name: "API Personalizada", connected: false, icon: "🔧" },
];

const Settings = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState(crmIntegrations);
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [selectedCrm, setSelectedCrm] = useState<string | null>(null);

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
        
        {/* AI Settings */}
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

        {/* CRM Integrations */}
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

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
        
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
        
        {/* Methodology Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
        
        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
