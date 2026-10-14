import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Key,
  CheckCircle2,
  AlertCircle,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { redeemToken } from "../../../services/tokenService";
import { useAuthStore } from "../../../stores/authStore";
import {
  WHATSAPP_NUMBER,
  WHATSAPP_TOKEN_MESSAGE,
} from "../../../lib/constants";
import Button from "../../../components/ui/Button";

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_TOKEN_MESSAGE
)}`;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PremiumBanner() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [showRedeem, setShowRedeem] = useState(false);

  const expiry = profile?.premium_expires_at ?? null;
  const isActive = expiry ? new Date(expiry) > new Date() : false;
  const hasExpired = !!expiry && !isActive;

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

  // ============================================================
  // STATE 3: Active premium (compact card + extend option)
  // ============================================================
  if (isActive && expiry) {
    return (
      <div className="rounded-2xl border border-brand-success/30 bg-brand-success/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-success/15 flex items-center justify-center shrink-0">
            <Crown size={20} className="text-brand-success" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                Premium active
              </h2>
              <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-success/15 text-brand-success">
                Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
              Full access until{" "}
              <strong className="text-text-primary">{formatDate(expiry)}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRedeem((v) => !v)}
          className="mt-4 w-full text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition py-2.5 rounded-lg border border-bg-border hover:border-brand-primary/30"
        >
          {showRedeem ? "Hide options" : "Extend premium"}
        </button>

        {showRedeem && (
          <div className="mt-4 pt-4 border-t border-bg-border space-y-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] text-white font-semibold py-3 px-4 hover:opacity-95 transition min-h-[48px]"
            >
              <MessageCircle size={18} />
              Get a new token on WhatsApp
            </a>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Or redeem a code
              </span>
              <div className="flex-1 h-px bg-bg-border" />
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2"
            >
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

            {feedback && <FeedbackBanner feedback={feedback} />}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // STATES 1 & 2: Free (never had) or Expired
  // ============================================================
  const headerTitle = hasExpired
    ? "Your premium has expired"
    : "Unlock all questions";

  const headerSubtitle = hasExpired
    ? `Your access ended on ${formatDate(expiry!)}. Get a new token to unlock everything again.`
    : "You are on the free plan. Get a token on WhatsApp to unlock every question in every course for 30 days.";

  const ctaLabel = hasExpired ? "Renew on WhatsApp" : "Get a token on WhatsApp";
  const cardBorder = hasExpired
    ? "border-brand-warning/40"
    : "border-bg-border";
  const gradientFrom = hasExpired ? "from-brand-warning/10" : "from-brand-primary/10";
  const iconBg = hasExpired ? "bg-brand-warning/15" : "bg-brand-primary/15";
  const iconColor = hasExpired ? "text-brand-warning" : "text-brand-primary";

  return (
    <div
      className={`rounded-2xl border ${cardBorder} bg-gradient-to-br ${gradientFrom} via-bg-secondary to-bg-secondary p-5 sm:p-6`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
        >
          {hasExpired ? (
            <AlertTriangle size={20} className={iconColor} />
          ) : (
            <Crown size={20} className={iconColor} />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-text-primary">
            {headerTitle}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
            {headerSubtitle}
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
        {ctaLabel}
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

      {feedback && <FeedbackBanner feedback={feedback} />}
    </div>
  );
}

function FeedbackBanner({
  feedback,
}: {
  feedback: { type: "success" | "error"; text: string };
}) {
  return (
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
  );
}
