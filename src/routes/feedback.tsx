import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquareHeart, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Kritik & Saran — Juragan Geprek" },
      { name: "description", content: "Kirim kritik, saran, dan masukan untuk membantu kami melayani lebih baik." },
    ],
  }),
  component: FeedbackPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  email: z.string().trim().email("Email tidak valid").max(255).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(5, "Pesan minimal 5 karakter").max(2000),
});

function FeedbackPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, rating, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email || null,
      rating: parsed.data.rating,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Gagal mengirim: " + error.message);
      return;
    }
    toast.success("Terima kasih atas masukanmu! 🙌");
    setName("");
    setMessage("");
    setRating(5);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
          <MessageSquareHeart className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">Kritik & Saran</h1>
        <p className="mt-2 text-muted-foreground">
          Masukanmu sangat berarti untuk kami terus berbenah. 🙏
        </p>
      </div>

      <Card className="p-6 shadow-soft">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="email">Email (opsional)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" maxLength={255} />
          </div>
          <div>
            <Label>Rating Pengalaman</Label>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${n} bintang`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      n <= (hoverRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
            </div>
          </div>
          <div>
            <Label htmlFor="message">Kritik / Saran</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis masukan, kritik, atau saranmu di sini..."
              rows={6}
              maxLength={2000}
              required
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">{message.length}/2000</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Kembali</Link>
            <Button type="submit" disabled={submitting} className="bg-gradient-warm text-primary-foreground shadow-warm">
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Mengirim..." : "Kirim Masukan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
