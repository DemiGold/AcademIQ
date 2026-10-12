import { Link } from "react-router-dom";
import {
  GraduationCap,
  Sparkles,
  Trophy,
  Zap,
  Calculator,
  BookOpen,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import Button from "../../components/ui/Button";

const WHATSAPP_NUMBER = "234707852616";
const WHATSAPP_MESSAGE = "Hi! I have a question about AcademIQ.";

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 sm:pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/5 text-brand-primary text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles size={12} />
            Built for UNILAG students
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-text-primary leading-[1.1] tracking-tight">
            Master your
            <br />
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              exams smarter.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary mt-5 leading-relaxed">
            Practice real past questions in a real CBT environment. Track your
            progress, learn from detailed explanations, and walk into the exam
            hall prepared.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" fullWidth className="sm:min-w-[200px]">
                Start practicing
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/cgpa" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                className="sm:min-w-[200px]"
              >
                <Calculator size={16} />
                Try CGPA Calculator
              </Button>
            </Link>
          </div>

          <p className="text-xs text-text-muted mt-4">
            Free to start. No credit card. Works on any device.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-bg-border bg-bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Why students pick AcademIQ
            </h2>
            <p className="text-sm sm:text-base text-text-secondary mt-2 max-w-xl mx-auto">
              Everything you need to prepare, in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <FeatureCard
              icon={BookOpen}
              title="Real past questions"
              description="Curated UNILAG past questions, organized by course and topic. No filler, no fluff."
              tone="brand"
            />
            <FeatureCard
              icon={Trophy}
              title="Real CBT experience"
              description="Timed sessions, question navigation, and immediate scoring — same feel as the exam hall."
              tone="success"
            />
            <FeatureCard
              icon={Zap}
              title="Detailed explanations"
              description="Every question comes with a clear explanation, so you learn while you practice."
              tone="warning"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-bg-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
            <Step number={1} title="Sign up free" description="Create an account in under a minute. Get 10 free questions per course." />
            <Step number={2} title="Practice" description="Pick a course, choose a topic, and start a timed CBT session." />
            <Step number={3} title="Unlock everything" description="Get a token to unlock all questions in every course for 30 days." />
          </div>
        </div>
      </section>

      {/* CGPA teaser */}
      <section className="border-t border-bg-border bg-bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto rounded-2xl border border-bg-border bg-bg-secondary p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary mb-4">
              <Calculator size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
              Free CGPA Calculator
            </h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto mb-6">
              No signup needed. Enter your courses, units, and grades to see your
              CGPA and class of degree instantly.
            </p>
            <Link to="/cgpa">
              <Button size="lg">
                Open Calculator
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-bg-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white mb-4">
              <GraduationCap size={26} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
              Ready to ace your exams?
            </h2>
            <p className="text-sm sm:text-base text-text-secondary mb-6 max-w-md mx-auto">
              Join hundreds of UNILAG students practicing smarter.
            </p>
            <Link to="/register">
              <Button size="lg" className="sm:min-w-[220px]">
                Get started for free
                <ArrowRight size={16} />
              </Button>
            </Link>
            <p className="text-xs text-text-muted mt-5">
              Questions?{" "}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline"
              >
                <MessageCircle size={12} />
                Chat on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  tone: "brand" | "success" | "warning";
}) {
  const tones = {
    brand: "bg-brand-primary/10 text-brand-primary",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-brand-warning/10 text-brand-warning",
  };

  return (
    <div className="rounded-2xl border border-bg-border bg-bg-secondary p-5 sm:p-6 hover:border-brand-primary/30 transition">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${tones[tone]}`}
      >
        <Icon size={20} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-11 h-11 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center mx-auto mb-3">
        {number}
      </div>
      <h3 className="text-base font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
