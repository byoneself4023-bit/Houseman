import React from 'react';
import { Card, SectionTitle, ContractDropZone } from '@/components';
import { inputStyle, inputClassName } from '@/components/Field';
import { getRoomType } from '@/config';
import { persistInsertTenant } from '../tenantsApi';
import { toast } from 'sonner';

interface TenantContractCardProps {
  pendingContract: Record<string, any>;
  setPendingContract: ((v: any) => void) | undefined;
  hasParking: boolean;
  setHasParking: (v: boolean) => void;
  activeTenants: Record<string, any>[];
  setActiveTenants?: (fn: any) => void;
  pastTenantsData: Record<string, any>;
  setActiveVacancies?: (fn: any) => void;
  setCalendarEvts?: (fn: any) => void;
  setParkingInfo?: (fn: any) => void;
}

export const TenantContractCard: React.FC<TenantContractCardProps> = ({
  pendingContract,
  setPendingContract,
  hasParking,
  setHasParking,
  activeTenants,
  setActiveTenants,
  pastTenantsData,
  setActiveVacancies,
  setCalendarEvts,
  setParkingInfo,
}) => {
  const pc = pendingContract;
  const roomType = getRoomType(pc.building, pc.room);
  const isDangi = roomType === "단기";
  const pcDepositLabel = isDangi ? "예치금" : "보증금";

  return (
    <div>
      {/* Header Card */}
      <Card className="mb-3 border-2 border-hm-success">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-[800] text-emerald-800">📝</div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-[800] text-hm-text">{pc.building} {pc.room}호</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">계약서 입력</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isDangi ? 'bg-hm-warning-bg text-hm-warning' : 'bg-hm-blue-bg text-hm-blue-dark'}`}>{roomType}</span>
              </div>
              <div className="text-[11px] text-hm-success mt-0.5">입퇴실일정에서 전달된 계약 정보 · 등록자: {pc.registeredBy || "\u2014"} · {pc.registeredAt || "\u2014"}</div>
            </div>
          </div>
          <button onClick={() => setPendingContract && setPendingContract(null)}
            className="w-7 h-7 rounded-md border border-hm-input-border bg-white cursor-pointer text-sm font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
        </div>
      </Card>

      {/* Detail Card */}
      <Card className="mb-4">
        <SectionTitle sub="계약 정보를 확인하고 임차인 정보를 입력하세요">📋 계약서 입력</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          {/* Left */}
          <div>
            <div className="text-[11px] font-[800] text-hm-danger mb-2 pb-1.5 border-b-2 border-hm-danger-border">⚠️ 필수 입력</div>
            <div className="grid grid-cols-3 gap-2 mb-3 p-2.5 bg-hm-danger-bg rounded-[10px] border-[1.5px] border-hm-danger-border">
              <div><div className="text-[9px] text-hm-danger font-bold mb-0.5">입주자명 <span className="text-hm-danger">*</span></div><input id="pc-name" placeholder="이름 입력" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
              <div><div className="text-[9px] text-hm-danger font-bold mb-0.5">연락처1 <span className="text-hm-danger">*</span></div><input id="pc-phone" placeholder="010-0000-0000" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
              <div><div className="text-[9px] text-hm-danger font-bold mb-0.5">주민등록번호 <span className="text-hm-danger">*</span></div><input id="pc-ssn" placeholder="000000-0000000" className={`${inputClassName} font-mono`} style={{ padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
            </div>

            <div className="text-[11px] font-[800] text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">기본 정보</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">연락처2</div><input id="pc-phone2" placeholder="010-0000-0000" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">연락처3</div><input id="pc-phone3" placeholder="010-0000-0000" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><div className="text-[9px] mb-0.5" style={{ color: pc.moveIn || pc.date ? "#8F95A3" : "#DC2626", fontWeight: pc.moveIn || pc.date ? 400 : 700 }}>입주일 {!(pc.moveIn || pc.date) && <span className="text-hm-danger">*</span>}</div><input id="pc-movein" type="date" defaultValue={pc.moveIn || pc.date} className={inputClassName} style={{ padding: "7px 10px", fontSize: 12, borderColor: pc.moveIn || pc.date ? undefined : "#FECACA" }} /></div>
              <div><div className="text-[9px] mb-0.5" style={{ color: pc.expiry ? "#8F95A3" : "#DC2626", fontWeight: pc.expiry ? 400 : 700 }}>만기일 {!pc.expiry && <span className="text-hm-danger">*</span>}</div><input id="pc-expiry" type="date" defaultValue={pc.expiry || ""} className={inputClassName} style={{ padding: "7px 10px", fontSize: 12, borderColor: pc.expiry ? undefined : "#FECACA" }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">계약일</div>
                <div className="py-[7px] px-2.5 rounded-lg bg-gray-100 border border-hm-input-border text-xs text-hm-text-sub">{pc.contractDate || pc.date}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">유형</div>
                <div className={`py-[7px] px-2.5 rounded-lg border border-hm-input-border text-xs font-bold ${isDangi ? 'bg-hm-warning-bg text-hm-warning' : 'bg-hm-blue-bg text-hm-blue-dark'}`}>{roomType}</div>
              </div>
            </div>

            <div className="text-[11px] font-[800] text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">💰 금액 정보</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><div className="text-[9px] mb-0.5" style={{ color: pc.deposit ? "#8F95A3" : "#DC2626", fontWeight: pc.deposit ? 400 : 700 }}>{pcDepositLabel} (만원) {!pc.deposit && <span className="text-hm-danger">*</span>}</div><input id="pc-deposit" defaultValue={pc.deposit || ""} className={`${inputClassName} text-right`} style={{ padding: "7px 10px", fontSize: 12, borderColor: pc.deposit ? undefined : "#FECACA" }} /></div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px]" style={{ color: pc.rent ? "#8F95A3" : "#DC2626", fontWeight: pc.rent ? 400 : 700 }}>임대료 (만원) {!pc.rent && <span className="text-hm-danger">*</span>}</span>
                  <label className="flex items-center gap-0.5 cursor-pointer">
                    <input id="pc-rentPostpaid" type="checkbox" className="w-3 h-3 cursor-pointer" />
                    <span className="text-[8px] text-hm-danger font-semibold">후불</span>
                  </label>
                </div>
                <input id="pc-rent" defaultValue={pc.rent || ""} className={`${inputClassName} text-right`} style={{ padding: "7px 10px", fontSize: 12, borderColor: pc.rent ? undefined : "#FECACA" }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] text-hm-text-muted">관리비 (만원)</span>
                  <label className="flex items-center gap-0.5 cursor-pointer">
                    <input id="pc-mgmtPostpaid" type="checkbox" className="w-3 h-3 cursor-pointer" />
                    <span className="text-[8px] text-hm-danger font-semibold">후불</span>
                  </label>
                </div>
                <input id="pc-mgmt" defaultValue={pc.mgmt || ""} placeholder="0" className={`${inputClassName} text-right`} style={{ padding: "7px 10px", fontSize: 12 }} />
              </div>
            </div>
            {isDangi && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-hm-text-muted">수도</span>
                    <label className="flex items-center gap-0.5 cursor-pointer">
                      <input id="pc-waterPostpaid" type="checkbox" className="w-3 h-3 cursor-pointer" />
                      <span className="text-[8px] text-hm-danger font-semibold">후불</span>
                    </label>
                  </div>
                  <input id="pc-water" defaultValue={pc.water || ""} placeholder="포함" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-hm-text-muted">케이블</span>
                    <label className="flex items-center gap-0.5 cursor-pointer">
                      <input id="pc-cablePostpaid" type="checkbox" className="w-3 h-3 cursor-pointer" />
                      <span className="text-[8px] text-hm-danger font-semibold">후불</span>
                    </label>
                  </div>
                  <input id="pc-cable" defaultValue={pc.cable || ""} placeholder="포함" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} />
                </div>
                <div><div className="text-[9px] text-hm-text-muted mb-0.5">퇴실청소비 (만원)</div><input id="pc-exitfee" defaultValue={pc.exitFee || ""} className={`${inputClassName} text-right`} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div className="text-[9px] text-hm-text-muted mb-0.5">NEGO (만원)</div>
                  <div className="py-[7px] px-2.5 rounded-lg border border-hm-input-border text-xs font-bold text-right" style={{ background: pc.nego < pc.rent ? "#FEF2F2" : "#F3F4F6", color: pc.nego < pc.rent ? "#DC2626" : "#1A1D23" }}>{pc.nego}</div>
                </div>
              </div>
            )}

            <div className="text-[11px] font-[800] text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">🏠 중개 정보</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">중개수수료</div><input id="pc-comm" defaultValue={pc.commBroker || ""} placeholder="수수료" className={`${inputClassName} text-right`} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">중개수수료 (이벤트)</div><input defaultValue="" placeholder="0" className={`${inputClassName} text-right`} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">부동산명</div><input defaultValue={pc.broker || ""} placeholder="부동산명" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">부동산 연락처</div><input defaultValue={pc.brokerPhone || ""} placeholder="02-000-0000" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">부동산 담당자</div><input defaultValue="" placeholder="담당자명" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b-[1.5px] border-hm-border">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-[800] text-hm-text">🅿️ 주차</span>
                {!hasParking && <span className="text-[10px] text-[#B0B5C1]">차량없음</span>}
              </div>
              <div className="flex items-center gap-2.5">
                <label className="flex items-center gap-1 cursor-pointer text-[10px] text-hm-text-sub">
                  <input id="pc-noParking" type="checkbox" className="cursor-pointer accent-hm-danger" />
                  <span className="text-hm-danger font-semibold">주차불가로 계약</span>
                </label>
                <label className={`flex items-center gap-1 cursor-pointer text-[10px] ${hasParking ? 'text-hm-danger font-bold' : 'text-hm-text-sub font-normal'}`}>
                  <input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} className="cursor-pointer accent-hm-danger" />
                  주차있음
                </label>
              </div>
            </div>
            {hasParking && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">차번호</div><input id="pc-car" placeholder="12가 3456" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">차종</div><input id="pc-cartype" placeholder="현대 아반떼" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            )}

            <div className="text-[11px] font-[800] text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">📌 기타</div>
            <div className="flex flex-col gap-1.5 mb-3">
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">기타1</div><input placeholder="입력" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">기타2</div><input placeholder="입력" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div className="text-[9px] text-hm-text-muted mb-0.5">기타3</div><input placeholder="입력" className={inputClassName} style={{ padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            <div className="mb-3">
              <div className="text-[11px] font-[800] text-hm-text mb-1.5">📎 계약서</div>
              <ContractDropZone
                files={pc.contractFiles || []}
                onAdd={(newFiles: any[]) => setPendingContract?.((prev: any) => ({ ...prev, contractFiles: [...(prev.contractFiles || []), ...newFiles] }))}
                onRemove={(idx: number) => setPendingContract?.((prev: any) => ({ ...prev, contractFiles: (prev.contractFiles || []).filter((_: any, i: number) => i !== idx) }))}
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPendingContract && setPendingContract(null)}
                className="flex-1 py-3 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-[13px] cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
              <button onClick={() => {
                const name = (document.getElementById("pc-name") as HTMLInputElement)?.value?.trim();
                const phone = (document.getElementById("pc-phone") as HTMLInputElement)?.value?.trim();
                const moveIn = (document.getElementById("pc-movein") as HTMLInputElement)?.value;
                const expiry = (document.getElementById("pc-expiry") as HTMLInputElement)?.value;
                const deposit = (document.getElementById("pc-deposit") as HTMLInputElement)?.value;
                const rent = (document.getElementById("pc-rent") as HTMLInputElement)?.value;
                const mgmt = (document.getElementById("pc-mgmt") as HTMLInputElement)?.value;
                const rentPostpaid = (document.getElementById("pc-rentPostpaid") as HTMLInputElement)?.checked;
                const mgmtPostpaid = (document.getElementById("pc-mgmtPostpaid") as HTMLInputElement)?.checked;
                const ssn = (document.getElementById("pc-ssn") as HTMLInputElement)?.value?.trim();
                if (!name) return alert("입주자명을 입력하세요");
                if (!phone) return alert("연락처1을 입력하세요");
                if (!ssn) return alert("주민등록번호를 입력하세요");
                const newId = activeTenants.length > 0 ? Math.max(...activeTenants.map(t => t.id)) + 1 : 1;
                // 이전 퇴실자의 moveOutCheckPhotos를 새 임차인의 moveInCheckPhotos로 전달
                const histKey = `${pc.building}_${pc.room}`;
                const prevRecords = pastTenantsData?.[histKey] || [];
                const lastPast = prevRecords.length > 0 ? prevRecords[prevRecords.length - 1] : null;
                const newTenant: Record<string, any> = {
                  id: newId, name, building: pc.building, room: pc.room, phone,
                  rent: (Number(rent) || 0) * 10000,
                  mgmt: (Number(mgmt) || 0) * 10000,
                  deposit: (Number(deposit) || 0) * 10000,
                  type: roomType || "단기",
                  due: "",
                  status: "정상", overdue: 0,
                  expiry: expiry || "",
                  prevUnpaid: 0, currentUnpaid: 0, overdueDays: 0,
                  rentPayType: rentPostpaid ? "후불" : "선불",
                  mgmtPayType: mgmtPostpaid ? "후불" : "선불",
                  contractFiles: pc.contractFiles || [],
                  moveIn: moveIn || "",
                  moveInPhotos: pc.vacancyData?.moveInPhotos || [],
                  moveInCheckPhotos: lastPast?.moveOutCheckPhotos || [],
                };
                const carNum = (document.getElementById("pc-car") as HTMLInputElement)?.value?.trim();
                const carType = (document.getElementById("pc-cartype") as HTMLInputElement)?.value?.trim();
                setActiveTenants?.((prev: any[]) => [...prev, newTenant]);
                setActiveVacancies?.((prev: any[]) => prev.filter(v => !(v.building === pc.building && v.room === pc.room)));
                setCalendarEvts?.((prev: any[]) => prev.filter(e => !(e.type === "계약" && e.building === pc.building && String(e.room) === String(pc.room))));
                if ((carNum || carType) && setParkingInfo) {
                  setParkingInfo((prev: any) => ({ ...prev, [newId]: { carNumber: carNum || "", carType: carType || "" } }));
                }
                setPendingContract && setPendingContract(null);
                // Supabase 동기화 (신규 임차인 등록)
                persistInsertTenant({
                  ...newTenant,
                  ssn: (document.getElementById("pc-ssn") as HTMLInputElement)?.value?.trim() || null,
                  carNumber: carNum || null,
                  carType: carType || null,
                }).then(result => {
                  if (result?.data?.id) {
                    setActiveTenants?.((prev: any[]) => prev.map(x => x.id === newId ? { ...x, supabaseId: result.data.id, source: "supabase" } : x));
                  }
                }).catch(() => toast.error("DB 등록 실패"));
                toast.success(`${pc.building} ${pc.room}호 ${name} 입주 등록 완료`);
              }}
                className="flex-[2] py-3 rounded-lg border-none bg-hm-success text-white font-[800] text-sm cursor-pointer font-[inherit] hover:brightness-110 transition-all">🏠 호실등록</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
