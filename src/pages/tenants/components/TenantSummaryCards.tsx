import React from 'react';
import { getRoomType } from '@/config';

interface TenantSummaryCardsProps {
  myTenants: Record<string, any>[];
  typeFilter: string;
  setTypeFilter: (v: string) => void;
}

export const TenantSummaryCards: React.FC<TenantSummaryCardsProps> = ({ myTenants, typeFilter, setTypeFilter }) => {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {["전체", "단기", "일반임대", "근생", "관리사무소"].map(t => {
        const colors: Record<string, string> = { "전체": "var(--color-hm-text)", "단기": "var(--color-hm-warning)", "일반임대": "var(--color-hm-blue-dark)", "근생": "#7C3AED", "관리사무소": "#6B7280" };
        const cnt = t === "전체" ? myTenants.length : myTenants.filter(r => getRoomType(r.building, r.room) === t).length;
        const isActive = typeFilter === t;
        return (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="rounded-lg font-semibold text-[12.5px] cursor-pointer font-[inherit] transition-colors"
            style={{
              padding: "7px 16px",
              border: isActive ? `2px solid ${colors[t]}` : "1px solid var(--color-hm-input-border)",
              background: isActive ? `${colors[t]}10` : "#fff",
              color: isActive ? colors[t] : "var(--color-hm-text-sub)",
            }}>
            {t} <span className="font-bold">{cnt}</span>
          </button>
        );
      })}
    </div>
  );
};
