import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Key, CheckCircle2, AlertCircle, Crown } from "lucide-react";
import { redeemToken } from "../../../services/tokenService";
import { useAuthStore } from "../../../stores/authStore";
import { WHATSAPP_NUMBER, WHATSAPP_TOKEN_MESSAGE } from "../../../lib/constants";
import Button from "../../../components/ui/Button";

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_TOKEN_MESSAGE
)}`;

export default function PremiumBanner() {
  const queryClient = useQueryClient();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setFeedback(null);

    try {
      const result = await redeemToken(code);
      if (!result.success) {
        setFeedback({ type: "error", text: result.message });
        return;
      }
      setFeedback({
        type: "success",
        text: "Premium unlocked! Refreshing your content...",
      });
      setCode("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["questions"] }),
        queryClient.invalidateQueries({ queryKey: ["student-courses"] }),
      ]);
      await refreshProfile();
    } catch (err) {
      setFeedback({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-bg-border bg-gradient-to-br from-brand-primary/10 via-bg-secondary to-bg-secondary p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-brand-primary/15 flex items-center justify-center shrink-0">
          <Crown size={20} className="text-brand-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-text-primary">
            Unlock all questions
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
            You are on the free plan. Get a token on WhatsApp to unlock every
            question in every course for 30 days.
          </p>
        </div>
      </div>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] text-white font-semibold py-3 px-4 hover:opacity-95 transition min-h-[48px] mb-3"
      >
        <MessageCircle size={18} />
        Get a token on WhatsApp
      </a>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Already have a code?
        </span>
        <div className="flex-1 h-px bg-bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Key
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ACAD-XXXX-XXXX"
            disabled={loading}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-bg-border bg-bg-secondary text-text-primary placeholder:text-text-muted font-mono tracking-wider text-base focus:outline-none focus:ring-2 focus:border-brand-primary focus:ring-brand-primary/20 transition disabled:opacity-60"
          />
        </div>
        <Button
          type="submit"
          size="md"
          loading={loading}
          disabled={loading || !code.trim()}
          className="sm:min-w-[110px]"
        >
          Redeem
        </Button>
      </form>

      {feedback && (
        <div
          className={`mt-3 flex items-start gap-2 text-sm rounded-lg px-4 py-3 ${
            feedback.type === "success"
              ? "bg-brand-success/10 border border-brand-success/30 text-brand-success"
              : "bg-brand-danger/10 border border-brand-danger/30 text-brand-danger"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}
    </div>
  );
}
