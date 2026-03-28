import React from 'react';
import { Card, PhotoDropZone } from '@/components';
import { inputStyle } from '@/components/Field';
import { getRoomType, changeRoomType, staffRoles } from '@/config';
import { rtCfg } from '@/components/RoomTypeBadge';
import {
  modeOptions, ownerFieldCfg, housemanUsageMap, ownerFirstModes,
  flowMap, banks, acctTypeBg, acctTypeColor, defaultHousemanAccount,
} from '@/config/accountConfig';
import { roomMasterData } from '@/data';
import { fmt } from '@/utils';

const acctTypeLabel: Record<string, string> = { "단기": "단기", "일반임대": "일반임대", "근생": "근생", "관리사무소": "관리사무소" };

interface RoomDetailPanelProps {
  isMobile: boolean;
  buildingName: string;
  selectedRoom: string;
  setSelectedRoom: (room: string | null) => void;
  roomEditMode: boolean;
  setRoomEditMode: (v: boolean) => void;
  roomDeleteStep: number;
  setRoomDeleteStep: (v: number) => void;
  roomTab: string;
  setRoomTab: (v: string) => void;
  saved: Record<string, any>;
  updateBD: (patch: Record<string, any>) => void;
  bldgTenants: Record<string, any>[];
  bldgVacancies: Record<string, any>[];
  pastTenantsData: Record<string, any>;
  detailBuildingTypes: string[];
  buildingAccounts: Record<string, any>;
  setBuildingAccounts: ((fn: any) => void) | undefined;
  buildingMgrs: Record<string, string>;
  staffList: Record<string, any>[];
  depositNames: Record<string, string>;
  setDepositNames: (fn: any) => void;
}

