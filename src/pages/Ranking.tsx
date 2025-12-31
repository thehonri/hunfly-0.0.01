import { motion } from "framer-motion";
import { 
  Trophy, 
  TrendingUp, 
  Medal,
  Target,
  Video,
  Star,
  Crown,
  Flame
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const rankingData = [
  { 
    position: 1, 
    name: "Ana Costa", 
    avatar: "AC",
    meetings: 32, 
    conversion: 42,
    streak: 12,
    change: "up"
  },
  { 
    position: 2, 
    name: "Carlos Mendes", 
    avatar: "CM",
    meetings: 28, 
    conversion: 38,
    streak: 8,
    change: "up"
  },
  { 
    position: 3, 
    name: "João Davi", 
    avatar: "JD",
    meetings: 24, 
    conversion: 32,
    streak: 5,
    change: "up",
    isCurrentUser: true
  },
  { 
    position: 4, 
    name: "Maria Santos", 
    avatar: "MS",
    meetings: 22, 
    conversion: 30,
    streak: 3,
    change: "down"
  },
  { 
    position: 5, 
    name: "Pedro Lima", 
    avatar: "PL",
    meetings: 20, 
    conversion: 28,
    streak: 2,
    change: "same"
  },
];

const achievements = [
  { icon: Crown, title: "Rei das Vendas", description: "Maior conversão do mês", unlocked: true },
  { icon: Flame, title: "Em Chamas", description: "10 reuniões seguidas com sucesso", unlocked: true },
  { icon: Star, title: "Estrela Nascente", description: "Maior evolução do trimestre", unlocked: false },
  { icon: Target, title: "Atirador Certeiro", description: "Taxa de conversão acima de 50%", unlocked: false },
];

const Ranking = () => {
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
            <h1 className="text-3xl font-display font-bold">Ranking do Time</h1>
            <p className="text-muted-foreground mt-1">Acompanhe sua posição e conquiste novos recordes</p>
          </div>
        </motion.div>
        
        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center items-end gap-4 pt-8"
        >
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-2xl font-bold mb-2 ring-4 ring-gray-500/30">
              {rankingData[1].avatar}
            </div>
            <p className="font-display font-semibold">{rankingData[1].name}</p>
            <p className="text-sm text-muted-foreground">{rankingData[1].conversion}% conversão</p>
            <div className="mt-2 w-24 h-24 bg-gradient-to-t from-gray-500/20 to-transparent rounded-t-lg flex items-end justify-center pb-2">
              <Medal className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Crown className="w-8 h-8 text-yellow-500 absolute -top-8 left-1/2 -translate-x-1/2" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-bold mb-2 ring-4 ring-yellow-500/30 glow">
                {rankingData[0].avatar}
              </div>
            </div>
            <p className="font-display font-semibold text-lg">{rankingData[0].name}</p>
            <p className="text-sm text-muted-foreground">{rankingData[0].conversion}% conversão</p>
            <div className="mt-2 w-28 h-32 bg-gradient-to-t from-yellow-500/20 to-transparent rounded-t-lg flex items-end justify-center pb-2">
              <Trophy className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
          
          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-2xl font-bold mb-2 ring-4 ring-amber-600/30">
              {rankingData[2].avatar}
            </div>
            <p className="font-display font-semibold">{rankingData[2].name}</p>
            <Badge variant="outline" className="text-primary border-primary mt-1">Você</Badge>
            <p className="text-sm text-muted-foreground">{rankingData[2].conversion}% conversão</p>
            <div className="mt-2 w-24 h-20 bg-gradient-to-t from-amber-700/20 to-transparent rounded-t-lg flex items-end justify-center pb-2">
              <Medal className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </motion.div>
        
        {/* Full Ranking List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rankingData.map((user, index) => (
                  <motion.div
                    key={user.position}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      user.isCurrentUser 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className="w-8 text-center font-display font-bold text-lg">
                      {user.position <= 3 ? (
                        <span className={
                          user.position === 1 ? "text-yellow-500" :
                          user.position === 2 ? "text-gray-400" :
                          "text-amber-600"
                        }>
                          #{user.position}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">#{user.position}</span>
                      )}
                    </div>
                    
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      user.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      user.position === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                      user.position === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                      'bg-secondary'
                    }`}>
                      {user.avatar}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {user.isCurrentUser && (
                          <Badge variant="outline" className="text-primary border-primary text-xs">Você</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {user.meetings} reuniões
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {user.conversion}% conversão
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-warning" />
                          {user.streak} dias
                        </span>
                      </div>
                    </div>
                    
                    <TrendingUp className={`w-5 h-5 ${
                      user.change === 'up' ? 'text-success' :
                      user.change === 'down' ? 'text-destructive rotate-180' :
                      'text-muted-foreground'
                    }`} />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg text-center transition-all ${
                      achievement.unlocked 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-secondary/50 opacity-50'
                    }`}
                  >
                    <achievement.icon className={`w-8 h-8 mx-auto mb-2 ${
                      achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="font-display font-semibold text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Ranking;
