import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface GlobalFallbackUIProps {
  error: Error;
  context: string;
  onRetry?: () => void;
}

export function GlobalFallbackUI({
  error,
  context,
  onRetry,
}: GlobalFallbackUIProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyError = async () => {
    const errorReport = `
Context: ${context}
Error: ${error.name}
Message: ${error.message}
Stack: ${error.stack || "No stack trace available"}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error report:", err);
    }
  };

  const handleRetry = () => {
    console.log("🔄 GlobalFallbackUI: User initiated retry");
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl border-destructive/50 shadow-2xl">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/10 p-3 shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <CardTitle className="text-xl">Application Error</CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {error.name || "Error"}
                </Badge>
              </div>
              <CardDescription className="text-base">{context}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Message */}
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm font-medium text-destructive mb-2">
              Error Message:
            </p>
            <p className="text-sm font-mono text-foreground break-words">
              {error.message || "An unknown error occurred"}
            </p>
          </div>

          {/* User-friendly explanation */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The application encountered an unexpected error and cannot
              continue normally. This error has been logged with detailed
              diagnostic information.
            </p>
            <p className="text-sm font-medium text-foreground">
              What you can do:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>Click "Refresh Page" to restart the application</li>
              <li>Clear your browser cache and cookies</li>
              <li>Try using a different browser</li>
              <li>Check your internet connection</li>
              <li>
                Copy the error details and contact support if the issue persists
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleRetry}
              className="flex-1 gap-2 min-w-[140px]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
            <Button
              onClick={handleCopyError}
              variant="outline"
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Error
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowDetails(!showDetails)}
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
          </div>

          {/* Detailed Error Information */}
          {showDetails && (
            <div className="space-y-3 pt-4 border-t">
              <Separator />

              {/* Error Stack */}
              {error.stack && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Stack Trace:
                  </p>
                  <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs font-mono max-h-48 border">
                    {error.stack}
                  </pre>
                </div>
              )}

              {/* Additional Context */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Diagnostic Information:
                </p>
                <div className="rounded-lg bg-muted p-3 text-xs space-y-1 border">
                  <p>
                    <span className="font-medium">Context:</span> {context}
                  </p>
                  <p>
                    <span className="font-medium">Error Type:</span>{" "}
                    {error.name}
                  </p>
                  <p>
                    <span className="font-medium">Timestamp:</span>{" "}
                    {new Date().toISOString()}
                  </p>
                  <p>
                    <span className="font-medium">URL:</span>{" "}
                    {window.location.href}
                  </p>
                  <p>
                    <span className="font-medium">User Agent:</span>{" "}
                    {navigator.userAgent}
                  </p>
                  <p>
                    <span className="font-medium">Environment:</span>{" "}
                    {process.env.NODE_ENV}
                  </p>
                  <p>
                    <span className="font-medium">Online Status:</span>{" "}
                    {navigator.onLine ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Browser Compatibility Info */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Browser Capabilities:
                </p>
                <div className="rounded-lg bg-muted p-3 text-xs space-y-1 border">
                  <p>
                    <span className="font-medium">localStorage:</span>{" "}
                    {typeof localStorage !== "undefined"
                      ? "✓ Available"
                      : "✗ Not available"}
                  </p>
                  <p>
                    <span className="font-medium">sessionStorage:</span>{" "}
                    {typeof sessionStorage !== "undefined"
                      ? "✓ Available"
                      : "✗ Not available"}
                  </p>
                  <p>
                    <span className="font-medium">fetch API:</span>{" "}
                    {typeof fetch !== "undefined"
                      ? "✓ Available"
                      : "✗ Not available"}
                  </p>
                  <p>
                    <span className="font-medium">WebAssembly:</span>{" "}
                    {typeof WebAssembly !== "undefined"
                      ? "✓ Available"
                      : "✗ Not available"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This is a non-blocking error screen. The application will attempt
              to recover when you refresh. If you continue to experience issues,
              please report this error with the diagnostic information above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