export const RoomDetailPanel: React.FC<RoomDetailPanelProps> = ({
  isMobile, buildingName, selectedRoom, setSelectedRoom,
  roomEditMode, setRoomEditMode,
  roomDeleteStep, setRoomDeleteStep,
  roomTab, setRoomTab,
  saved, updateBD,
  bldgTenants, bldgVacancies, pastTenantsData,
  detailBuildingTypes, buildingAccounts, setBuildingAccounts,
  buildingMgrs, staffList,
  depositNames, setDepositNames,
}) => {
  const key = `${buildingName}_${selectedRoom}`;
  const savedRoom = saved[`room_${selectedRoom}`] || {};
  const master: Record<string, any> = { ...(roomMasterData[key] || {}), ...savedRoom };
  const tenant = bldgTenants.find(t => t.room === selectedRoom);
  const vacancy = bldgVacancies.find(v => v.room === selectedRoom);
  const roomPhotoKey = `roomPhotos_${selectedRoom}`;
  const roomPhotos = saved[roomPhotoKey] || master.photos || [];
  const addRoomPhotos = (dataUrls: string[]) => updateBD({ [roomPhotoKey]: [...roomPhotos, ...dataUrls].slice(0, 30) });
  const removeRoomPhoto = (pi: number) => { const updated = [...roomPhotos]; updated.splice(pi, 1); updateBD({ [roomPhotoKey]: updated }); };
  const photoCount = roomPhotos.length;

  return (
    <Card style={{ marginBottom: 20, border: "2px solid #3B82F6" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#1A1D23" }}>🚪 {selectedRoom}호</span>
          <select value={getRoomType(buildingName, selectedRoom)} onChange={e => { changeRoomType(buildingName, selectedRoom, e.target.value); setRoomTab(roomTab); /* force re-render */ }}
            style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: "1.5px solid #E0E3E9", cursor: "pointer", fontFamily: "inherit",
              background: rtCfg(getRoomType(buildingName, selectedRoom)).bg,
              color: rtCfg(getRoomType(buildingName, selectedRoom)).c }}>
            <option value="단기">단기</option><option value="일반임대">일반임대</option><option value="근생">근생</option><option value="관리사무소">관리사무소</option>
          </select>
          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, fontWeight: 700,
            background: tenant ? (tenant.overdue > 0 ? "#FEE2E2" : "#D1FAE5") : vacancy ? "#FEF3C7" : "#FEF3C7",
            color: tenant ? (tenant.overdue > 0 ? "#991B1B" : "#065F46") : vacancy ? "#92400E" : "#92400E" }}>
            {tenant ? (tenant.overdue > 0 ? "연체" : "입주중") : "공실"}
          </span>
          {master.roomType && <span style={{ fontSize: 11, color: "#8F95A3" }}>{master.roomType} · {master.area}㎡</span>}
        </div>
        <button onClick={() => setSelectedRoom(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
      </div>

      {/* Room Info */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #BFDBFE", display: "flex", alignItems: "center", gap: 6 }}>
          📋 호실 기본정보 <span style={{ fontSize: 10, fontWeight: 500, color: "#8F95A3" }}>이 정보가 공실관리 · 홈페이지의 기준값이 됩니다</span>
        </div>
        {roomEditMode ? (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, alignItems: "stretch" }}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>방형태</div>
                  <select id="re-roomType" defaultValue={master.roomType || ""} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }}><option value="">선택</option>{["원룸","투룸","쓰리룸","복층","상가","사무실"].map(t => <option key={t}>{t}</option>)}</select></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>면적 (㎡)</div>
                  <input id="re-area" defaultValue={master.area || ""} placeholder="26.4" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산수수료</div>
                  <input id="re-commFee" defaultValue={master.commFee || ""} placeholder="100,000" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, textAlign: "right" }} /></div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 6 }}>💰 기준 금액</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[
                  { label: "예치금", key: "deposit", value: master.deposit }, { label: "임대료", key: "rent", value: master.rent }, { label: "관리비", key: "mgmt", value: master.mgmt },
                  { label: "수도", key: "water", value: master.water }, { label: "인터넷", key: "internet", value: master.internet }, { label: "퇴실청소비", key: "cleanFee", value: master.cleanFee },
                ].map((f, i) => (
                  <div key={i}><div style={{ fontSize: 8, color: "#059669", marginBottom: 2 }}>{f.label}</div>
                    <input id={`re-${f.key}`} defaultValue={f.value || ""} placeholder="0" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, textAlign: "right" }} /></div>
                ))}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>🔌 고객번호</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div><div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>전기</div>
                  <input id="re-elecNo" defaultValue={master.elecNo || ""} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
                <div><div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>가스</div>
                  <input id="re-gasNo" defaultValue={master.gasNo || ""} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항상단</div>
                <textarea id="re-specialTerms" defaultValue={master.specialTerms || ""} placeholder="특약사항 상단 입력..."
                  style={{ ...inputStyle, padding: "8px 10px", fontSize: 11, resize: "none", lineHeight: 1.6, width: "100%", flex: 1 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항하단</div>
                <textarea id="re-specialTermsBottom" defaultValue={master.specialTermsBottom || ""} placeholder="특약사항 하단 입력..."
                  style={{ ...inputStyle, padding: "8px 10px", fontSize: 11, resize: "none", lineHeight: 1.6, width: "100%", flex: 1 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <PhotoDropZone photos={roomPhotos} maxPhotos={30} label="호실 사진" onAdd={addRoomPhotos} onRemove={removeRoomPhoto} />
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, alignItems: "stretch" }}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "방형태", value: master.roomType || "-" },
                  { label: "면적", value: master.area ? `${master.area}㎡` : "-" },
                  { label: "부동산수수료", value: master.commFee || "-" },
                ].map((f, i) => (
                  <div key={i} style={{ padding: "8px 10px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 6 }}>💰 기준 금액</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[
                  { label: "예치금", value: master.deposit }, { label: "임대료", value: master.rent }, { label: "관리비", value: master.mgmt },
                  { label: "수도", value: master.water }, { label: "인터넷", value: master.internet }, { label: "퇴실청소비", value: master.cleanFee },
                ].map((f, i) => (
                  <div key={i} style={{ padding: "6px 8px", background: "#F0FDF4", borderRadius: 6, border: "1px solid #BBF7D0" }}>
                    <div style={{ fontSize: 8, color: "#059669", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46" }}>{f.value || "-"}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>🔌 고객번호</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[{ label: "전기", value: master.elecNo }, { label: "가스", value: master.gasNo }].map((f, i) => (
                  <div key={i} style={{ padding: "6px 8px", background: "#F5F3FF", borderRadius: 6, border: "1px solid #DDD6FE" }}>
                    <div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#4338CA", fontFamily: "monospace" }}>{f.value || "-"}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항상단</div>
                <div style={{ padding: "10px 12px", background: "#FFF7ED", borderRadius: 8, border: "1px solid #FED7AA", fontSize: 11, color: "#9A3412", lineHeight: 1.6, whiteSpace: "pre-wrap", flex: 1 }}>
                  {master.specialTerms || <span style={{ color: "#D1D5DB" }}>등록된 내용이 없습니다</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항하단</div>
                <div style={{ padding: "10px 12px", background: "#FFF7ED", borderRadius: 8, border: "1px solid #FED7AA", fontSize: 11, color: "#9A3412", lineHeight: 1.6, whiteSpace: "pre-wrap", flex: 1 }}>
                  {master.specialTermsBottom || <span style={{ color: "#D1D5DB" }}>등록된 내용이 없습니다</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <PhotoDropZone photos={roomPhotos} maxPhotos={30} label="호실 사진" onAdd={addRoomPhotos} onRemove={removeRoomPhoto} />
            </div>
          </div>
        )}

        {/* Room Account Info + Move-in calculation */}
        {(() => {
          const roomAcctKey = `${buildingName}_${selectedRoom}`;
          const roomType = getRoomType(buildingName, selectedRoom);
          const roomAcctType = roomType === "기업시설관리" ? "관리사무소" : roomType;
          const typeIndex = detailBuildingTypes.findIndex(t => {
            const at = t === "기업시설관리" ? "관리사무소" : t;
            return at === roomAcctType;
          });
          const suffix = typeIndex >= 0 ? String(typeIndex + 1) : "1";
          const bldgAcctsRaw = buildingAccounts[buildingName] || {};
          const buildingAcct = {
            mode: bldgAcctsRaw[`mode${suffix}`] || "",
            housemanAccount: bldgAcctsRaw[`housemanAccount${suffix}`] || defaultHousemanAccount,
            ownerAccounts: bldgAcctsRaw[`ownerAccounts${suffix}`] || {}
          };
          const roomOverride = buildingAccounts[roomAcctKey];
          const isRoomCustom = !!roomOverride;
          const effectiveAcct = roomOverride || buildingAcct;
          const enableRoomCustom = () => {
            setBuildingAccounts && setBuildingAccounts((prev: Record<string, any>) => ({
              ...prev,
              [roomAcctKey]: { ...buildingAcct }
            }));
          };
          const disableRoomCustom = () => {
            setBuildingAccounts && setBuildingAccounts((prev: Record<string, any>) => {
              const next = { ...prev };
              delete next[roomAcctKey];
              return next;
            });
          };
          const updateRoomAcct = (patch: Record<string, any>) => setBuildingAccounts && setBuildingAccounts((prev: Record<string, any>) => ({ ...prev, [roomAcctKey]: { ...(prev[roomAcctKey] || buildingAcct), ...patch } }));
          const setRoomAcctMode = (v: string) => updateRoomAcct({ mode: v, ownerAccounts: {} });
          const setRoomHousemanAcct = (v: string) => updateRoomAcct({ housemanAccount: v });
          const setRoomOwnerAccts = (fn: any) => { const cur = buildingAccounts[roomAcctKey] || buildingAcct; const next = typeof fn === "function" ? fn(cur.ownerAccounts) : fn; updateRoomAcct({ ownerAccounts: next }); };
          const currentOptions = modeOptions[roomAcctType] || [];
          const validMode = currentOptions.find((o: any) => o.id === effectiveAcct.mode) ? effectiveAcct.mode : "";
          const ownerFields = ownerFieldCfg[validMode] || [];
          const hmUsage = housemanUsageMap[validMode];
          const isDangiRoom = roomAcctType === "단기";
          const pn = (s: any) => { if (!s) return 0; const n = parseFloat(String(s).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
          const rmKey2 = `${buildingName}_${selectedRoom}`;
          const sr2 = saved[`room_${selectedRoom}`] || {};
          const ri2: Record<string, any> = { ...(roomMasterData[rmKey2] || {}), ...sr2 };
          const riDeposit = pn(ri2.deposit);
          const riRent = pn(ri2.rent);
          const riMgmt = pn(ri2.mgmt);
          const riWater = pn(ri2.water);
          const riInternet = pn(ri2.internet);

          const moveInCalc = (() => {
            if (!isDangiRoom) return null;
            const total = riDeposit + riRent + riMgmt + riWater + riInternet;

            if (validMode === "houseman" || validMode === "hm_owner1" || !validMode) {
              const acctName = validMode === "hm_owner1" ? "건물주계좌" : "하우스맨계좌";
              return { type: "single", acctName, items: [
                { l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }, { l: "관리비", v: riMgmt },
                { l: "수도", v: riWater }, { l: "인터넷", v: riInternet },
              ], total };
            }
            if (validMode === "owner1") {
              return { type: "dual", accounts: [
                { name: "건물주계좌", items: [{ l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }], sub: riDeposit + riRent },
                { name: "하우스맨계좌", items: [{ l: "관리비", v: riMgmt }, { l: "수도", v: riWater }, { l: "인터넷", v: riInternet }], sub: riMgmt + riWater + riInternet },
              ], total };
            }
            if (validMode === "owner2") {
              return { type: "dual", accounts: [
                { name: "건물주계좌", items: [{ l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }, { l: "관리비", v: riMgmt }], sub: riDeposit + riRent + riMgmt },
                { name: "하우스맨계좌", items: [{ l: "수도", v: riWater }, { l: "인터넷", v: riInternet }], sub: riWater + riInternet },
              ], total };
            }
            if (validMode === "owner3") {
              return { type: "dual_deferred", accounts: [
                { name: "건물주계좌", items: [{ l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }, { l: "관리비", v: riMgmt }], sub: riDeposit + riRent + riMgmt },
              ], deferred: [{ l: "수도", v: riWater }, { l: "인터넷", v: riInternet }],
              deferredSub: riWater + riInternet, total: riDeposit + riRent + riMgmt };
            }
            return null;
          })();

          return (
            <div style={{ marginTop: 14, display: isDangiRoom ? "grid" : "block", gridTemplateColumns: isDangiRoom ? "1fr 1fr" : "1fr", gap: 12 }}>
            {/* Left: Account info */}
            <div style={{ padding: "10px 14px", background: "#FFFBF0", borderRadius: 10, border: "1px solid #FDE68A" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#92400E" }}>🏦 계좌 정보</span>
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: acctTypeBg[roomAcctType], color: acctTypeColor[roomAcctType], fontWeight: 700 }}>{acctTypeLabel[roomAcctType]}</span>
              </div>
              {/* Building follow / room custom toggle */}
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                <button onClick={() => { if (isRoomCustom) disableRoomCustom(); }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: !isRoomCustom ? "1.5px solid #10B981" : "1px solid #E0E3E9", background: !isRoomCustom ? "#D1FAE5" : "#FAFBFC", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: !isRoomCustom ? "#065F46" : "#5F6577" }}>
                  🏢 건물 설정 따름
                </button>
                <button onClick={() => { if (!isRoomCustom) enableRoomCustom(); }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: isRoomCustom ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: isRoomCustom ? "#FEF3C7" : "#FAFBFC", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: isRoomCustom ? "#92400E" : "#5F6577" }}>
                  🚪 호실 개별 설정
                </button>
              </div>
              {/* Building follow: read-only display */}
              {!isRoomCustom && (
                <div style={{ opacity: 0.7 }}>
                  {!validMode && <div style={{ fontSize: 11, color: "#8F95A3", padding: "8px 0" }}>건물 계좌가 아직 설정되지 않았습니다. 건물정보에서 먼저 설정해주세요.</div>}
                  {validMode && (() => {
                    const roHm = hmUsage && (
                      <div key="hm" style={{ padding: "8px 10px", background: "#F0F4FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>🏗️ 하우스맨 계좌 <span style={{ color: "#8F95A3", fontWeight: 500 }}>({hmUsage})</span></div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", fontFamily: "monospace" }}>{effectiveAcct.housemanAccount}</div>
                      </div>
                    );
                    const roOwner = ownerFields.length > 0 && (
                      <div key="owner" style={{ padding: "8px 10px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>👤 건물주 계좌</div>
                        {ownerFields.map((f: any) => (
                          <div key={f.key} style={{ marginBottom: 4 }}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>{f.label}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#EA580C", fontFamily: "monospace" }}>
                              {effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} {effectiveAcct.ownerAccounts[f.key] || ""}{effectiveAcct.ownerAccounts[f.key + "_holder"] ? ` (${effectiveAcct.ownerAccounts[f.key + "_holder"]})` : ""}
                              {!effectiveAcct.ownerAccounts[f.key + "_bank"] && !effectiveAcct.ownerAccounts[f.key] && <span style={{ color: "#B0B5C1", fontFamily: "inherit" }}>미입력</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 9, color: "#065F46", fontWeight: 600, padding: "4px 8px", background: "#ECFDF5", borderRadius: 4 }}>건물 기본 설정을 따르고 있습니다 (읽기전용)</div>
                        {ownerFirstModes[validMode] ? <>{roOwner}{roHm}</> : <>{roHm}{roOwner}</>}
                        <div style={{ fontSize: 10, color: "#5F6577", padding: "4px 0" }}>💡 {flowMap[validMode]}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* Room custom: editable */}
              {isRoomCustom && <>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: validMode ? 8 : 0 }}>
                  {currentOptions.map((opt: any) => (
                    <button key={opt.id} onClick={() => setRoomAcctMode(opt.id)}
                      style={{ padding: "5px 10px", borderRadius: 6, border: validMode === opt.id ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: validMode === opt.id ? "#FEF3C7" : "#FAFBFC", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: validMode === opt.id ? "#92400E" : "#5F6577" }}
                      title={opt.desc}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {validMode && (() => {
                  const editHm = hmUsage && (
                    <div key="hm" style={{ padding: "8px 10px", background: "#F0F4FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>🏗️ 하우스맨 계좌 <span style={{ color: "#8F95A3", fontWeight: 500 }}>({hmUsage})</span></div>
                      {roomEditMode ? (
                        <input value={effectiveAcct.housemanAccount} onChange={e => setRoomHousemanAcct(e.target.value)}
                          style={{ ...inputStyle, padding: "6px 10px", fontSize: 11, width: "100%", fontFamily: "monospace" }} />
                      ) : (
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", fontFamily: "monospace" }}>{effectiveAcct.housemanAccount}</div>
                      )}
                    </div>
                  );
                  const editOwner = ownerFields.length > 0 && (
                    <div key="owner" style={{ padding: "8px 10px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>👤 건물주 계좌</div>
                      {ownerFields.map((f: any) => (
                        <div key={f.key} style={{ marginBottom: 4 }}>
                          <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>{f.label}</div>
                          {roomEditMode ? (
                            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px", gap: 4 }}>
                              <select value={effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} onChange={e => setRoomOwnerAccts((prev: any) => ({ ...prev, [f.key + "_bank"]: e.target.value }))}
                                style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer" }}>
                                <option value="">은행</option>
                                {banks.map((b: string) => <option key={b} value={b}>{b}</option>)}
                              </select>
                              <input value={effectiveAcct.ownerAccounts[f.key] || ""} onChange={e => setRoomOwnerAccts((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                                placeholder="계좌번호" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} />
                              <input value={effectiveAcct.ownerAccounts[f.key + "_holder"] || ""} onChange={e => setRoomOwnerAccts((prev: any) => ({ ...prev, [f.key + "_holder"]: e.target.value }))}
                                placeholder="예금주" style={{ ...inputStyle, padding: "5px 8px", fontSize: 10 }} />
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#EA580C", fontFamily: "monospace" }}>
                              {effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} {effectiveAcct.ownerAccounts[f.key] || ""}{effectiveAcct.ownerAccounts[f.key + "_holder"] ? ` (${effectiveAcct.ownerAccounts[f.key + "_holder"]})` : ""}
                              {!effectiveAcct.ownerAccounts[f.key + "_bank"] && !effectiveAcct.ownerAccounts[f.key] && <span style={{ color: "#B0B5C1", fontFamily: "inherit" }}>미입력</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {ownerFirstModes[validMode] ? <>{editOwner}{editHm}</> : <>{editHm}{editOwner}</>}
                      <div style={{ fontSize: 10, color: "#5F6577", padding: "4px 0" }}>💡 {flowMap[validMode]}</div>
                    </div>
                  );
                })()}
              </>}
            </div>

            {/* Right: Move-in calculation (단기 only) */}
            {isDangiRoom && moveInCalc && (
              <div style={{ padding: "10px 14px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#065F46", marginBottom: 4 }}>💰 입주금 계산</div>
                <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 10, lineHeight: 1.5 }}>
                  {moveInCalc.type === "single" && ((moveInCalc as any).acctName === "건물주계좌"
                    ? "이 건물은 전체 입주금을 건물주 계좌로 입금합니다."
                    : "이 건물은 전체 입주금을 하우스맨 계좌로 입금합니다."
                  )}
                  {moveInCalc.type === "dual" && validMode === "owner1" && "이 건물은 예치금+임대료는 건물주 계좌, 관리비+공과금은 하우스맨 계좌로 분리 입금합니다."}
                  {moveInCalc.type === "dual" && validMode === "owner2" && "이 건물은 예치금+임대료+관리비는 건물주 계좌, 수도+인터넷은 하우스맨 계좌로 분리 입금합니다."}
                  {moveInCalc.type === "dual_deferred" && "이 건물은 예치금+임대료+관리비는 건물주 계좌로 입금하고, 수도+인터넷은 후불로 정산합니다."}
                </div>
                {moveInCalc.type === "single" && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#065F46", marginBottom: 6, padding: "3px 8px", background: "#DCFCE7", borderRadius: 4 }}>{(moveInCalc as any).acctName}</div>
                    {(moveInCalc as any).items.filter((x: any) => x.v > 0).map((x: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", color: "#374151" }}>
                        <span>{x.l}</span>
                        <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{x.v.toLocaleString()}원</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, color: "#065F46", borderTop: "2px solid #065F46", marginTop: 6, paddingTop: 6 }}>
                      <span>합계</span>
                      <span style={{ fontFamily: "monospace" }}>{moveInCalc.total.toLocaleString()}원</span>
                    </div>
                  </div>
                )}
                {(moveInCalc.type === "dual" || moveInCalc.type === "dual_deferred") && (
                  <div>
                    {(moveInCalc as any).accounts.map((acct: any, ai: number) => (
                      <div key={ai} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: ai === 0 ? "#EA580C" : "#2563EB", marginBottom: 4, padding: "3px 8px", background: ai === 0 ? "#FFF7ED" : "#EFF6FF", borderRadius: 4 }}>{acct.name}</div>
                        {acct.items.filter((x: any) => x.v > 0).map((x: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", color: "#374151" }}>
                            <span>{x.l}</span>
                            <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{x.v.toLocaleString()}원</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: ai === 0 ? "#EA580C" : "#2563EB", borderTop: "1px solid #E5E7EB", marginTop: 3, paddingTop: 3 }}>
                          <span>소계</span>
                          <span style={{ fontFamily: "monospace" }}>{acct.sub.toLocaleString()}원</span>
                        </div>
                      </div>
                    ))}
                    {moveInCalc.type === "dual_deferred" && (moveInCalc as any).deferredSub > 0 && (
                      <div style={{ padding: "6px 8px", background: "#FEF3C7", borderRadius: 4, marginBottom: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>후불 항목</div>
                        {(moveInCalc as any).deferred.filter((x: any) => x.v > 0).map((x: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "1px 0", color: "#92400E" }}>
                            <span>{x.l}</span>
                            <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{x.v.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, color: "#065F46", borderTop: "2px solid #065F46", paddingTop: 6 }}>
                      <span>입주금 합계</span>
                      <span style={{ fontFamily: "monospace" }}>{moveInCalc.total.toLocaleString()}원</span>
                    </div>
                    {moveInCalc.type === "dual_deferred" && <div style={{ fontSize: 10, color: "#92400E", marginTop: 4 }}>※ 수도/인터넷은 후불 정산</div>}
                  </div>
                )}
              </div>
            )}
            </div>
          );
        })()}

        {/* Deposit name (bank auto-matching) */}
        {(() => {
          const depKey = `${buildingName}_${selectedRoom}`;
          const currentDepName = depositNames[depKey] || "";
          return (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#FDF4FF", borderRadius: 10, border: "1px solid #E9D5FF" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#7C3AED", marginBottom: 6 }}>🏦 입금확인 이름 <span style={{ fontSize: 9, fontWeight: 500, color: "#8F95A3" }}>이 이름으로 입금 시 자동 100% 매칭</span></div>
              {roomEditMode ? (
                <input value={currentDepName} onChange={e => setDepositNames((prev: Record<string, string>) => ({ ...prev, [depKey]: e.target.value }))}
                  placeholder="입금자명 입력 (예: 건물호실조합, 회사명 등)"
                  style={{ ...inputStyle, padding: "6px 10px", fontSize: 11, width: "100%" }} />
              ) : (
                <div style={{ fontSize: 11, fontWeight: 600, color: currentDepName ? "#7C3AED" : "#B0B5C1", padding: "4px 6px", background: "#fff", borderRadius: 5, border: "1px solid #E9D5FF" }}>
                  {currentDepName || "미설정"}
                </div>
              )}
            </div>
          );
        })()}

        {/* Room staff override */}
        {(() => {
          return (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#F0F4FF", borderRadius: 10, border: "1px solid #BFDBFE" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB" }}>👤 호실 담당자 <span style={{ fontSize: 9, fontWeight: 500, color: "#8F95A3" }}>건물 기본값 자동 적용 · 호실별 변경 가능</span></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 6 }}>
                {staffRoles.map((sr: any) => {
                  const bMgr = buildingMgrs[sr.id] || "";
                  const roomMgr = "";
                  const isOverridden = roomMgr && roomMgr !== bMgr;
                  return (
                    <div key={sr.id}>
                      <div style={{ fontSize: 8, color: sr.color, fontWeight: 700, marginBottom: 2 }}>{sr.icon} {sr.label}</div>
                      {roomEditMode ? (
                        <select defaultValue={roomMgr || ""} style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer", border: isOverridden ? `1.5px solid ${sr.color}` : undefined, background: isOverridden ? sr.color + "10" : undefined }}>
                          <option value="">{bMgr ? `${bMgr} (건물)` : "미배정"}</option>
                          {staffList.filter((s: any) => s.roles.includes(sr.id)).map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      ) : (
                        <div style={{ padding: "4px 6px", background: "#fff", borderRadius: 5, border: isOverridden ? `1.5px solid ${sr.color}` : "1px solid #E0E3E9", fontSize: 10, color: isOverridden ? sr.color : "#5F6577", fontWeight: isOverridden ? 600 : 400 }}>
                          {roomMgr || bMgr || "미배정"}
                          {isOverridden && <span style={{ fontSize: 7, marginLeft: 4, color: sr.color }}>개별</span>}
                          {!roomMgr && bMgr && <span style={{ fontSize: 7, marginLeft: 4, color: "#8F95A3" }}>(건물)</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between" }}>
        <div>
          {!roomEditMode && (
            <button onClick={() => setRoomDeleteStep(1)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🗑 호실 삭제</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {roomEditMode ? (
            <>
              <button onClick={() => setRoomEditMode(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              <button onClick={() => {
                const g = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value ?? "";
                const updated: Record<string, any> = {
                  roomType: g("re-roomType"), area: g("re-area"), commFee: g("re-commFee"),
                  deposit: g("re-deposit"), rent: g("re-rent"), mgmt: g("re-mgmt"),
                  water: g("re-water"), internet: g("re-internet"), cleanFee: g("re-cleanFee"),
                  elecNo: g("re-elecNo"), gasNo: g("re-gasNo"), specialTerms: g("re-specialTerms"), specialTermsBottom: g("re-specialTermsBottom"),
                };
                const rmKey = `${buildingName}_${selectedRoom}`;
                (roomMasterData as Record<string, any>)[rmKey] = { ...((roomMasterData as Record<string, any>)[rmKey] || {}), ...updated };
                updateBD({ [`room_${selectedRoom}`]: updated });
                setRoomEditMode(false);
              }} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
            </>
          ) : (
            <>
              <button onClick={() => setRoomEditMode(true)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✏️ 호실 정보 수정</button>
              <button onClick={() => setSelectedRoom(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>닫기</button>
            </>
          )}
        </div>
      </div>

      {/* Past tenant history */}
      {(() => {
        const historyKey = `${buildingName}_${selectedRoom}`;
        const history = pastTenantsData[historyKey] || [];
        if (history.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#6366F1", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #C7D2FE", display: "flex", alignItems: "center", gap: 6 }}>
              📜 지난 임차인 이력 <span style={{ fontSize: 10, fontWeight: 500, color: "#8F95A3" }}>{history.length}명</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {history.map((h: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "#FAFBFC", border: "1px solid #E8ECF0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#6366F1" }}>{i + 1}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{h.name}</span>
                        <span style={{ fontSize: 10, color: "#5F6577" }}>{h.phone || ""}</span>
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 600,
                          background: h.reason === "만기퇴실" ? "#D1FAE5" : "#FEF3C7",
                          color: h.reason === "만기퇴실" ? "#065F46" : "#92400E" }}>{h.reason}</span>
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 600,
                          background: h.settlement === "정산완료" ? "#EFF6FF" : "#FEF2F2",
                          color: h.settlement === "정산완료" ? "#2563EB" : "#DC2626" }}>{h.settlement}</span>
                      </div>
                      <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 1 }}>
                        {h.moveIn} ~ {h.moveOut} · 보증금 {fmt(h.deposit)} · 월세 {fmt(h.rent)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#8F95A3" }}>{h.phone}</span>
                    <button onClick={() => {
                      const lines = [
                        `퇴실정산서`,
                        `━━━━━━━━━━━━━━━━━━━━━━━━`,
                        `건물: ${buildingName}  호실: ${selectedRoom}호`,
                        `입주자: ${h.name}  연락처: ${h.phone || "-"}`,
                        ``,
                        `입주일: ${h.moveIn || "-"}`,
                        `퇴실일: ${h.moveOut || "-"}`,
                        `퇴실사유: ${h.reason || "-"}`,
                        ``,
                        `보증금: ${fmt(h.deposit)}원`,
                        `월세: ${fmt(h.rent)}원`,
                        ``,
                        `정산결과: ${h.settlement || "-"}`,
                        `━━━━━━━━━━━━━━━━━━━━━━━━`,
                        `하우스맨 건물관리 시스템`,
                      ];
                      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `퇴실정산서_${buildingName}_${selectedRoom}_${h.name}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                      style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #C7D2FE", background: "#EDE9FE", color: "#6366F1", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      📄 퇴실정산서
                    </button>
                    <button onClick={() => {
                      const lines = [
                        `임대차 계약서`,
                        `━━━━━━━━━━━━━━━━━━━━━━━━`,
                        `건물: ${buildingName}  호실: ${selectedRoom}호`,
                        `임차인: ${h.name}  연락처: ${h.phone || "-"}`,
                        ``,
                        `계약기간: ${h.moveIn || "-"} ~ ${h.moveOut || "-"}`,
                        `보증금: ${fmt(h.deposit)}원`,
                        `월세: ${fmt(h.rent)}원`,
                        ``,
                        `퇴실사유: ${h.reason || "-"}`,
                        `━━━━━━━━━━━━━━━━━━━━━━━━`,
                        `하우스맨 건물관리 시스템`,
                      ];
                      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `계약서_${buildingName}_${selectedRoom}_${h.name}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                      style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      📋 계약서
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Renewal history */}
      {(() => {
        const historyKey = `${buildingName}_${selectedRoom}`;
        const records = (pastTenantsData[historyKey] || []).filter((r: any) => r.reason === "재계약");
        if (records.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #BFDBFE", display: "flex", alignItems: "center", gap: 6 }}>
              📋 재계약 이력 <span style={{ fontSize: 10, fontWeight: 500, color: "#8F95A3" }}>{records.length}건</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {records.map((rec: any, i: number) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "#F0F9FF", border: "1px solid #BFDBFE" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{rec.name}</span>
                    <span style={{ fontSize: 10, color: "#8F95A3" }}>재계약일: {rec.renewedAt || "\u2014"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#5F6577", flexWrap: "wrap" }}>
                    <span>입주: {rec.moveIn || "\u2014"}</span>
                    <span>만기: {rec.expiry || rec.moveOut || "\u2014"}</span>
                    <span>보증금: {(rec.deposit || 0).toLocaleString()}원</span>
                    <span>월세: {(rec.rent || 0).toLocaleString()}원</span>
                    {rec.mgmt > 0 && <span>관리비: {(rec.mgmt || 0).toLocaleString()}원</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Room Delete Confirmation */}
      {roomDeleteStep > 0 && (
        <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 12, border: "2px solid #FECACA", background: "#FEF2F2" }}>
          {roomDeleteStep === 1 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#991B1B", marginBottom: 8 }}>⚠️ {selectedRoom}호를 삭제하시겠습니까?</div>
              <div style={{ fontSize: 12, color: "#B91C1C", marginBottom: 12, lineHeight: 1.6 }}>
                호실의 기본정보, 사진, 기준금액, 고객번호가 모두 삭제됩니다.
                {tenant && <><br /><strong>현재 입주자 ({tenant.name})가 있습니다. 입주자 정보도 함께 삭제됩니다.</strong></>}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setRoomDeleteStep(0)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                <button onClick={() => setRoomDeleteStep(2)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>삭제 진행</button>
              </div>
            </>
          )}
          {roomDeleteStep === 2 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#7F1D1D", marginBottom: 8 }}>🚨 되돌릴 수 없습니다!</div>
              <div style={{ fontSize: 12, color: "#991B1B", marginBottom: 6 }}>
                {buildingName} {selectedRoom}호의 모든 데이터가 영구 삭제됩니다.
              </div>
              <div style={{ padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #FECACA", marginBottom: 12, fontSize: 11, color: "#991B1B" }}>
                삭제 항목: 호실정보 · 사진 {photoCount}장 · 기준금액 · 전기/가스 고객번호{tenant ? ` · 입주자 (${tenant.name})` : ""}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setRoomDeleteStep(0)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>아니요</button>
                <button onClick={() => { setRoomDeleteStep(0); setSelectedRoom(null); }} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#7F1D1D", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🗑 영구 삭제</button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};
