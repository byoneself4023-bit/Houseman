import React from "react";
import { matchKorean } from "../utils/koreanSearch";

interface SearchInputProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "검색...",
  style,
}) => (
  <div className="relative" style={style}>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full py-2.5 pl-9 pr-3.5 rounded-[10px] border-[1.5px] border-hm-input-border text-sm font-[inherit] bg-hm-bg-slate outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
    />
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-hm-text-muted pointer-events-none">
      {"\uD83D\uDD0D"}
    </span>
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-sm text-hm-text-muted cursor-pointer p-0 hover:text-hm-text transition-colors"
      >
        {"\u2715"}
      </button>
    )}
  </div>
);

export { matchKorean };
