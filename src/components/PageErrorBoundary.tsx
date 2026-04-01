import React from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-hm-danger-bg flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-hm-danger" />
      </div>
      <h3 className="text-sm font-semibold text-hm-text mb-1">
        문제가 발생했습니다
      </h3>
      <p className="text-sm text-hm-text-muted max-w-[320px] mb-2">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <p className="text-sm text-hm-text-muted max-w-[320px] mb-4">
        페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
      </p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        다시 시도
      </Button>
    </div>
  );
}

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>;
}
