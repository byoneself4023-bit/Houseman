import React from 'react';
import { getRoomType } from '@/config';

interface TenantSummaryCardsProps {
  myTenants: Record<string, any>[];
  typeFilter: string;
  setTypeFilter: (v: string) => void;
}

export const TenantSummaryCards: React.FC<TenantSummaryCardsProps> = ({ myTenants, typeFilter, setTypeFilter }) => {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {["전체", "단기", "일반임대", "근생", "관리사무소"].map(t => {
        const colors: Record<string, string> = { "전체": "#1A1D23", "단기": "#EA580C", "일반임대": "#2563EB", "근생": "#7C3AED", "관리사무소": "#6B7280" };
        const cnt = t === "전체" ? myTenants.length : myTenants.filter(r => getRoomType(r.building, r.room) === t).length;
        return (
          <button key={t} onClick={() => setTypeFilter(t)}
            style={{ padding: "7px 16px", borderRadius: 8, border: typeFilter === t ? `2px solid ${colors[t]}` : "1px solid #E0E3E9", background: typeFilter === t ? `${colors[t]}10` : "#fff", color: typeFilter === t ? colors[t] : "#5F6577", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
            {t} <span style={{ fontWeight: 800 }}>{cnt}</span>
          </button>
        );
      })}
    </div>
  );
};
