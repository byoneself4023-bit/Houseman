import React from 'react';

interface TenantSearchBarProps {
  search: string;
  setSearch: (v: string) => void;
}

export const TenantSearchBar: React.FC<TenantSearchBarProps> = ({ search, setSearch }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 건물, 호실 검색..."
        style={{ width: 280, padding: "8px 14px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
    </div>
  );
};
