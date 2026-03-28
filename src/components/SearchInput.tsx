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
  <div style={{ position: "relative", ...style }}>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 14px 10px 36px",
        borderRadius: 10,
        border: "1.5px solid #E0E3E9",
        fontSize: 13,
        fontFamily: "inherit",
        background: "#F8FAFC",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
    <span
      style={{
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: 15,
        color: "#8F95A3",
        pointerEvents: "none",
      }}
    >
      {"\uD83D\uDD0D"}
    </span>
    {value && (
      <button
        onClick={() => onChange("")}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          fontSize: 14,
          color: "#8F95A3",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {"\u2715"}
      </button>
    )}
  </div>
);

export { matchKorean };
