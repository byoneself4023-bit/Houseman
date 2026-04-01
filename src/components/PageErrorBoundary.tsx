import React from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-10 text-center font-['Pretendard',-apple-system,BlinkMacSystemFont,sans-serif]">
      <div className="w-14 h-14 rounded-[14px] bg-red-50 inline-flex items-center justify-center text-2xl mb-4">
        {"\u26A0\uFE0F"}
      </div>
      <h2 className="text-lg font-bold text-hm-text mb-2">
        페이지 오류가 발생했습니다
      </h2>
      <p className="text-sm text-hm-text-muted max-w-[400px] mx-auto mb-5">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-2.5 rounded-lg border-none bg-hm-blue text-white text-sm font-bold cursor-pointer font-inherit hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
    </div>
  );
}

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>;
}
