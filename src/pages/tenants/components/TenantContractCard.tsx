import React from 'react';
import { Card, SectionTitle, ContractDropZone } from '@/components';
import { inputStyle } from '@/components/Field';
import { getRoomType } from '@/config';

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
      <Card style={{ marginBottom: 12, border: "2px solid #059669" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#065F46" }}>📝</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23" }}>{pc.building} {pc.room}호</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#D1FAE5", color: "#065F46" }}>계약서 입력</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: isDangi ? "#FFF7ED" : "#EFF6FF", color: isDangi ? "#EA580C" : "#2563EB" }}>{roomType}</span>
              </div>
              <div style={{ fontSize: 11, color: "#059669", marginTop: 2 }}>입퇴실일정에서 전달된 계약 정보 · 등록자: {pc.registeredBy || "\u2014"} · {pc.registeredAt || "\u2014"}</div>
            </div>
          </div>
          <button onClick={() => setPendingContract && setPendingContract(null)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
        </div>
      </Card>

      {/* Detail Card */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle sub="계약 정보를 확인하고 임차인 정보를 입력하세요">📋 계약서 입력</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #FECACA" }}>⚠️ 필수 입력</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12, padding: "10px", background: "#FEF2F2", borderRadius: 10, border: "1.5px solid #FECACA" }}>
              <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>입주자명 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-name" placeholder="이름 입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
              <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>연락처1 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-phone" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
              <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>주민등록번호 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-ssn" placeholder="000000-0000000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, fontFamily: "monospace", borderColor: "#FECACA" }} /></div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>기본 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처2</div><input id="pc-phone2" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처3</div><input id="pc-phone3" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: pc.moveIn || pc.date ? "#8F95A3" : "#DC2626", fontWeight: pc.moveIn || pc.date ? 400 : 700, marginBottom: 2 }}>입주일 {!(pc.moveIn || pc.date) && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-movein" type="date" defaultValue={pc.moveIn || pc.date} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: pc.moveIn || pc.date ? undefined : "#FECACA" }} /></div>
              <div><div style={{ fontSize: 9, color: pc.expiry ? "#8F95A3" : "#DC2626", fontWeight: pc.expiry ? 400 : 700, marginBottom: 2 }}>만기일 {!pc.expiry && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-expiry" type="date" defaultValue={pc.expiry || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: pc.expiry ? undefined : "#FECACA" }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>계약일</div>
                <div style={{ padding: "7px 10px", borderRadius: 8, background: "#F3F4F6", border: "1px solid #E0E3E9", fontSize: 12, color: "#5F6577" }}>{pc.contractDate || pc.date}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 12 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>유형</div>
                <div style={{ padding: "7px 10px", borderRadius: 8, background: isDangi ? "#FFF7ED" : "#EFF6FF", border: "1px solid #E0E3E9", fontSize: 12, fontWeight: 700, color: isDangi ? "#EA580C" : "#2563EB" }}>{roomType}</div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>💰 금액 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: pc.deposit ? "#8F95A3" : "#DC2626", fontWeight: pc.deposit ? 400 : 700, marginBottom: 2 }}>{pcDepositLabel} (만원) {!pc.deposit && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-deposit" defaultValue={pc.deposit || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", borderColor: pc.deposit ? undefined : "#FECACA" }} /></div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: pc.rent ? "#8F95A3" : "#DC2626", fontWeight: pc.rent ? 400 : 700 }}>임대료 (만원) {!pc.rent && <span style={{ color: "#DC2626" }}>*</span>}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                    <input id="pc-rentPostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                    <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                  </label>
                </div>
                <input id="pc-rent" defaultValue={pc.rent || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", borderColor: pc.rent ? undefined : "#FECACA" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: "#8F95A3" }}>관리비 (만원)</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                    <input id="pc-mgmtPostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                    <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                  </label>
                </div>
                <input id="pc-mgmt" defaultValue={pc.mgmt || ""} placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} />
              </div>
            </div>
            {isDangi && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>수도</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                      <input id="pc-waterPostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                      <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                    </label>
                  </div>
                  <input id="pc-water" defaultValue={pc.water || ""} placeholder="포함" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>케이블</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                      <input id="pc-cablePostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                      <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                    </label>
                  </div>
                  <input id="pc-cable" defaultValue={pc.cable || ""} placeholder="포함" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} />
                </div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>퇴실청소비 (만원)</div><input id="pc-exitfee" defaultValue={pc.exitFee || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>NEGO (만원)</div>
                  <div style={{ padding: "7px 10px", borderRadius: 8, background: pc.nego < pc.rent ? "#FEF2F2" : "#F3F4F6", border: "1px solid #E0E3E9", fontSize: 12, fontWeight: 700, textAlign: "right", color: pc.nego < pc.rent ? "#DC2626" : "#1A1D23" }}>{pc.nego}</div>
                </div>
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>🏠 중개 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료</div><input id="pc-comm" defaultValue={pc.commBroker || ""} placeholder="수수료" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료 (이벤트)</div><input defaultValue="" placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산명</div><input defaultValue={pc.broker || ""} placeholder="부동산명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 연락처</div><input defaultValue={pc.brokerPhone || ""} placeholder="02-000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 담당자</div><input defaultValue="" placeholder="담당자명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23" }}>🅿️ 주차</span>
                {!hasParking && <span style={{ fontSize: 10, color: "#B0B5C1" }}>차량없음</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: "#5F6577" }}>
                  <input id="pc-noParking" type="checkbox" style={{ cursor: "pointer", accentColor: "#DC2626" }} />
                  <span style={{ color: "#DC2626", fontWeight: 600 }}>주차불가로 계약</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: hasParking ? "#DC2626" : "#5F6577", fontWeight: hasParking ? 700 : 400 }}>
                  <input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} style={{ cursor: "pointer", accentColor: "#DC2626" }} />
                  주차있음
                </label>
              </div>
            </div>
            {hasParking && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차번호</div><input id="pc-car" placeholder="12가 3456" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차종</div><input id="pc-cartype" placeholder="현대 아반떼" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📌 기타</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타1</div><input placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타2</div><input placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타3</div><input placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 6 }}>📎 계약서</div>
              <ContractDropZone
                files={pc.contractFiles || []}
                onAdd={(newFiles: any[]) => setPendingContract?.((prev: any) => ({ ...prev, contractFiles: [...(prev.contractFiles || []), ...newFiles] }))}
                onRemove={(idx: number) => setPendingContract?.((prev: any) => ({ ...prev, contractFiles: (prev.contractFiles || []).filter((_: any, i: number) => i !== idx) }))}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPendingContract && setPendingContract(null)}
                style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
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
                alert(`${pc.building} ${pc.room}호 ${name} 호실등록 완료`);
              }}
                style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🏠 호실등록</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
