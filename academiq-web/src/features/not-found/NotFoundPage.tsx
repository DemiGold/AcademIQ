import { Link } from "react-router-dom";
import { Compass, Home, BookOpen } from "lucide-react";
import Button from "../../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-6">
          <Compass size={36} className="text-text-muted" />
        </div>
        <div className="text-5xl sm:text-6xl font-black text-text-primary leading-none mb-3">
          404
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
          Page not found
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
          This page may have been moved, removed, or never existed. Let's get
          you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" fullWidth className="sm:min-w-[160px]">
              <Home size={16} />
              Dashboard
            </Button>
          </Link>
          <Link to="/courses" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              className="sm:min-w-[160px]"
            >
              <BookOpen size={16} />
              Browse courses
            </Button>
          </Link>
        </div>
        <p className="text-xs text-text-muted mt-8">
          Or{" "}
          <Link
            to="/"
            className="font-semibold text-brand-primary hover:underline"
          >
            go to the homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
