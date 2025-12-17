import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { socialService, PublicProfile, Connection, SocialPost } from '@/lib/firebase/social';
import { userStatsService } from '@/lib/firebase/userStats';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  UserPlus, 
  Trophy, 
  Flame, 
  Target, 
  Heart, 
  MessageCircle,
  Crown,
  Medal,
  Zap,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

export function SocialSection() {
  const { user, userId } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [connections, setConnections] = useState<{ connection: Connection; profile: PublicProfile }[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ connection: Connection; profile: PublicProfile }[]>([]);
  const [leaderboard, setLeaderboard] = useState<PublicProfile[]>([]);
  const [feed, setFeed] = useState<(SocialPost & { profile: PublicProfile })[]>([]);
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Sincroniza perfil com stats atuais
      const stats = await userStatsService.getOrCreate(userId);
      await socialService.syncProfileWithStats(
        userId, 
        stats, 
        user?.displayName || 'Usuário',
        user?.photoURL || ''
      );

      const [profile, conns, pending, leaders, feedData] = await Promise.all([
        socialService.getProfile(userId),
        socialService.getConnections(userId),
        socialService.getPendingRequests(userId),
        socialService.getLeaderboard(10),
        socialService.getFeed(userId),
      ]);

      setMyProfile(profile);
      setConnections(conns);
      setPendingRequests(pending);
      setLeaderboard(leaders);
      setFeed(feedData);
    } catch (error) {
      console.error('Erro ao carregar dados sociais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const results = await socialService.searchProfiles(searchTerm);
      // Remove o próprio usuário dos resultados
      setSearchResults(results.filter(p => p.id !== userId));
    } catch (error) {
      toast.error('Erro ao buscar usuários');
    }
  };

  const handleSendRequest = async (toUserId: string) => {
    try {
      const myName = user?.displayName || 'Usuário';
      await socialService.sendConnectionRequest(userId, toUserId, myName);
      toast.success('Solicitação enviada!');
      setSearchResults(prev => prev.filter(p => p.id !== toUserId));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar solicitação');
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const myName = user?.displayName || 'Usuário';
      await socialService.acceptConnection(connectionId, myName);
      toast.success('Conexão aceita!');
      loadData();
    } catch (error) {
      toast.error('Erro ao aceitar conexão');
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      await socialService.rejectConnection(connectionId);
      setPendingRequests(prev => prev.filter(p => p.connection.id !== connectionId));
    } catch (error) {
      toast.error('Erro ao rejeitar');
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await socialService.unlikePost(postId, userId);
      } else {
        await socialService.likePost(postId, userId);
      }
      // Atualiza feed localmente
      setFeed(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked 
              ? p.likes.filter(id => id !== userId)
              : [...p.likes, userId]
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Comunidade
          </h1>
          <p className="text-muted-foreground mt-1">
            Conecte-se, compare e evolua junto com outros usuários
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Meu Card de Perfil */}
      {myProfile && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-primary shrink-0">
                  <AvatarImage src={myProfile.photoURL} />
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {myProfile.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg truncate">{myProfile.displayName}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                      Nível {myProfile.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                      {myProfile.currentStreak} dias
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                      {myProfile.totalHabitsCompleted} hábitos
                    </span>
                  </div>
                </div>
                {myProfile.recentBadges.length > 0 && (
                  <div className="flex gap-1 shrink-0">
                    {myProfile.recentBadges.slice(0, 3).map(badge => (
                      <div key={badge.id} className="text-lg sm:text-2xl" title={badge.name}>
                        {badge.icon}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Solicitações Pendentes */}
      {pendingRequests.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                Solicitações Pendentes ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingRequests.map(({ connection, profile }) => (
                <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg bg-background">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.photoURL} />
                    <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground">Nível {profile.level}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAcceptRequest(connection.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRejectRequest(connection.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="friends">Amigos ({connections.length})</TabsTrigger>
            <TabsTrigger value="search">Buscar</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          {/* Feed */}
          <TabsContent value="feed" className="space-y-4 mt-4">
            {feed.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhuma atividade no feed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte-se com outros usuários para ver suas conquistas!
                </p>
              </Card>
            ) : (
              feed.map(post => {
                const isLiked = post.likes.includes(userId);
                return (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={post.profile.photoURL} />
                          <AvatarFallback>{post.profile.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.profile.displayName}</span>
                            <Badge variant="secondary" className="text-xs">
                              Nv. {post.profile.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-3xl">{post.icon}</span>
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-sm text-muted-foreground">{post.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn(isLiked && "text-red-500")}
                              onClick={() => handleLikePost(post.id, isLiked)}
                            >
                              <Heart className={cn("w-4 h-4 mr-1", isLiked && "fill-current")} />
                              {post.likes.length}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Amigos */}
          <TabsContent value="friends" className="space-y-3 mt-4">
            {connections.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Você ainda não tem conexões</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Busque por outros usuários e envie solicitações!
                </p>
              </Card>
            ) : (
              connections.map(({ connection, profile }) => (
                <Card key={connection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={profile.photoURL} />
                        <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{profile.displayName}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Nv. {profile.level}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {profile.currentStreak} dias
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" /> {profile.totalHabitsCompleted}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {profile.recentBadges.slice(0, 3).map(b => (
                          <span key={b.id} className="text-xl" title={b.name}>{b.icon}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Buscar */}
          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(profile => {
                  const isConnected = connections.some(c => 
                    c.profile.id === profile.id
                  );
                  
                  return (
                    <Card key={profile.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={profile.photoURL} />
                            <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{profile.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              Nível {profile.level} • {profile.totalHabitsCompleted} hábitos
                            </p>
                          </div>
                          {!isConnected && (
                            <Button size="sm" onClick={() => handleSendRequest(profile.id)}>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Conectar
                            </Button>
                          )}
                          {isConnected && (
                            <Badge variant="secondary">Conectado</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Ranking */}
          <TabsContent value="ranking" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Top 10 - Ranking Global
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaderboard.map((profile, index) => {
                  const isMe = profile.id === userId;
                  const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
                  
                  return (
                    <div 
                      key={profile.id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg transition-colors",
                        isMe ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                        index < 3 ? medalColors[index] : "text-muted-foreground"
                      )}>
                        {index < 3 ? <Medal className="w-6 h-6" /> : index + 1}
                      </div>
                      <Avatar>
                        <AvatarImage src={profile.photoURL} />
                        <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {profile.displayName}
                          {isMe && <span className="text-xs text-primary ml-2">(você)</span>}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{profile.totalXP.toLocaleString()} XP</span>
                          <span>{profile.currentStreak} dias</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-bold">
                        Nv. {profile.level}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
