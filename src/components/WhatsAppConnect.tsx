import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type StatusResp = { connected: boolean; initializing?: boolean };
type QrResp = { connected: boolean; qr: string | null; hint?: string };

export function WhatsAppConnect() {
  const [status, setStatus] = useState<StatusResp>({ connected: false });
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refreshStatus() {
    const s = await apiFetch<StatusResp>("/api/whatsapp/status");
    setStatus(s);
    return s;
  }

  async function refreshQr() {
    const q = await apiFetch<QrResp>("/api/whatsapp/qr");
    setQr(q.qr);
    return q;
  }

  async function initWhatsApp() {
    setErr(null);
    setLoading(true);
    try {
      await apiFetch("/api/whatsapp/init", { method: "POST" });
      await refreshStatus();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function logoutWhatsApp() {
    setErr(null);
    setLoading(true);
    try {
      await apiFetch("/api/whatsapp/logout", { method: "POST" });
      setQr(null);
      await refreshStatus();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let timer: any;

    (async () => {
      try {
        const s = await refreshStatus();
        if (!s.connected) {
          // puxa QR periodicamente até conectar
          timer = setInterval(async () => {
            const st = await refreshStatus();
            if (st.connected) {
              setQr(null);
              clearInterval(timer);
              return;
            }
            await refreshQr();
          }, 1500);
        }
      } catch (e: any) {
        setErr(e.message);
      }
    })();

    return () => timer && clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            status.connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <p className="text-sm">
          {status.connected
            ? "WhatsApp conectado"
            : status.initializing
            ? "Inicializando WhatsApp..."
            : "WhatsApp desconectado"}
        </p>
      </div>

      {!status.connected && (
        <div className="space-y-2">
          <button
            onClick={initWhatsApp}
            disabled={loading}
            className="px-3 py-2 rounded bg-black text-white text-sm"
          >
            {loading ? "Carregando..." : "Gerar QR / Recarregar"}
          </button>

          {qr ? (
            <img
              src={qr}
              alt="QR Code do WhatsApp"
              className="w-64 h-64 border rounded"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              QR ainda não disponível. Aguarde alguns segundos…
            </p>
          )}
        </div>
      )}

      {status.connected && (
        <button
          onClick={logoutWhatsApp}
          disabled={loading}
          className="px-3 py-2 rounded bg-red-600 text-white text-sm"
        >
          {loading ? "Saindo..." : "Desconectar"}
        </button>
      )}

      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}