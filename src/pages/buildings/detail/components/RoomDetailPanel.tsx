import React from 'react';
import { Card, PhotoDropZone } from '@/components';
import { inputClassName } from '@/components/Field';
import { getRoomType, changeRoomType, staffRoles } from '@/config';
import { rtCfg } from '@/components/RoomTypeBadge';
import {
  modeOptions, ownerFieldCfg, housemanUsageMap, ownerFirstModes,
  flowMap, banks, acctTypeBg, acctTypeColor, defaultHousemanAccount,
} from '@/config/accountConfig';
import { roomMasterData } from '@/data';
import { fmt } from '@/utils';
import { persistUpdateRoom } from '../buildingDetailApi';

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
    <Card className="mb-5 border-2 border-hm-blue">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-hm-text">🚪 {selectedRoom}호</span>
          <select value={getRoomType(buildingName, selectedRoom)} onChange={e => { changeRoomType(buildingName, selectedRoom, e.target.value); setRoomTab(roomTab); /* force re-render */ }}
            className="text-xs font-bold px-2 py-[3px] rounded-md border-[1.5px] border-hm-input-border cursor-pointer font-[inherit]"
            style={{
              background: rtCfg(getRoomType(buildingName, selectedRoom)).bg,
              color: rtCfg(getRoomType(buildingName, selectedRoom)).c }}>
            <option value="단기">단기</option><option value="일반임대">일반임대</option><option value="근생">근생</option><option value="관리사무소">관리사무소</option>
          </select>
          <span className="text-xs px-2.5 py-[3px] rounded-md font-bold"
            style={{
              background: tenant ? (tenant.overdue > 0 ? "#FEE2E2" : "#D1FAE5") : vacancy ? "#FEF3C7" : "#FEF3C7",
              color: tenant ? (tenant.overdue > 0 ? "#991B1B" : "#065F46") : vacancy ? "#92400E" : "#92400E" }}>
            {tenant ? (tenant.overdue > 0 ? "연체" : "입주중") : "공실"}
          </span>
          {master.roomType && <span className="text-xs text-hm-text-muted">{master.roomType} · {master.area}㎡</span>}
        </div>
        <button onClick={() => setSelectedRoom(null)} className="w-7 h-7 rounded-md border border-hm-input-border bg-white cursor-pointer text-sm font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
      </div>

      {/* Room Info */}
      <div>
        <div className="text-xs font-bold text-hm-blue-dark mb-2.5 pb-1.5 border-b-2 border-[#BFDBFE] flex items-center gap-1.5">
          📋 호실 기본정보 <span className="text-xs font-medium text-hm-text-muted">이 정보가 공실관리 · 홈페이지의 기준값이 됩니다</span>
        </div>
        {roomEditMode ? (
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-stretch">
            <div>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <div><div className="text-xs text-hm-text-muted mb-1">방형태</div>
                  <select id="re-roomType" defaultValue={master.roomType || ""} className={`${inputClassName} !px-2 !py-1.5 !text-xs`}><option value="">선택</option>{["원룸","투룸","쓰리룸","복층","상가","사무실"].map(t => <option key={t}>{t}</option>)}</select></div>
                <div><div className="text-xs text-hm-text-muted mb-1">면적 (㎡)</div>
                  <input id="re-area" defaultValue={master.area || ""} placeholder="26.4" className={`${inputClassName} !px-2 !py-1.5 !text-xs`} /></div>
                <div><div className="text-xs text-hm-text-muted mb-1">부동산수수료</div>
                  <input id="re-commFee" defaultValue={master.commFee || ""} placeholder="100,000" className={`${inputClassName} !px-2 !py-1.5 !text-xs text-right`} /></div>
              </div>
              <div className="text-xs font-bold text-hm-success mb-1.5">💰 기준 금액</div>
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                {[
                  { label: "예치금", key: "deposit", value: master.deposit }, { label: "임대료", key: "rent", value: master.rent }, { label: "관리비", key: "mgmt", value: master.mgmt },
                  { label: "수도", key: "water", value: master.water }, { label: "인터넷", key: "internet", value: master.internet }, { label: "퇴실청소비", key: "cleanFee", value: master.cleanFee },
                ].map((f, i) => (
                  <div key={i}><div className="text-[8px] text-hm-success mb-1">{f.label}</div>
                    <input id={`re-${f.key}`} defaultValue={f.value || ""} placeholder="0" className={`${inputClassName} !px-2 !py-[5px] !text-xs text-right`} /></div>
                ))}
              </div>
              <div className="text-xs font-bold text-[#6366F1] mb-1.5">🔌 고객번호</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div><div className="text-[8px] text-[#6366F1] mb-1">전기</div>
                  <input id="re-elecNo" defaultValue={master.elecNo || ""} className={`${inputClassName} !px-2 !py-[5px] !text-xs font-mono`} /></div>
                <div><div className="text-[8px] text-[#6366F1] mb-1">가스</div>
                  <input id="re-gasNo" defaultValue={master.gasNo || ""} className={`${inputClassName} !px-2 !py-[5px] !text-xs font-mono`} /></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col flex-1">
                <div className="text-xs font-bold text-hm-warning mb-1">📝 계약시 특약사항상단</div>
                <textarea id="re-specialTerms" defaultValue={master.specialTerms || ""} placeholder="특약사항 상단 입력..."
                  className={`${inputClassName} !px-2.5 !py-2 !text-xs resize-none leading-relaxed w-full flex-1`} />
              </div>
              <div className="flex flex-col flex-1">
                <div className="text-xs font-bold text-hm-warning mb-1">📝 계약시 특약사항하단</div>
                <textarea id="re-specialTermsBottom" defaultValue={master.specialTermsBottom || ""} placeholder="특약사항 하단 입력..."
                  className={`${inputClassName} !px-2.5 !py-2 !text-xs resize-none leading-relaxed w-full flex-1`} />
              </div>
            </div>
            <div className="flex flex-col">
              <PhotoDropZone photos={roomPhotos} maxPhotos={30} label="호실 사진" onAdd={addRoomPhotos} onRemove={removeRoomPhoto} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-stretch">
            <div>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {[
                  { label: "방형태", value: master.roomType || "-" },
                  { label: "면적", value: master.area ? `${master.area}㎡` : "-" },
                  { label: "부동산수수료", value: master.commFee || "-" },
                ].map((f, i) => (
                  <div key={i} className="px-2.5 py-2 bg-hm-bg-slate rounded-lg border border-hm-border">
                    <div className="text-xs text-hm-text-muted mb-[3px]">{f.label}</div>
                    <div className="text-xs font-bold text-hm-text">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs font-bold text-hm-success mb-1.5">💰 기준 금액</div>
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                {[
                  { label: "예치금", value: master.deposit }, { label: "임대료", value: master.rent }, { label: "관리비", value: master.mgmt },
                  { label: "수도", value: master.water }, { label: "인터넷", value: master.internet }, { label: "퇴실청소비", value: master.cleanFee },
                ].map((f, i) => (
                  <div key={i} className="px-2 py-1.5 bg-[#F0FDF4] rounded-md border border-[#BBF7D0]">
                    <div className="text-[8px] text-hm-success mb-1">{f.label}</div>
                    <div className="text-xs font-bold text-[#065F46]">{f.value || "-"}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs font-bold text-[#6366F1] mb-1.5">🔌 고객번호</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[{ label: "전기", value: master.elecNo }, { label: "가스", value: master.gasNo }].map((f, i) => (
                  <div key={i} className="px-2 py-1.5 bg-[#F5F3FF] rounded-md border border-[#DDD6FE]">
                    <div className="text-[8px] text-[#6366F1] mb-1">{f.label}</div>
                    <div className="text-xs font-semibold text-[#4338CA] font-mono">{f.value || "-"}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col flex-1">
                <div className="text-xs font-bold text-hm-warning mb-1">📝 계약시 특약사항상단</div>
                <div className="px-3 py-2.5 bg-hm-warning-bg rounded-lg border border-hm-warning-border text-xs text-[#9A3412] leading-relaxed whitespace-pre-wrap flex-1">
                  {master.specialTerms || <span className="text-gray-300">등록된 내용이 없습니다</span>}
                </div>
              </div>
              <div className="flex flex-col flex-1">
                <div className="text-xs font-bold text-hm-warning mb-1">📝 계약시 특약사항하단</div>
                <div className="px-3 py-2.5 bg-hm-warning-bg rounded-lg border border-hm-warning-border text-xs text-[#9A3412] leading-relaxed whitespace-pre-wrap flex-1">
                  {master.specialTermsBottom || <span className="text-gray-300">등록된 내용이 없습니다</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col">
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
            <div className={`mt-3.5 ${isDangiRoom ? 'grid grid-cols-2 gap-3' : 'block'}`}>
            {/* Left: Account info */}
            <div className="px-4 py-2.5 bg-[#FFFBF0] rounded-[10px] border border-[#FDE68A]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-bold text-[#92400E]">🏦 계좌 정보</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: acctTypeBg[roomAcctType], color: acctTypeColor[roomAcctType] }}>{acctTypeLabel[roomAcctType]}</span>
              </div>
              {/* Building follow / room custom toggle */}
              <div className="flex gap-1 mb-2.5">
                <button onClick={() => { if (isRoomCustom) disableRoomCustom(); }}
                  className={`px-3 py-[5px] rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors ${!isRoomCustom ? 'border-[1.5px] border-[#10B981] bg-[#D1FAE5] text-[#065F46]' : 'border border-hm-input-border bg-[#FAFBFC] text-hm-text-sub'}`}>
                  🏢 건물 설정 따름
                </button>
                <button onClick={() => { if (!isRoomCustom) enableRoomCustom(); }}
                  className={`px-3 py-[5px] rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors ${isRoomCustom ? 'border-[1.5px] border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]' : 'border border-hm-input-border bg-[#FAFBFC] text-hm-text-sub'}`}>
                  🚪 호실 개별 설정
                </button>
              </div>
              {/* Building follow: read-only display */}
              {!isRoomCustom && (
                <div className="opacity-70">
                  {!validMode && <div className="text-xs text-hm-text-muted py-2">건물 계좌가 아직 설정되지 않았습니다. 건물정보에서 먼저 설정해주세요.</div>}
                  {validMode && (() => {
                    const roHm = hmUsage && (
                      <div key="hm" className="px-2.5 py-2 bg-[#F0F4FF] rounded-md border border-[#BFDBFE]">
                        <div className="text-xs font-bold text-hm-blue-dark mb-1">🏗️ 하우스맨 계좌 <span className="text-hm-text-muted font-medium">({hmUsage})</span></div>
                        <div className="text-xs font-semibold text-hm-blue-dark font-mono">{effectiveAcct.housemanAccount}</div>
                      </div>
                    );
                    const roOwner = ownerFields.length > 0 && (
                      <div key="owner" className="px-2.5 py-2 bg-hm-warning-bg rounded-md border border-hm-warning-border">
                        <div className="text-xs font-bold text-hm-warning mb-1">👤 건물주 계좌</div>
                        {ownerFields.map((f: any) => (
                          <div key={f.key} className="mb-1">
                            <div className="text-[8px] font-bold text-hm-warning mb-1">{f.label}</div>
                            <div className="text-xs font-semibold text-hm-warning font-mono">
                              {effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} {effectiveAcct.ownerAccounts[f.key] || ""}{effectiveAcct.ownerAccounts[f.key + "_holder"] ? ` (${effectiveAcct.ownerAccounts[f.key + "_holder"]})` : ""}
                              {!effectiveAcct.ownerAccounts[f.key + "_bank"] && !effectiveAcct.ownerAccounts[f.key] && <span className="text-[#B0B5C1] font-sans">미입력</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs text-[#065F46] font-semibold px-2 py-1 bg-hm-success-bg rounded">건물 기본 설정을 따르고 있습니다 (읽기전용)</div>
                        {ownerFirstModes[validMode] ? <>{roOwner}{roHm}</> : <>{roHm}{roOwner}</>}
                        <div className="text-xs text-hm-text-sub py-1">💡 {flowMap[validMode]}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* Room custom: editable */}
              {isRoomCustom && <>
                <div className={`flex gap-1 flex-wrap ${validMode ? 'mb-2' : ''}`}>
                  {currentOptions.map((opt: any) => (
                    <button key={opt.id} onClick={() => setRoomAcctMode(opt.id)}
                      className={`px-2.5 py-[5px] rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors ${validMode === opt.id ? 'border-[1.5px] border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]' : 'border border-hm-input-border bg-[#FAFBFC] text-hm-text-sub'}`}
                      title={opt.desc}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {validMode && (() => {
                  const editHm = hmUsage && (
                    <div key="hm" className="px-2.5 py-2 bg-[#F0F4FF] rounded-md border border-[#BFDBFE]">
                      <div className="text-xs font-bold text-hm-blue-dark mb-1">🏗️ 하우스맨 계좌 <span className="text-hm-text-muted font-medium">({hmUsage})</span></div>
                      {roomEditMode ? (
                        <input value={effectiveAcct.housemanAccount} onChange={e => setRoomHousemanAcct(e.target.value)}
                          className={`${inputClassName} !px-2.5 !py-1.5 !text-xs w-full font-mono`} />
                      ) : (
                        <div className="text-xs font-semibold text-hm-blue-dark font-mono">{effectiveAcct.housemanAccount}</div>
                      )}
                    </div>
                  );
                  const editOwner = ownerFields.length > 0 && (
                    <div key="owner" className="px-2.5 py-2 bg-hm-warning-bg rounded-md border border-hm-warning-border">
                      <div className="text-xs font-bold text-hm-warning mb-1">👤 건물주 계좌</div>
                      {ownerFields.map((f: any) => (
                        <div key={f.key} className="mb-1">
                          <div className="text-[8px] font-bold text-hm-warning mb-1">{f.label}</div>
                          {roomEditMode ? (
                            <div className="grid grid-cols-[90px_1fr_70px] gap-1">
                              <select value={effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} onChange={e => setRoomOwnerAccts((prev: any) => ({ ...prev, [f.key + "_bank"]: e.target.value }))}
                                className={`${inputClassName} !px-1.5 !py-[5px] !text-xs cursor-pointer`}>
                                <option value="">은행</option>
                                {banks.map((b: string) => <option key={b} value={b}>{b}</option>)}
                              </select>
                              <input value={effectiveAcct.ownerAccounts[f.key] || ""} onChange={e => setRoomOwnerAccts((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                                placeholder="계좌번호" className={`${inputClassName} !px-2 !py-[5px] !text-xs font-mono`} />
                              <input value={effectiveAcct.ownerAccounts[f.key + "_holder"] || ""} onChange={e => setRoomOwnerAccts((prev: any) => ({ ...prev, [f.key + "_holder"]: e.target.value }))}
                                placeholder="예금주" className={`${inputClassName} !px-2 !py-[5px] !text-xs`} />
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-hm-warning font-mono">
                              {effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} {effectiveAcct.ownerAccounts[f.key] || ""}{effectiveAcct.ownerAccounts[f.key + "_holder"] ? ` (${effectiveAcct.ownerAccounts[f.key + "_holder"]})` : ""}
                              {!effectiveAcct.ownerAccounts[f.key + "_bank"] && !effectiveAcct.ownerAccounts[f.key] && <span className="text-[#B0B5C1] font-sans">미입력</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                  return (
                    <div className="flex flex-col gap-1.5">
                      {ownerFirstModes[validMode] ? <>{editOwner}{editHm}</> : <>{editHm}{editOwner}</>}
                      <div className="text-xs text-hm-text-sub py-1">💡 {flowMap[validMode]}</div>
                    </div>
                  );
                })()}
              </>}
            </div>

            {/* Right: Move-in calculation (단기 only) */}
            {isDangiRoom && moveInCalc && (
              <div className="px-4 py-2.5 bg-[#F0FDF4] rounded-[10px] border border-[#BBF7D0]">
                <div className="text-xs font-bold text-[#065F46] mb-1">💰 입주금 계산</div>
                <div className="text-xs text-gray-500 mb-2.5 leading-relaxed">
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
                    <div className="text-xs font-bold text-[#065F46] mb-1.5 px-2 py-[3px] bg-[#DCFCE7] rounded">{(moveInCalc as any).acctName}</div>
                    {(moveInCalc as any).items.filter((x: any) => x.v > 0).map((x: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-[3px] text-gray-700">
                        <span>{x.l}</span>
                        <span className="font-semibold font-mono">{x.v.toLocaleString()}원</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold text-[#065F46] border-t-2 border-[#065F46] mt-1.5 pt-1.5">
                      <span>합계</span>
                      <span className="font-mono">{moveInCalc.total.toLocaleString()}원</span>
                    </div>
                  </div>
                )}
                {(moveInCalc.type === "dual" || moveInCalc.type === "dual_deferred") && (
                  <div>
                    {(moveInCalc as any).accounts.map((acct: any, ai: number) => (
                      <div key={ai} className="mb-2">
                        <div className={`text-xs font-bold mb-1 px-2 py-[3px] rounded ${ai === 0 ? 'text-hm-warning bg-hm-warning-bg' : 'text-hm-blue-dark bg-hm-blue-bg'}`}>{acct.name}</div>
                        {acct.items.filter((x: any) => x.v > 0).map((x: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs py-0.5 text-gray-700">
                            <span>{x.l}</span>
                            <span className="font-semibold font-mono">{x.v.toLocaleString()}원</span>
                          </div>
                        ))}
                        <div className={`flex justify-between text-xs font-bold border-t border-gray-200 mt-[3px] pt-[3px] ${ai === 0 ? 'text-hm-warning' : 'text-hm-blue-dark'}`}>
                          <span>소계</span>
                          <span className="font-mono">{acct.sub.toLocaleString()}원</span>
                        </div>
                      </div>
                    ))}
                    {moveInCalc.type === "dual_deferred" && (moveInCalc as any).deferredSub > 0 && (
                      <div className="px-2 py-1.5 bg-[#FEF3C7] rounded mb-2">
                        <div className="text-xs font-bold text-[#92400E] mb-[3px]">후불 항목</div>
                        {(moveInCalc as any).deferred.filter((x: any) => x.v > 0).map((x: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs py-[1px] text-[#92400E]">
                            <span>{x.l}</span>
                            <span className="font-semibold font-mono">{x.v.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#065F46] border-t-2 border-[#065F46] pt-1.5">
                      <span>입주금 합계</span>
                      <span className="font-mono">{moveInCalc.total.toLocaleString()}원</span>
                    </div>
                    {moveInCalc.type === "dual_deferred" && <div className="text-xs text-[#92400E] mt-1">※ 수도/인터넷은 후불 정산</div>}
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
            <div className="mt-3.5 px-4 py-2.5 bg-[#FDF4FF] rounded-[10px] border border-[#E9D5FF]">
              <div className="text-xs font-bold text-[#7C3AED] mb-1.5">🏦 입금확인 이름 <span className="text-xs font-medium text-hm-text-muted">이 이름으로 입금 시 자동 100% 매칭</span></div>
              {roomEditMode ? (
                <input value={currentDepName} onChange={e => setDepositNames((prev: Record<string, string>) => ({ ...prev, [depKey]: e.target.value }))}
                  placeholder="입금자명 입력 (예: 건물호실조합, 회사명 등)"
                  className={`${inputClassName} !px-2.5 !py-1.5 !text-xs w-full`} />
              ) : (
                <div className={`text-xs font-semibold px-1.5 py-1 bg-white rounded-[5px] border border-[#E9D5FF] ${currentDepName ? 'text-[#7C3AED]' : 'text-[#B0B5C1]'}`}>
                  {currentDepName || "미설정"}
                </div>
              )}
            </div>
          );
        })()}

        {/* Room staff override */}
        {(() => {
          return (
            <div className="mt-3.5 px-4 py-2.5 bg-[#F0F4FF] rounded-[10px] border border-[#BFDBFE]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-hm-blue-dark">👤 호실 담당자 <span className="text-xs font-medium text-hm-text-muted">건물 기본값 자동 적용 · 호실별 변경 가능</span></div>
              </div>
              <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
                {staffRoles.map((sr: any) => {
                  const bMgr = buildingMgrs[sr.id] || "";
                  const roomMgr = "";
                  const isOverridden = roomMgr && roomMgr !== bMgr;
                  return (
                    <div key={sr.id}>
                      <div className="text-[8px] font-bold mb-1" style={{ color: sr.color }}>{sr.icon} {sr.label}</div>
                      {roomEditMode ? (
                        <select defaultValue={roomMgr || ""} className={`${inputClassName} !px-1.5 !py-[5px] !text-xs cursor-pointer`}
                          style={{ border: isOverridden ? `1.5px solid ${sr.color}` : undefined, background: isOverridden ? sr.color + "10" : undefined }}>
                          <option value="">{bMgr ? `${bMgr} (건물)` : "미배정"}</option>
                          {staffList.filter((s: any) => s.roles.includes(sr.id)).map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      ) : (
                        <div className={`px-1.5 py-1 bg-white rounded-[5px] text-xs ${isOverridden ? 'font-semibold' : 'font-normal'}`}
                          style={{
                            border: isOverridden ? `1.5px solid ${sr.color}` : "1px solid var(--color-hm-input-border)",
                            color: isOverridden ? sr.color : "var(--color-hm-text-sub)"
                          }}>
                          {roomMgr || bMgr || "미배정"}
                          {isOverridden && <span className="text-[7px] ml-1" style={{ color: sr.color }}>개별</span>}
                          {!roomMgr && bMgr && <span className="text-[7px] ml-1 text-hm-text-muted">(건물)</span>}
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
      <div className="flex gap-2 mt-4 justify-between">
        <div>
          {!roomEditMode && (
            <button onClick={() => setRoomDeleteStep(1)} className="px-5 py-2 rounded-lg border-[1.5px] border-hm-danger-border bg-hm-danger-bg text-hm-danger font-bold text-xs cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">🗑 호실 삭제</button>
          )}
        </div>
        <div className="flex gap-2">
          {roomEditMode ? (
            <>
              <button onClick={() => setRoomEditMode(false)} className="px-5 py-2 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
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
                persistUpdateRoom(buildingName, selectedRoom, updated);
                setRoomEditMode(false);
              }} className="px-5 py-2 rounded-lg border-none bg-hm-success text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">💾 저장</button>
            </>
          ) : (
            <>
              <button onClick={() => setRoomEditMode(true)} className="px-5 py-2 rounded-lg border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark font-bold text-xs cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">✏️ 호실 정보 수정</button>
              <button onClick={() => setSelectedRoom(null)} className="px-5 py-2 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">닫기</button>
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
          <div className="mt-4">
            <div className="text-xs font-bold text-[#6366F1] mb-2 pb-1.5 border-b-[1.5px] border-[#C7D2FE] flex items-center gap-1.5">
              📜 지난 임차인 이력 <span className="text-xs font-medium text-hm-text-muted">{history.length}명</span>
            </div>
            <div className="flex flex-col gap-1">
              {history.map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-hm-bg-hover border border-hm-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#EDE9FE] flex items-center justify-center text-xs font-bold text-[#6366F1]">{i + 1}</div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-hm-text">{h.name}</span>
                        <span className="text-xs text-hm-text-sub">{h.phone || ""}</span>
                        <span className={`text-xs px-[5px] py-[1px] rounded font-semibold ${h.reason === "만기퇴실" ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>{h.reason}</span>
                        <span className={`text-xs px-[5px] py-[1px] rounded font-semibold ${h.settlement === "정산완료" ? 'bg-hm-blue-bg text-hm-blue-dark' : 'bg-hm-danger-bg text-hm-danger'}`}>{h.settlement}</span>
                      </div>
                      <div className="text-xs text-hm-text-muted mt-[1px]">
                        {h.moveIn} ~ {h.moveOut} · 보증금 {fmt(h.deposit)} · 월세 {fmt(h.rent)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-hm-text-muted">{h.phone}</span>
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
                      className="px-2 py-[3px] rounded-[5px] border border-[#C7D2FE] bg-[#EDE9FE] text-[#6366F1] text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:opacity-80 transition-opacity">
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
                      className="px-2 py-[3px] rounded-[5px] border border-[#BFDBFE] bg-hm-blue-bg text-hm-blue-dark text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:opacity-80 transition-opacity">
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
          <div className="mt-4">
            <div className="text-xs font-bold text-hm-blue-dark mb-2 pb-1.5 border-b-[1.5px] border-[#BFDBFE] flex items-center gap-1.5">
              📋 재계약 이력 <span className="text-xs font-medium text-hm-text-muted">{records.length}건</span>
            </div>
            <div className="flex flex-col gap-1">
              {records.map((rec: any, i: number) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-[#F0F9FF] border border-[#BFDBFE]">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold">{rec.name}</span>
                    <span className="text-xs text-hm-text-muted">재계약일: {rec.renewedAt || "\u2014"}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-hm-text-sub flex-wrap">
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
        <div className="mt-4 px-5 py-4 rounded-xl border-2 border-hm-danger-border bg-hm-danger-bg">
          {roomDeleteStep === 1 && (
            <>
              <div className="text-sm font-bold text-[#991B1B] mb-2">⚠️ {selectedRoom}호를 삭제하시겠습니까?</div>
              <div className="text-xs text-[#B91C1C] mb-3 leading-relaxed">
                호실의 기본정보, 사진, 기준금액, 고객번호가 모두 삭제됩니다.
                {tenant && <><br /><strong>현재 입주자 ({tenant.name})가 있습니다. 입주자 정보도 함께 삭제됩니다.</strong></>}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRoomDeleteStep(0)} className="px-5 py-2 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                <button onClick={() => setRoomDeleteStep(2)} className="px-5 py-2 rounded-lg border-none bg-hm-danger text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">삭제 진행</button>
              </div>
            </>
          )}
          {roomDeleteStep === 2 && (
            <>
              <div className="text-sm font-bold text-[#7F1D1D] mb-2">🚨 되돌릴 수 없습니다!</div>
              <div className="text-xs text-[#991B1B] mb-1.5">
                {buildingName} {selectedRoom}호의 모든 데이터가 영구 삭제됩니다.
              </div>
              <div className="px-3 py-2 bg-white rounded-lg border border-hm-danger-border mb-3 text-xs text-[#991B1B]">
                삭제 항목: 호실정보 · 사진 {photoCount}장 · 기준금액 · 전기/가스 고객번호{tenant ? ` · 입주자 (${tenant.name})` : ""}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRoomDeleteStep(0)} className="px-5 py-2 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">아니요</button>
                <button onClick={() => { setRoomDeleteStep(0); setSelectedRoom(null); }} className="px-5 py-2 rounded-lg border-none bg-[#7F1D1D] text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">🗑 영구 삭제</button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};
