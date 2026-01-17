import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

const WhatsAppConnect = () => {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
          setError("Sessão expirada. Faça login novamente.");
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/whatsapp/qr`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Falha ao buscar status");
        }

        const data = await res.json();

        if (data.connected) {
          setIsConnected(true);
          setIsLoading(false);
          // Redireciona após 2 segundos se conectado
          setTimeout(() => navigate("/whatsapp"), 2000);
        } else if (data.qr) {
          setQrCode(data.qr);
          setIsLoading(false);
          setError("");
        } else {
          // QR ainda não gerado, aguardando...
          // Pode acionar init se necessário, mas backend deve fazer isso.
          setIsLoading(true);

          // Opcional: Tentar inicializar se demorar muito
          if (data.hint) {
            // Força init se backend pedir
            await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/whatsapp/init`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` }
            });
          }
        }
      } catch (err) {
        console.error(err);
        // Não mostra erro visualmente para não piscar, só loga
      }
    };

    // Check immediately
    checkStatus();
    // Poll every 2 seconds
    intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleDisconnect = async () => {
    // Apenas limpa estado local, desconexão real seria via endpoint de logout
    setQrCode("");
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Conectar WhatsApp</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Escaneie o código QR com seu telefone para conectar
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Buscando QR Code...
                </p>
              </div>
            ) : isConnected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <CheckCircle2 className="w-12 h-12 text-success" />
                <div className="text-center">
                  <p className="font-semibold text-success">
                    Conectado com sucesso!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Redirecionando para conversas...
                  </p>
                </div>
              </motion.div>
            ) : qrCode ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">
                    Abra o WhatsApp no seu telefone
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Menu (3 pontos) → Aparelhos conectados → Conectar aparelho
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </motion.div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Tentando iniciar sessão...
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sua conexão é segura e privada.
        </p>
      </motion.div>
    </div>
  );
};

export default WhatsAppConnect;
