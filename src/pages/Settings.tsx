import { motion } from "framer-motion";
import {
    User,
    Bell,
    BookOpen,
    Link2,
    Check,
    Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// AutoJoinRule type - will be used when rule management is implemented

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
    const [_customApiUrl, _setCustomApiUrl] = useState("");
    const [_customApiKey, _setCustomApiKey] = useState("");
    const [aiEnabled, setAiEnabled] = useState(true);
    const [_showApiConfig, setShowApiConfig] = useState(false);
    const [_selectedCrm, setSelectedCrm] = useState<string | null>(null);

    const handleConnect = (crmId: string) => {
        setSelectedCrm(crmId);
        setShowApiConfig(true);
    };

    const handleDisconnect = (crmId: string) => {
        setIntegrations((prev) =>
            prev.map((crm) => (crm.id === crmId ? { ...crm, connected: false } : crm))
        );
        toast({
            title: "Integração removida",
            description: "A conexão foi desfeita com sucesso.",
        });
    };

    // Note: handleSaveIntegration, handleConnectGoogle, handleDisconnectGoogle, 
    // handleAddRule, handleRemoveRule will be implemented when their UI sections are active

    return (
        <DashboardLayout>
            <div className="max-w-4xl space-y-6">
                {/* Page Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-display font-bold">Configurações</h1>
                    <p className="text-muted-foreground mt-1">
                        Personalize sua experiência na plataforma
                    </p>
                </motion.div>

                <Tabs defaultValue="ai" className="space-y-6">
                    <TabsList className="flex flex-wrap justify-start gap-2">
                        <TabsTrigger value="ai">Inteligência Artificial</TabsTrigger>
                        <TabsTrigger value="integrations">Integrações</TabsTrigger>
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        <TabsTrigger value="methodology">Metodologia de Vendas</TabsTrigger>
                        <TabsTrigger value="notifications">Notificações</TabsTrigger>
                    </TabsList>

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
                                            <p className="text-sm text-muted-foreground">
                                                Pop-ups inteligentes durante calls
                                            </p>
                                        </div>
                                        <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">Análise de WhatsApp</p>
                                            <p className="text-sm text-muted-foreground">
                                                Resumos automáticos de conversas
                                            </p>
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

                    {/* Integrations */}
                    <TabsContent value="integrations" className="space-y-6">
                        <Card variant="glass">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="w-5 h-5 text-primary" />
                                    Integrações CRM
                                </CardTitle>
                                <CardDescription>Conecte seu CRM para sincronização automática</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                                <Button variant="ghost" size="sm" onClick={() => handleDisconnect(crm.id)}>
                                                    Desconectar
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => handleConnect(crm.id)}>
                                                    Conectar
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Profile */}
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Perfil do Usuário
                                </CardTitle>
                                <CardDescription>Gerencie suas informações pessoais</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Configurações de perfil em desenvolvimento...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Methodology */}
                    <TabsContent value="methodology">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    Metodologia de Vendas
                                </CardTitle>
                                <CardDescription>Configure os scripts e metodologias para sua IA</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Configurações de metodologia em desenvolvimento...
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    Notificações
                                </CardTitle>
                                <CardDescription>Gerencie alertas e lembretes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Configurações de notificações em desenvolvimento...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
