import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // If the error is a 401 from API, clear storage and redirect
    if ((error as any)?.status === 401 || (error as any)?.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please try again or return to the dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                data-testid="button-reload"
              >
                Reload Page
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                data-testid="button-home"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
