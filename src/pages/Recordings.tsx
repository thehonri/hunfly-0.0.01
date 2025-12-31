import { motion } from "framer-motion";
import { 
  Play, 
  Calendar, 
  Clock, 
  User, 
  Search,
  Filter,
  Download,
  MessageSquare,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const recordings = [
  {
    id: 1,
    title: "Demo - TechCorp Solutions",
    lead: "Maria Santos",
    date: "28 Dez 2024",
    duration: "45:32",
    conversion: true,
    talkRatio: 42,
    insights: ["Boa escuta ativa", "Perguntas SPIN aplicadas"],
    thumbnail: "bg-gradient-to-br from-primary/20 to-purple-500/20"
  },
  {
    id: 2,
    title: "Discovery - CloudBase Inc",
    lead: "Pedro Lima",
    date: "27 Dez 2024",
    duration: "32:18",
    conversion: false,
    talkRatio: 68,
    insights: ["Falar menos", "Fazer mais perguntas abertas"],
    thumbnail: "bg-gradient-to-br from-warning/20 to-orange-500/20"
  },
  {
    id: 3,
    title: "Fechamento - DataFlow",
    lead: "Ana Costa",
    date: "26 Dez 2024",
    duration: "28:45",
    conversion: true,
    talkRatio: 38,
    insights: ["Excelente negociação", "Timing perfeito de fechamento"],
    thumbnail: "bg-gradient-to-br from-success/20 to-green-500/20"
  },
  {
    id: 4,
    title: "Follow-up - StartupXYZ",
    lead: "Carlos Mendes",
    date: "25 Dez 2024",
    duration: "22:10",
    conversion: false,
    talkRatio: 55,
    insights: ["Abordar objeções melhor", "Foco no valor"],
    thumbnail: "bg-gradient-to-br from-destructive/20 to-red-500/20"
  },
];

const Recordings = () => {
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
            <h1 className="text-3xl font-display font-bold">Reuniões Gravadas</h1>
            <p className="text-muted-foreground mt-1">Revise suas reuniões e acompanhe sua evolução</p>
          </div>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por lead, título..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Período
          </Button>
        </motion.div>
        
        {/* Recordings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recordings.map((recording, index) => (
            <motion.div
              key={recording.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card variant="glass" className="overflow-hidden hover:border-primary/30 transition-all duration-300 group">
                <div className="flex">
                  {/* Thumbnail */}
                  <div className={`w-48 h-48 ${recording.thumbnail} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <Button 
                      variant="glass" 
                      size="icon" 
                      className="w-14 h-14 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100"
                    >
                      <Play className="w-6 h-6 ml-1" />
                    </Button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs glass px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {recording.duration}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display font-semibold text-lg">{recording.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {recording.lead}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {recording.date}
                          </span>
                        </div>
                      </div>
                      <Badge variant={recording.conversion ? "default" : "secondary"} className={recording.conversion ? "bg-success text-success-foreground" : ""}>
                        {recording.conversion ? "Convertido" : "Em progresso"}
                      </Badge>
                    </div>
                    
                    {/* Talk Ratio */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Tempo de fala</span>
                        <span className={recording.talkRatio > 50 ? "text-warning" : "text-success"}>
                          {recording.talkRatio}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${recording.talkRatio > 50 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${recording.talkRatio}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Insights */}
                    <div className="mt-4 space-y-1">
                      {recording.insights.map((insight, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {recording.talkRatio > 50 ? (
                            <AlertCircle className="w-3 h-3 text-warning" />
                          ) : (
                            <TrendingUp className="w-3 h-3 text-success" />
                          )}
                          <span className="text-muted-foreground">{insight}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button variant="secondary" size="sm" className="gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Feedback
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Download className="w-3 h-3" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Recordings;
