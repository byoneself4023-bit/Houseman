import React from "react";

const spinKeyframes = `
@keyframes houseman-spin {
  to { transform: rotate(360deg); }
}
`;

interface LoadingSpinnerProps {
  message?: string;
  height?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "로딩 중...", height = 200 }) => (
  <>
    <style>{spinKeyframes}</style>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height,
        gap: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid #E0E3E9",
          borderTopColor: "#3B82F6",
          borderRadius: "50%",
          animation: "houseman-spin 0.8s linear infinite",
        }}
      />
      <span style={{ fontSize: 14, color: "#8F95A3", fontFamily: "inherit" }}>
        {message}
      </span>
    </div>
  </>
);
