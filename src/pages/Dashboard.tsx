import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Video, 
  Target, 
  Clock, 
  Trophy,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Play
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const conversionData = [
  { name: "Seg", value: 24 },
  { name: "Ter", value: 32 },
  { name: "Qua", value: 28 },
  { name: "Qui", value: 35 },
  { name: "Sex", value: 42 },
  { name: "Sáb", value: 38 },
  { name: "Dom", value: 45 },
];

const meetingsData = [
  { name: "Sem 1", reunioes: 12 },
  { name: "Sem 2", reunioes: 18 },
  { name: "Sem 3", reunioes: 15 },
  { name: "Sem 4", reunioes: 22 },
];

const upcomingMeetings = [
  { time: "09:00", title: "Demo - TechCorp", lead: "Maria Santos", type: "discovery" },
  { time: "11:30", title: "Follow-up - CloudBase", lead: "Pedro Lima", type: "closing" },
  { time: "14:00", title: "Apresentação - DataFlow", lead: "Ana Costa", type: "demo" },
];

const pendingActions = [
  { type: "followup", message: "Enviar proposta para TechCorp", priority: "high" },
  { type: "alert", message: "Você falou 68% do tempo na última reunião", priority: "medium" },
  { type: "success", message: "Meta semanal de reuniões atingida!", priority: "low" },
];

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  positive, 
  delay 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  change: string; 
  positive: boolean;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card variant="glass" className="hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-display font-bold">{value}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm ${positive ? 'text-success' : 'text-destructive'}`}>
              {positive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span>{change} vs semana passada</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-display font-bold">Bom dia, João! 👋</h1>
            <p className="text-muted-foreground mt-1">Aqui está o resumo do seu desempenho</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Segunda, 30 de Dezembro</span>
          </div>
        </motion.div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Video} 
            label="Reuniões Realizadas" 
            value="24" 
            change="+12%" 
            positive={true}
            delay={0.1}
          />
          <StatCard 
            icon={Target} 
            label="Taxa de Conversão" 
            value="32%" 
            change="+5%" 
            positive={true}
            delay={0.2}
          />
          <StatCard 
            icon={Clock} 
            label="Tempo de Fala" 
            value="45%" 
            change="-8%" 
            positive={true}
            delay={0.3}
          />
          <StatCard 
            icon={Trophy} 
            label="Posição no Ranking" 
            value="#3" 
            change="+2" 
            positive={true}
            delay={0.4}
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Evolução da Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={conversionData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 10%)', 
                          border: '1px solid hsl(222, 47%, 16%)',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(217, 91%, 60%)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Reuniões por Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={meetingsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(222, 47%, 10%)', 
                          border: '1px solid hsl(222, 47%, 16%)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="reunioes" 
                        stroke="hsl(142, 71%, 45%)" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Meetings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Próximas Reuniões
                  </span>
                  <Button variant="ghost" size="sm">Ver todas</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMeetings.map((meeting, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-primary">{meeting.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground">{meeting.lead}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Pending Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  Ações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingActions.map((action, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    {action.priority === "high" && <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />}
                    {action.priority === "medium" && <AlertCircle className="w-5 h-5 text-warning mt-0.5" />}
                    {action.priority === "low" && <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />}
                    <p className="text-sm">{action.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
