import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  height?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "로딩 중...", height = 200 }) => (
  <div
    className="flex flex-col justify-center items-center gap-3"
    style={{ height }}
  >
    <div className="w-7 h-7 border-3 border-[#E0E3E9] border-t-hm-blue rounded-full animate-spin" />
    <span className="text-sm text-hm-text-muted font-inherit">
      {message}
    </span>
  </div>
);
