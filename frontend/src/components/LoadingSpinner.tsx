import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "card" | "inline";
}

export default function LoadingSpinner({ message = "Loading...", size = "md", variant = "card" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const Spinner = () => (
    <div className="relative">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {size === "lg" && <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />}
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <Spinner />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  if (variant === "default") {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Spinner />
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <Spinner />
          {size === "lg" && (
            <>
              <div className="absolute -inset-4 bg-primary/5 rounded-full animate-ping" />
              <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 to-transparent rounded-full animate-pulse" />
            </>
          )}
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg text-foreground">{message}</h3>
          <p className="text-sm text-muted-foreground">This may take a moment...</p>

          <div className="flex items-center justify-center gap-1 pt-2">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
