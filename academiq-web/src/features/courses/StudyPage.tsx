import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2, Play, ChevronRight, Crown } from "lucide-react";
import { useCourses } from "../../hooks/useCourses";
import { useQuestions } from "../../hooks/useQuestions";
import { fetchTopics } from "../../services/topicService";
import { useQuizStore } from "../../stores/quizStore";
import { useAuthStore } from "../../stores/authStore";
import { isPremium, shuffle } from "../../lib/utils";
import Button from "../../components/ui/Button";

export default function StudyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const startQuiz = useQuizStore((s) => s.startQuiz);
  
  const profile = useAuthStore((s) => s.profile);
  const premium = isPremium(profile);

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const course = useMemo(() => courses?.find((c) => c.code === code), [courses, code]);

  const { data: topics, isLoading: loadingTopics } = useQuery({
    queryKey: ["topics", course?.id],
    queryFn: () => fetchTopics(course!.id),
    enabled: !!course?.id,
  });

  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Auto-select first topic when loaded
  useEffect(() => {
    if (topics && topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  const selectedTopic = topics?.find((t) => t.id === selectedTopicId);

  // Fetch questions for this specific topic to know how many are available for the quiz
  const { data: questions, isLoading: loadingQuestions } = useQuestions(
    course?.id,
    selectedTopicId || null
  );

  const availableQuestions = questions?.length ?? 0;

  const handleStartQuiz = () => {
    if (!course || !questions || questions.length === 0 || !selectedTopic) return;

    // Default to 10 questions, or all available if less than 10
    const count = Math.min(10, questions.length);
    const selected = shuffle(questions).slice(0, count);
    
    // 1 min per question
    const duration = Math.max(60, selected.length * 60);

    startQuiz({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      topicId: selectedTopic.id,
      topicName: selectedTopic.name,
      questions: selected,
      startedAt: Date.now(),
      durationSeconds: duration,
    });

    navigate(`/quiz/${course.code}`);
  };

  if (loadingCourses || loadingTopics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-text-primary mb-2">Course not found</h2>
        <Link to="/courses"><Button variant="secondary">Back to Courses</Button></Link>
      </div>
    );
  }

  // PREMIUM GATE
  if (!premium) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-brand-warning/10 flex items-center justify-center mx-auto mb-5">
          <Crown size={28} className="text-brand-warning" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Premium Feature</h2>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          Study Mode (chapter summaries and targeted quizzes) is exclusive to premium students. Unlock all questions and study notes by redeeming a token on your dashboard.
        </p>
        <Link to="/dashboard">
          <Button size="lg" fullWidth>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to={`/courses/${course.code}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition">
        <ArrowLeft size={16} /> Back to {course.code}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
          <BookOpen size={22} className="text-brand-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            {course.code} Study Mode
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Read the summary notes, then test your knowledge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT: Sidebar with Topics */}
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            Chapters
          </h2>
          {topics?.map((t, index) => {
            const isActive = selectedTopicId === t.id;
            const hasSummary = !!t.summary;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                  isActive
                    ? "bg-brand-primary text-white border-brand-primary shadow-md"
                    : "bg-bg-secondary border-bg-border text-text-primary hover:border-brand-primary/40"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className={`text-xs font-bold ${isActive ? "text-white/60" : "text-text-muted"}`}>
                    {index + 1}.
                  </span>
                  <span className="text-sm font-semibold truncate">{t.name}</span>
                </div>
                {!hasSummary && !isActive && (
                  <span className="text-[10px] text-text-muted italic">No notes</span>
                )}
                {isActive && <ChevronRight size={16} className="text-white/60 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* RIGHT: Summary Content */}
        <div className="md:col-span-2">
          {selectedTopic ? (
            <div className="bg-bg-secondary rounded-2xl border border-bg-border p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-4">{selectedTopic.name}</h2>
                
                {selectedTopic.summary ? (
                  <div className="prose prose-sm sm:prose-base max-w-none text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {selectedTopic.summary}
                  </div>
                ) : (
                  <div className="bg-bg-tertiary rounded-xl p-6 text-center border border-bg-border border-dashed">
                    <p className="text-sm text-text-muted">
                      The admin hasn't added summary notes for this chapter yet.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-bg-border flex flex-col items-center">
                <p className="text-sm text-text-secondary mb-4 text-center">
                  Ready to test your understanding of <strong className="text-text-primary">{selectedTopic.name}</strong>?
                </p>
                <Button
                  size="lg"
                  onClick={handleStartQuiz}
                  disabled={loadingQuestions || availableQuestions === 0}
                  className="w-full sm:w-auto min-w-[240px]"
                >
                  {loadingQuestions ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Play size={18} />
                  )}
                  {availableQuestions > 0 
                    ? `Take Quiz (${Math.min(10, availableQuestions)} questions)` 
                    : "No questions available"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-bg-secondary rounded-2xl border border-bg-border p-8 text-center">
              <p className="text-sm text-text-muted">Select a chapter from the left to begin studying.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
