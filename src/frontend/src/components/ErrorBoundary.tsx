import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import type React from "react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    console.error("🚨 ErrorBoundary: Caught error in getDerivedStateFromError");
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging with context
    console.error("🚨 ErrorBoundary: Component error caught");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Component stack:", errorInfo.componentStack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Timestamp:", new Date().toISOString());
    console.error("User agent:", navigator.userAgent);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    this.setState({
      error,
      errorInfo,
    });

    // Log to external error tracking service if available
    if (typeof window !== "undefined" && (window as any).errorTracker) {
      try {
        (window as any).errorTracker.logError(error, errorInfo);
      } catch (trackingError) {
        console.error(
          "Failed to log error to tracking service:",
          trackingError,
        );
      }
    }
  }

  handleReset = () => {
    console.log("🔄 ErrorBoundary: Resetting error state and reloading page");
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      showDetails: false,
    });
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails } = this.state;
      const isDevelopment = process.env.NODE_ENV === "development";

      // Enhanced fallback UI with detailed error context
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl border-destructive/50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-destructive/10 p-3 shrink-0">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>Application Error</CardTitle>
                    <Badge variant="destructive" className="text-xs">
                      {error?.name || "Error"}
                    </Badge>
                  </div>
                  <CardDescription>
                    The application encountered an unexpected error and cannot
                    continue
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Error Message:
                  </p>
                  <p className="text-sm font-mono text-foreground break-words">
                    {error.message || "An unknown error occurred"}
                  </p>
                </div>
              )}

              {/* Error Context */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This error has been logged with detailed context information.
                  You can try refreshing the page to continue using the
                  application.
                </p>
                {isDevelopment && (
                  <p className="text-xs text-muted-foreground italic">
                    Development mode: Check the browser console for detailed
                    error information.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
                {(isDevelopment || errorInfo) && (
                  <Button
                    onClick={this.toggleDetails}
                    variant="outline"
                    className="gap-2"
                  >
                    {showDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show Details
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Detailed Error Information */}
              {showDetails && (
                <div className="space-y-3 pt-4 border-t">
                  {/* Error Stack */}
                  {error?.stack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Error Stack Trace:
                      </p>
                      <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs font-mono max-h-48">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack */}
                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Component Stack:
                      </p>
                      <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs font-mono max-h-48">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  {/* Additional Context */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Additional Context:
                    </p>
                    <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                      <p>
                        <span className="font-medium">Timestamp:</span>{" "}
                        {new Date().toISOString()}
                      </p>
                      <p>
                        <span className="font-medium">User Agent:</span>{" "}
                        {navigator.userAgent}
                      </p>
                      <p>
                        <span className="font-medium">URL:</span>{" "}
                        {window.location.href}
                      </p>
                      <p>
                        <span className="font-medium">Environment:</span>{" "}
                        {process.env.NODE_ENV}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  If this error persists after refreshing, please try:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside mt-2 space-y-1">
                  <li>Clearing your browser cache and cookies</li>
                  <li>Trying a different browser</li>
                  <li>Checking your internet connection</li>
                  <li>Contacting support if the issue continues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
