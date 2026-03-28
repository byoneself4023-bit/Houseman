import React from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div
        style={{
          width: 56, height: 56, borderRadius: 14, background: "#FEF2F2",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, marginBottom: 16,
        }}
      >
        {"\u26A0\uFE0F"}
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1D23", marginBottom: 8 }}>
        페이지 오류가 발생했습니다
      </h2>
      <p style={{ fontSize: 13, color: "#8F95A3", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
        {error instanceof Error ? error.message : String(error)}
      </p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          background: "#3B82F6", color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}
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
