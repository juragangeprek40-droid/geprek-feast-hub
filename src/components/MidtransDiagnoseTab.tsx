import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Square } from "lucide-react";
import { toast } from "sonner";

export function MidtransDiagnoseTab() {
  const [log, setLog] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  async function run() {
    if (!log.trim()) return toast.error("Tempel log notifikasi terlebih dahulu.");
    setBusy(true);
    setOut("");
    const ac = new AbortController();
    ctrl.current = ac;
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/midtrans-diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ log }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || j.message || `Gagal (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setOut(text);
      }
      if (!text.trim()) setOut("AI tidak memberikan jawaban.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="font-display text-xl font-bold">Diagnosis Webhook Midtrans (AI)</h2>
        <p className="text-sm text-muted-foreground">
          Tempel log notifikasi dari dashboard Midtrans (body JSON, kode status, pesan error). Server Key otomatis disembunyikan.
        </p>
      </div>
      <Textarea
        rows={10}
        value={log}
        onChange={(e) => setLog(e.target.value)}
        placeholder='{"transaction_status":"settlement","order_id":"...","status_code":"200", ...}  HTTP 401'
        className="font-mono text-xs"
      />
      <div className="flex gap-2">
        <Button onClick={run} disabled={busy} className="gap-2">
          <Sparkles className="h-4 w-4" /> {busy ? "Menganalisis..." : "Diagnosis"}
        </Button>
        {busy && (
          <Button variant="outline" onClick={() => ctrl.current?.abort()} className="gap-2">
            <Square className="h-4 w-4" /> Stop
          </Button>
        )}
      </div>
      {(out || busy) && (
        <div className="whitespace-pre-wrap rounded-md border bg-secondary/40 p-4 text-sm">
          {out || "Menunggu jawaban AI..."}
        </div>
      )}
    </Card>
  );
}
