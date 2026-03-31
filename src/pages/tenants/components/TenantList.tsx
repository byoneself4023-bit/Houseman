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
      <Card className="text-center py-12 px-12 text-hm-text-muted">
        <div className="text-sm font-semibold">해당 임차인이 없습니다</div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-hm-border">
              {["유형","건물명","호실","입주자","연락처","입주일","만기일","보증금","월세","관리비","상태","청구\u2460","청구\u2461","청구\u2462"].map((h, i) => (
                <th key={i} className={`py-2.5 text-[11px] font-bold text-hm-text-muted whitespace-nowrap ${
                  (i >= 7 && i <= 9) || i >= 11 ? "text-right" : i >= 10 ? "text-center" : "text-left"
                } ${i >= 11 ? "px-2.5" : i >= 10 ? "px-1" : "px-2"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleFiltered.map((r, i) => {
              const bs = getBillingStatus(r, roomBalances);
              const slots = getBillingSlots(r, buildingAccounts, allBuildings);
              const slotColors = ["text-hm-warning", "text-amber-800", "text-hm-blue-dark"];
              return (
                <tr key={i} onClick={() => setSelectedTenant(r)}
                  className="border-b border-[#F0F2F5] cursor-pointer hover:bg-hm-bg-hover transition-colors">
                  <td className="py-2.5 px-2"><RoomTypeBadge building={r.building} room={r.room} /></td>
                  <td className="py-2.5 px-2 font-bold">{r.building}</td>
                  <td className="py-2.5 px-2">{r.room}</td>
                  <td className="py-2.5 px-1 font-bold max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap" title={r.name}>{r.name.length > 5 ? r.name.slice(0, 5) + "\u2026" : r.name}{r.source === "supabase" && <span className="text-[8px] font-bold ml-0.5 px-1 py-px rounded-sm bg-green-100 text-green-600">DB</span>}</td>
                  <td className="py-2.5 px-0.5 text-[11px] text-hm-text-sub">{r.phone}</td>
                  <td className="py-2.5 px-0.5 text-[11px]">{r.moveIn ? r.moveIn.slice(2) : "-"}</td>
                  <td className="py-2.5 px-1 text-[11px]">{r.expiry ? r.expiry.slice(2) : "-"}</td>
                  <td className="py-2.5 px-1 text-right text-[11px]">{fmt(r.deposit)}</td>
                  <td className="py-2.5 px-1 text-right text-[11px]">{fmt(r.rent)}</td>
                  <td className="py-2.5 px-1 text-right text-[11px] text-hm-text-muted">{fmt(r.mgmt)}</td>
                  <td className="py-2.5 px-1 text-center whitespace-nowrap">
                    <StatusBadge status={bs.label === "청구" ? "청구" : bs.days > 0 ? "연체" : r.status} label={bs.days > 0 ? bs.label : undefined} />
                  </td>
                  {[0, 1, 2].map(si => (
                    <td key={si} className="py-2.5 px-2.5 text-right text-[11px]">
                      {slots[si] ? <><span className={`font-bold ${slotColors[si]}`}>{fmt(slots[si].amount)}</span>{(slots[si] as any).lateFee > 0 && <div className="text-[9px] text-hm-danger font-semibold">연체료 {fmt((slots[si] as any).lateFee)}</div>}</> : <span className="text-gray-300">&mdash;</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {visibleCount < filtered.length && (
        <div className="text-center py-4">
          <button onClick={() => setVisibleCount(v => v + 100)}
            className="py-2.5 px-8 rounded-lg border border-hm-input-border bg-white text-[13px] font-bold cursor-pointer font-[inherit] text-hm-text-sub hover:bg-hm-bg-hover transition-colors">
            더보기 ({filtered.length - visibleCount}명 남음)
          </button>
        </div>
      )}
    </>
  );
};
