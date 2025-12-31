import { motion } from "framer-motion";
import { Users, TrendingUp, Video, Target, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const teamMembers = [
  { 
    id: 1, 
    name: "João Davi", 
    role: "Vendedor Sênior",
    avatar: "JD",
    meetings: 24,
    conversion: 32,
    status: "active"
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    role: "Vendedora",
    avatar: "MS",
    meetings: 28,
    conversion: 38,
    status: "active"
  },
  { 
    id: 3, 
    name: "Pedro Lima", 
    role: "Vendedor",
    avatar: "PL",
    meetings: 20,
    conversion: 28,
    status: "active"
  },
  { 
    id: 4, 
    name: "Ana Costa", 
    role: "Vendedora Sênior",
    avatar: "AC",
    meetings: 32,
    conversion: 42,
    status: "active"
  },
];

const Team = () => {
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
            <h1 className="text-3xl font-display font-bold">Time</h1>
            <p className="text-muted-foreground mt-1">Gerencie seu time de vendas</p>
          </div>
          <Button variant="gradient" className="gap-2">
            <Users className="w-4 h-4" />
            Adicionar Membro
          </Button>
        </motion.div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">{teamMembers.length}</p>
                    <p className="text-xs text-muted-foreground">Membros</p>
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
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">104</p>
                    <p className="text-xs text-muted-foreground">Reuniões/mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">35%</p>
                    <p className="text-xs text-muted-foreground">Conversão média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">+12%</p>
                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar membro..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </motion.div>
        
        {/* Team List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Membros do Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center font-semibold text-primary-foreground">
                      {member.avatar}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {member.meetings} reuniões
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {member.conversion}% conversão
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Team;
