import React from 'react';
import { Card, StatusBadge, RoomTypeBadge } from '@/components';
import { fmt } from '@/utils';
import { getBillingStatus } from '../utils/billingStatus';
import { getBillingSlots } from '../utils/billingSlots';

interface TenantListProps {
  filtered: Record<string, any>[];
  visibleFiltered: Record<string, any>[];
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  setSelectedTenant: (t: Record<string, any>) => void;
  roomBalances: Record<string, number>;
  buildingAccounts: Record<string, any>;
  allBuildings: Record<string, any>[];
}

export const TenantList: React.FC<TenantListProps> = ({
  filtered,
  visibleFiltered,
  visibleCount,
  setVisibleCount,
  setSelectedTenant,
  roomBalances,
  buildingAccounts,
  allBuildings,
}) => {
  if (filtered.length === 0) {
    return (
      <Card style={{ textAlign: "center", padding: 48, color: "#8F95A3" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>해당 임차인이 없습니다</div>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
              {["유형","건물명","호실","입주자","연락처","입주일","만기일","보증금","월세","관리비","상태","청구\u2460","청구\u2461","청구\u2462"].map((h, i) => (
                <th key={i} style={{ padding: i >= 11 ? "10px 10px" : i >= 10 ? "10px 4px" : "10px 8px", textAlign: (i >= 7 && i <= 9) || i >= 11 ? "right" : i >= 10 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleFiltered.map((r, i) => {
              const bs = getBillingStatus(r, roomBalances);
              const slots = getBillingSlots(r, buildingAccounts, allBuildings);
              const slotColors = ["#EA580C", "#92400E", "#2563EB"];
              return (
                <tr key={i} onClick={() => setSelectedTenant(r)}
                  style={{ borderBottom: "1px solid #F0F2F5", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <td style={{ padding: "10px 8px" }}><RoomTypeBadge building={r.building} room={r.room} /></td>
                  <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.building}</td>
                  <td style={{ padding: "10px 8px" }}>{r.room}</td>
                  <td style={{ padding: "10px 4px", fontWeight: 700, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.name}>{r.name.length > 5 ? r.name.slice(0, 5) + "\u2026" : r.name}{r.source === "supabase" && <span style={{ fontSize: 8, fontWeight: 700, marginLeft: 3, padding: "1px 4px", borderRadius: 3, background: "#DCFCE7", color: "#16A34A" }}>DB</span>}</td>
                  <td style={{ padding: "10px 2px", fontSize: 11, color: "#5F6577" }}>{r.phone}</td>
                  <td style={{ padding: "10px 2px", fontSize: 11 }}>{r.moveIn ? r.moveIn.slice(2) : "-"}</td>
                  <td style={{ padding: "10px 4px", fontSize: 11 }}>{r.expiry ? r.expiry.slice(2) : "-"}</td>
                  <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 11 }}>{fmt(r.deposit)}</td>
                  <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 11 }}>{fmt(r.rent)}</td>
                  <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 11, color: "#8F95A3" }}>{fmt(r.mgmt)}</td>
                  <td style={{ padding: "10px 4px", textAlign: "center", whiteSpace: "nowrap" }}>
                    <StatusBadge status={bs.label === "청구" ? "청구" : bs.days > 0 ? "연체" : r.status} label={bs.days > 0 ? bs.label : undefined} />
                  </td>
                  {[0, 1, 2].map(si => (
                    <td key={si} style={{ padding: "10px 10px", textAlign: "right", fontSize: 11 }}>
                      {slots[si] ? <><span style={{ fontWeight: 700, color: slotColors[si] }}>{fmt(slots[si].amount)}</span>{(slots[si] as any).lateFee > 0 && <div style={{ fontSize: 9, color: "#DC2626", fontWeight: 600 }}>연체료 {fmt((slots[si] as any).lateFee)}</div>}</> : <span style={{ color: "#D1D5DB" }}>&mdash;</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {visibleCount < filtered.length && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <button onClick={() => setVisibleCount(v => v + 100)}
            style={{ padding: "10px 32px", borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#5F6577" }}>
            더보기 ({filtered.length - visibleCount}명 남음)
          </button>
        </div>
      )}
    </>
  );
};
