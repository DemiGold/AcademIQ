import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Button from "./Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log this to an error reporting service like Sentry later
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-brand-danger/10 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-brand-danger" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              We hit an unexpected error while trying to load this page. Refreshing usually fixes it.
            </p>
            <Button
              size="lg"
              fullWidth
              onClick={() => window.location.reload()}
            >
              <RotateCcw size={16} />
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}