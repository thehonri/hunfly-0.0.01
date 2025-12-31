import { motion } from "framer-motion";
import { 
  Video, 
  Mic, 
  MicOff,
  VideoOff,
  Phone,
  MessageSquare,
  Users,
  Brain,
  Lightbulb,
  AlertCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const aiSuggestions = [
  { type: "question", text: "Pergunte sobre o orçamento disponível para este projeto", priority: "high" },
  { type: "tip", text: "O lead mencionou 'prazo apertado' - explore esta dor", priority: "medium" },
  { type: "alert", text: "Você está falando 65% do tempo - tente escutar mais", priority: "high" },
];

const MeetingRoom = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [meetingTime, setMeetingTime] = useState("12:45");

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-7rem)] flex gap-6">
        {/* Main Video Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col"
        >
          {/* Video Container */}
          <Card variant="glass" className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-4xl font-bold mx-auto mb-4">
                  MS
                </div>
                <p className="text-xl font-display font-semibold">Maria Santos</p>
                <p className="text-muted-foreground">TechCorp Solutions</p>
              </div>
            </div>
            
            {/* Self View */}
            <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg bg-gradient-to-br from-card to-secondary border border-border overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold">
                  JD
                </div>
              </div>
            </div>
            
            {/* Meeting Info */}
            <div className="absolute top-4 left-4 flex items-center gap-4">
              <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/50">
                <span className="w-2 h-2 bg-destructive rounded-full mr-2 animate-pulse" />
                AO VIVO
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {meetingTime}
              </div>
            </div>
            
            {/* Participants */}
            <div className="absolute top-4 right-4">
              <Button variant="glass" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                2 participantes
              </Button>
            </div>
          </Card>
          
          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button 
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            
            <Button 
              variant={isVideoOn ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            
            <Button 
              variant="destructive"
              size="lg"
              className="rounded-full px-8"
            >
              <Phone className="w-6 h-6 mr-2 rotate-[135deg]" />
              Encerrar
            </Button>
            
            <Button 
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
          </div>
        </motion.div>
        
        {/* AI Assistant Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-96 flex flex-col gap-4"
        >
          {/* AI Header */}
          <Card variant="gradient" className="border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-semibold">Assistente IA</p>
                  <p className="text-xs text-muted-foreground">Analisando conversa em tempo real</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Live Stats */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Métricas ao Vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Seu tempo de fala</span>
                  <span className="text-warning">65%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-warning rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Engajamento do lead</span>
                  <span className="text-success">Alto</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-[80%] bg-success rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Suggestions */}
          <Card variant="glass" className="flex-1 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                Sugestões em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto max-h-80">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className={`p-3 rounded-lg ${
                    suggestion.priority === 'high' 
                      ? 'bg-warning/10 border border-warning/30' 
                      : 'bg-secondary/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {suggestion.type === 'question' && (
                      <MessageSquare className="w-4 h-4 text-primary mt-0.5" />
                    )}
                    {suggestion.type === 'tip' && (
                      <Lightbulb className="w-4 h-4 text-warning mt-0.5" />
                    )}
                    {suggestion.type === 'alert' && (
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    )}
                    <p className="text-sm">{suggestion.text}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Anotações
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Brain className="w-4 h-4" />
              Resumo IA
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default MeetingRoom;
