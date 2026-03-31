import React from 'react';

interface TenantSearchBarProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  buildingFilter: string;
  setBuildingFilter: (v: string) => void;
  buildingNames: string[];
}

export const TenantSearchBar: React.FC<TenantSearchBarProps> = ({
  search, setSearch, statusFilter, setStatusFilter, buildingFilter, setBuildingFilter, buildingNames,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 건물, 호실 검색..."
        style={{ width: 200, padding: "7px 14px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
      <select value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}
        style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", color: buildingFilter === "전체" ? "#8F95A3" : "#1A1D23" }}>
        <option value="전체">전체 건물</option>
        {buildingNames.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
      <div style={{ display: "flex", gap: 4 }}>
        {["전체", "정상", "연체"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: statusFilter === s ? (s === "연체" ? "#FEF2F2" : s === "정상" ? "#ECFDF5" : "#F3F4F6") : "#fff",
              color: statusFilter === s ? (s === "연체" ? "#DC2626" : s === "정상" ? "#059669" : "#374151") : "#8F95A3",
              border: statusFilter === s ? `1.5px solid ${s === "연체" ? "#FECACA" : s === "정상" ? "#A7F3D0" : "#D1D5DB"}` : "1px solid #E0E3E9",
            }}>
            {s}
          </button>
        ))}
      </div>
      {(buildingFilter !== "전체" || statusFilter !== "전체" || search) && (
        <button onClick={() => { setBuildingFilter("전체"); setStatusFilter("전체"); setSearch(""); }}
          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#F9FAFB", fontSize: 10, fontWeight: 600, color: "#6B7280", cursor: "pointer", fontFamily: "inherit" }}>
          초기화
        </button>
      )}
    </div>
  );
};
