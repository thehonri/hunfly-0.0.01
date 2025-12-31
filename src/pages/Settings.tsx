import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  User,
  Bell,
  Shield,
  Palette,
  MessageSquare,
  Save,
  BookOpen
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
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
        
        {/* Profile Settings */}
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl font-bold">
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
          transition={{ delay: 0.2 }}
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
        
        {/* AI Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
          transition={{ delay: 0.4 }}
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
