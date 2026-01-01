import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WhatsAppConnect = () => {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time QR Code updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/whatsapp`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
      setIsLoading(false);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "qr") {
        setQrCode(data.qr);
        setError("");
      } else if (data.type === "authenticated") {
        setIsConnected(true);
        setTimeout(() => {
          navigate("/whatsapp");
        }, 2000);
      } else if (data.type === "error") {
        setError(data.message);
      }
    };

    websocket.onerror = () => {
      setError("Erro ao conectar ao servidor. Tente novamente.");
      setIsLoading(false);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      websocket.close();
    };
  }, [navigate]);

  const handleDisconnect = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "disconnect" }));
    }
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
                  Carregando QR Code...
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
                    Configurações → Dispositivos Vinculados → Vincular um Dispositivo
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="w-full"
                >
                  Desconectar
                </Button>
              </motion.div>
            ) : null}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sua conexão é segura e privada. Nenhum dado é armazenado em nossos servidores.
        </p>
      </motion.div>
    </div>
  );
};

export default WhatsAppConnect;
