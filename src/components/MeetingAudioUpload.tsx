import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function MeetingAudioUpload({ meetingId }: { meetingId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function uploadAudio() {
    if (!file) return;

    setBusy(true);
    setMsg(null);

    try {
      const fd = new FormData();
      fd.append("audio", file);

      const resp = await apiFetch<any>(`/api/meetings/${meetingId}/audio`, {
        method: "POST",
        body: fd,
        // importante: no api.ts “produção” ele não força JSON se for FormData
      });

      setMsg(`Upload ok: ${resp.filename} (${Math.round(resp.size / 1024)} KB)`);
    } catch (e: any) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <Button onClick={uploadAudio} disabled={!file || busy}>
        {busy ? "Enviando..." : "Enviar áudio"}
      </Button>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
<MeetingAudioUpload meetingId={meetingId} />
}