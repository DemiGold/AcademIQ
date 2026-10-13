import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Loader2, Clock, FileText, Play, Trophy, Lock } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useCourses } from "../../hooks/useCourses";
import { useQuestions } from "../../hooks/useQuestions";
import { useQuizStore } from "../../stores/quizStore";
import { isPremium } from "../../lib/utils";
import Button from "../../components/ui/Button";

const QUESTION_COUNTS = [
  { label: "10 questions", value: 10 },
  { label: "20 questions", value: 20 },
  { label: "50 questions", value: 50 },
  { label: "All available", value: 0 },
];

export default function CourseDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const startQuiz = useQuizStore((s) => s.startQuiz);

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const course = useMemo(
    () => courses?.find((c) => c.code === code),
    [courses, code]
  );

  const [topicId, setTopicId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(10);

  const { data: questions, isLoading: loadingQuestions } = useQuestions(
    course?.id,
    topicId || null
  );

  const premium = isPremium(profile);

  // Derive unique topics from loaded questions
  const topics = useMemo(() => {
    if (!questions) return [];
    const map = new Map<string, string>();
    for (const q of questions) {
      if (q.topic_id && q.topic_name && !map.has(q.topic_id)) {
        map.set(q.topic_id, q.topic_name);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [questions]);

  const availableCount = questions?.length ?? 0;
  const effectiveCount =
    questionCount === 0
      ? availableCount
      : Math.min(questionCount, availableCount);

  const handleStart = () => {
    if (!course || !questions || questions.length === 0) return;

    // Shuffle questions and take the count we need
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selected = questionCount === 0 ? shuffled : shuffled.slice(0, questionCount);

    const duration = Math.max(60, selected.length * 60); // 60s per question, min 60

    const topicName =
      topicId && topics.length > 0
        ? topics.find((t) => t.id === topicId)?.name ?? null
        : null;

    startQuiz({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      topicId: topicId || null,
      topicName,
      questions: selected,
      startedAt: Date.now(),
      durationSeconds: duration,
    });

    navigate(`/quiz/${course.code}`);
  };

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-lg font-bold text-text-primary mb-2">
          Course not found
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          "{code}" doesn't exist or isn't available for your faculty.
        </p>
        <Link to="/dashboard">
          <Button variant="secondary" size="lg">
            <ArrowLeft size={16} /> Back to dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Course header */}
      <div className="rounded-2xl border border-bg-border bg-bg-secondary p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <BookOpen size={22} className="text-brand-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              {course.code}
            </h1>
            <p className="text-sm text-text-secondary mt-1">{course.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-bg-border">
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Available
            </div>
            <div className="text-lg font-bold text-text-primary mt-0.5">
              {loadingQuestions ? "…" : availableCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              {premium ? "Total" : "Locked"}
            </div>
            <div className="text-lg font-bold text-text-primary mt-0.5">
              {loadingQuestions ? "…" : premium ? availableCount : course.total_questions - availableCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Time
            </div>
            <div className="text-lg font-bold text-text-primary mt-0.5 flex items-center gap-1">
              <Clock size={14} />
              {Math.round((effectiveCount * 60) / 60)}m
            </div>
          </div>
        </div>
      </div>

      {/* If not premium — soft upsell */}
      {!premium && course.total_questions > availableCount && (
        <div className="rounded-xl border border-brand-warning/30 bg-brand-warning/5 p-4 flex items-start gap-3">
          <Lock size={18} className="text-brand-warning shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <strong className="text-text-primary">
              {course.total_questions - availableCount} questions locked.
            </strong>{" "}
            Unlock everything on the dashboard.
          </div>
        </div>
      )}

      {/* Setup */}
      <div className="rounded-2xl border border-bg-border bg-bg-secondary p-5 sm:p-6 space-y-5">
        <h2 className="text-base font-bold text-text-primary">
          Configure your session
        </h2>

        {/* Topic filter */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Topic
          </label>
          <div className="flex flex-wrap gap-2">
            {/* "All Topics" Pill */}
            <button
              type="button"
              onClick={() => setTopicId("")}
              disabled={loadingQuestions}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${
                topicId === ""
                  ? "bg-brand-primary border-brand-primary text-white shadow-sm"
                  : "bg-bg-secondary border-bg-border text-text-secondary hover:border-brand-primary/50 hover:text-text-primary"
              } disabled:opacity-50`}
            >
              All Topics
            </button>

            {/* Individual Topic Pills */}
            {topics.map((t) => {
              const isActive = topicId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopicId(t.id)}
                  disabled={loadingQuestions}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${
                    isActive
                      ? "bg-brand-primary border-brand-primary text-white shadow-sm"
                      : "bg-bg-secondary border-bg-border text-text-secondary hover:border-brand-primary/50 hover:text-text-primary"
                  } disabled:opacity-50`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          {loadingQuestions && (
            <p className="text-xs text-text-muted mt-2">Loading topics...</p>
          )}
        </div>

        {/* Question count */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Number of questions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_COUNTS.map((opt) => {
              const active = questionCount === opt.value;
              const disabled = availableCount > 0 && opt.value > availableCount;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuestionCount(opt.value)}
                  disabled={disabled}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-semibold transition min-h-[44px] ${
                    active
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-bg-border bg-bg-secondary text-text-secondary hover:border-brand-primary/40"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-bg-tertiary p-3 text-xs text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText size={14} />
            <strong className="text-text-primary">{effectiveCount}</strong>{" "}
            questions selected
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy size={14} />
            ~{Math.round((effectiveCount * 60) / 60)} min
          </span>
        </div>

        <Button
          size="lg"
          fullWidth
          onClick={handleStart}
          disabled={loadingQuestions || availableCount === 0}
          loading={loadingQuestions}
        >
          {!loadingQuestions && <Play size={16} />}
          Start Quiz
        </Button>

        {!loadingQuestions && availableCount === 0 && (
          <p className="text-xs text-brand-warning text-center">
            No questions available for this selection.
          </p>
        )}
      </div>
    </div>
  );
}