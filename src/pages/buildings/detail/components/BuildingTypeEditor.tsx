import React from 'react';
import { Card, SectionTitle, Table, StatusBadge } from '@/components';
import { inputClassName } from '@/components/Field';
import { rtCfg } from '@/components/RoomTypeBadge';
import { getRoomType } from '@/config';
import {
  modeOptions, ownerFieldCfg, housemanUsageMap,
  flowMap, acctTypeBg, acctTypeColor, defaultHousemanAccount,
} from '@/config/accountConfig';
import { fmt } from '@/utils';
import { persistDeleteBuilding } from '../buildingDetailApi';

const statusStyle = (status: string) => {
  switch (status) {
    case "공실": return { bg: "#FEF3C7", border: "#FDE68A", color: "#92400E", icon: "□" };
    case "연체": return { bg: "#FEE2E2", border: "var(--color-hm-danger-border)", color: "#991B1B", icon: "!" };
    default: return { bg: "#D1FAE5", border: "var(--color-hm-success-border)", color: "#065F46", icon: "●" };
  }
};

interface BuildingTypeEditorProps {
  isMobile: boolean;
  buildingName: string;
  bldg: Record<string, any>;
  detail: Record<string, any>;
  detailBuildingTypes: string[];
  buildingAccounts: Record<string, any>;
  buildingMgrs: Record<string, string>;
  bdMgmtType: string;
  typeCounts: Record<string, number>;
  overdueCount: number;
  bldgTenants: Record<string, any>[];
  bldgVacancies: Record<string, any>[];
  bldgAS: Record<string, any>[];
  pastTenantsData: Record<string, any>;
  vendorEnabled: Record<string, boolean>;
  floorKeys: string[];
  getRoomStatus: (room: string) => Record<string, any>;
  // Preview modal
  showDetailPreview: boolean;
  setShowDetailPreview: (v: boolean) => void;
  // Delete modal
  deleteStep: number;
  setDeleteStep: (v: number) => void;
  onBack: () => void;
  supabaseId?: string;
  setAllBuildings?: (fn: (prev: any) => any) => void;
  // Photo view
  photoViewTarget: Record<string, any> | null;
  setPhotoViewTarget: (v: Record<string, any> | null) => void;
}

export const BuildingTypeEditor: React.FC<BuildingTypeEditorProps> = ({
  isMobile, buildingName, bldg, detail,
  detailBuildingTypes, buildingAccounts,
  buildingMgrs, bdMgmtType,
  typeCounts, overdueCount,
  bldgTenants, bldgVacancies, bldgAS, pastTenantsData,
  vendorEnabled, floorKeys, getRoomStatus,
  showDetailPreview, setShowDetailPreview,
  deleteStep, setDeleteStep, onBack,
  supabaseId, setAllBuildings,
  photoViewTarget, setPhotoViewTarget,
}) => {
  return (
    <>
      {/* Preview Modal */}
      {showDetailPreview && (() => {
        const previewAcctTypes = detailBuildingTypes.map(t => t === "기업시설관리" ? "관리사무소" : t);
        const previewAccts = buildingAccounts[buildingName] || { mode1: "", housemanAccount1: defaultHousemanAccount, ownerAccounts1: {}, mode2: "", housemanAccount2: defaultHousemanAccount, ownerAccounts2: {}, mode3: "", housemanAccount3: defaultHousemanAccount, ownerAccounts3: {} };
        return (
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[9999] overflow-y-auto px-5 py-10">
            <div className="bg-white rounded-2xl max-w-[800px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              {/* Preview Header */}
              <div className="px-7 py-5 rounded-t-2xl flex justify-between items-center" style={{ background: "linear-gradient(135deg, var(--color-hm-text) 0%, #2D3748 100%)" }}>
                <div>
                  <div className="text-lg font-bold text-white">📋 {buildingName} 미리보기</div>
                  <div className="text-xs text-[#A0AEC0] mt-0.5">{detailBuildingTypes.join(" + ")} · {bldg.rooms}실 · {detail.owner && `건물주: ${detail.owner}`}</div>
                </div>
                <button onClick={() => setShowDetailPreview(false)} className="px-5 py-2 rounded-lg border-[1.5px] border-[#A0AEC0] bg-transparent text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-white/10 transition-colors">✕ 닫기</button>
              </div>

              <div className="px-7 py-5">
                {/* Preview: Basic Info */}
                <div className="mb-4">
                  <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">📋 기본 정보</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "건물명", v: buildingName },
                      { l: "건물 유형", v: detailBuildingTypes.join(" + ") },
                      { l: "주소", v: "서울 관악구 봉천동 123-45" },
                      { l: "관리시작일", v: detail.start },
                      { l: "전체 호실", v: `${bldg.rooms}실` },
                      { l: "입주", v: `${bldg.occupied}실` },
                      { l: "공실", v: `${bldgVacancies.length}실` },
                      { l: "연체", v: overdueCount > 0 ? `${overdueCount}건` : "" },
                    ].filter(x => x.v).map((x, i) => (
                      <div key={i} className="flex gap-2 py-[5px] border-b border-gray-50">
                        <span className="text-xs text-hm-text-muted font-semibold min-w-[80px]">{x.l}</span>
                        <span className="text-xs font-bold text-hm-text">{x.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {Object.entries(typeCounts).filter(([,v]) => v > 0).map(([t, v]) => (
                      <span key={t} className="text-xs font-bold px-2.5 py-[3px] rounded" style={{ background: rtCfg(t).bg, color: rtCfg(t).c }}>{t} {v}</span>
                    ))}
                  </div>
                </div>

                {/* Preview: Owner Info */}
                {detail.owner && (
                  <div className="mb-4">
                    <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">👤 건물주 정보</div>
                    <div className="px-3 py-2 bg-[#F0F4FF] rounded-lg mb-2">
                      <div className="text-xs font-bold text-hm-blue-dark mb-1.5">건물주 1 (주)</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div><span className="text-xs text-hm-text-muted">이름</span><div className="text-xs font-bold">{detail.owner}</div></div>
                        {detail.ownerPhone && <div><span className="text-xs text-hm-text-muted">전화번호</span><div className="text-xs font-bold">{detail.ownerPhone}</div></div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview: Account Info */}
                {(previewAccts.mode1 || previewAccts.mode2) && (
                  <div className="mb-4">
                    <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">🏦 건물 계좌 정보</div>
                    <div className={`grid gap-2.5 ${previewAcctTypes.length === 3 ? 'grid-cols-3' : previewAcctTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {previewAcctTypes.map((aType, ai) => {
                        const suffix = String(ai + 1);
                        const curMode = previewAccts[`mode${suffix}`];
                        if (!curMode) return null;
                        const curOptions = modeOptions[aType] || [];
                        const modeLabel = curOptions.find((o: any) => o.id === curMode)?.label || curMode;
                        const curOwnerFields = ownerFieldCfg[curMode] || [];
                        const hmUsage = housemanUsageMap[curMode];
                        return (
                          <div key={aType} className="px-3 py-2.5 rounded-lg" style={{ background: acctTypeBg[aType], border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                            <div className="text-xs font-bold mb-1.5" style={{ color: acctTypeColor[aType] }}>{aType} · {modeLabel}</div>
                            <div className="text-xs text-hm-text-sub mb-1">💡 {flowMap[curMode]}</div>
                            {hmUsage && (
                              <div className="text-xs mb-1">
                                <span className="text-hm-blue-dark font-semibold">하우스맨 계좌 ({hmUsage}):</span>
                                <span className="font-mono ml-1">{previewAccts[`housemanAccount${suffix}`]}</span>
                              </div>
                            )}
                            {curOwnerFields.map((f: any) => {
                              const accts = previewAccts[`ownerAccounts${suffix}`] || {};
                              const bank = accts[f.key + "_bank"] || "";
                              const num = accts[f.key] || "";
                              const holder = accts[f.key + "_holder"] || "";
                              if (!bank && !num && !holder) return null;
                              return (
                                <div key={f.key} className="text-xs mb-0.5">
                                  <span className="text-hm-warning font-semibold">{f.label}:</span>
                                  <span className="font-mono ml-1">{[bank, num, holder].filter(Boolean).join(" ")}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preview: Staff & Contract */}
                <div className="mb-4">
                  <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">🏢 담당자 & 계약 조건</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { l: "수수료", v: bldg.feeType === "pct" ? `${(bldg.fee * 100)}%` : (bldg.fixedFee ? `${bldg.fixedFee.toLocaleString()}원` : "") },
                      { l: "수수료 유형", v: bldg.feeType === "pct" ? "수수료율" : "정액제" },
                      { l: "관리비 유형", v: bdMgmtType || "변동관리비" },
                      { l: "관리시작일", v: detail.start },
                    ].filter(x => x.v).map((x, i) => (
                      <div key={i} className="py-1 border-b border-gray-50">
                        <span className="text-xs text-hm-text-muted">{x.l}</span>
                        <div className="text-xs font-bold">{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview: Vendors */}
                {Object.values(vendorEnabled).some(v => v) && (
                  <div className="mb-4">
                    <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">🔧 협력업체</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981" },
                        { key: "elevator", label: "승강기", icon: "🛗", color: "var(--color-hm-blue)" },
                        { key: "fire", label: "소방", icon: "🔥", color: "var(--color-hm-danger)" },
                        { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1" },
                        { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6" },
                        { key: "custom1", label: "기타1", icon: "📋", color: "#64748B" },
                        { key: "custom2", label: "기타2", icon: "📋", color: "#64748B" },
                      ].filter(v => vendorEnabled[v.key]).map(v => (
                        <span key={v.key} className="px-3 py-1 rounded-md text-xs font-bold" style={{ background: v.color + "15", color: v.color, border: `1px solid ${v.color}40` }}>
                          {v.icon} {v.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview: Floor/Room Status */}
                <div className="mb-4">
                  <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">🏗️ 층별 호실 현황</div>
                  <div className="flex flex-col gap-1">
                    {floorKeys.map(floor => {
                      const rooms = detail.floors[floor];
                      return (
                        <div key={floor} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white bg-[#1B1F2E] px-2.5 py-1 rounded-md min-w-[36px] text-center">{floor}</span>
                          <div className="flex flex-wrap gap-1">
                            {rooms.map((room: string) => {
                              const info = getRoomStatus(room);
                              const st = statusStyle(info.status === "정상" ? "입주" : info.status === "연체" ? "연체" : info.status);
                              return (
                                <span key={room} className="px-2 py-[3px] rounded text-xs font-bold" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                  {room}{info.name ? ` ${info.name}` : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preview: Past tenant photos */}
                {(() => {
                  const pastKeys = Object.keys(pastTenantsData).filter(k => k.startsWith(buildingName + "_"));
                  if (pastKeys.length === 0) return null;
                  return (
                    <div className="mb-4">
                      <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">📷 퇴실자 사진 ({pastKeys.length}건)</div>
                      <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {pastKeys.slice(0, 6).map(k => {
                          const rawRec = pastTenantsData[k];
                          const records = Array.isArray(rawRec) ? rawRec : [rawRec].filter(Boolean);
                          if (records.length === 0) return null;
                          const last = records[records.length - 1];
                          const room = k.split("_")[1];
                          return (
                            <div key={k} className="px-3 py-2 rounded-lg border-[1.5px] border-hm-danger-border bg-hm-danger-bg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPhotoViewTarget({ key: k, room, records })}>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">{room}호 {last?.name}</span>
                                <span className="text-xs text-hm-text-muted">{last?.moveOut || ""}</span>
                              </div>
                              <div className="text-xs text-hm-text-muted mt-0.5">
                                입주 {(last?.moveInPhotos||[]).length}장 · 퇴실 {(last?.moveOutPhotos||[]).length}장
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Preview: AS Status */}
                {bldgAS.length > 0 && (
                  <div className="mb-2">
                    <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">🔧 AS 현황 ({bldgAS.length}건)</div>
                    <div className="flex flex-col gap-1">
                      {bldgAS.map((a: any, i: number) => (
                        <div key={i} className={`flex gap-2 px-2.5 py-1.5 rounded-md border border-hm-border items-center ${i % 2 === 0 ? 'bg-hm-bg-hover' : 'bg-white'}`}>
                          <span className="text-xs text-hm-text-muted min-w-[70px]">{a.date}</span>
                          <span className="text-xs font-bold min-w-[40px]">{a.room}</span>
                          <span className="text-xs flex-1">{a.content}</span>
                          <StatusBadge status={a.priority} />
                          <StatusBadge status={a.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer close button */}
              <div className="px-7 py-4 border-t border-gray-200 text-center">
                <button onClick={() => setShowDetailPreview(false)}
                  className="px-10 py-2.5 rounded-[10px] border-none bg-hm-text text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deleteStep > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl px-9 py-8 max-w-[420px] w-[90%] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            {deleteStep === 1 && (
              <>
                <div className="text-4xl text-center mb-4">⚠️</div>
                <div className="text-lg font-bold text-hm-text text-center mb-2">건물을 삭제하시겠습니까?</div>
                <div className="text-sm text-hm-text-sub text-center mb-6 leading-relaxed">
                  <strong className="text-hm-danger">{buildingName}</strong>의 모든 정보와<br />
                  <strong className="text-hm-danger">{Object.values(detail.floors).flat().length}개 호실</strong>이 영구적으로 삭제됩니다.
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => setDeleteStep(0)} className="flex-1 py-3 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                  <button onClick={() => setDeleteStep(2)} className="flex-1 py-3 rounded-[10px] border-none bg-hm-danger text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">삭제 진행</button>
                </div>
              </>
            )}
            {deleteStep === 2 && (
              <>
                <div className="text-4xl text-center mb-4">🚨</div>
                <div className="text-lg font-bold text-hm-danger text-center mb-2">정말요? 되돌릴 수 없습니다!</div>
                <div className="text-sm text-hm-text-sub text-center mb-4 leading-relaxed">
                  삭제 시 복구가 불가능합니다.<br />
                  입주자 정보, 수금 내역, AS 이력, 순회 기록까지<br />
                  모두 함께 삭제됩니다.
                </div>
                <div className="px-4 py-3 bg-hm-danger-bg rounded-[10px] border border-hm-danger-border mb-5">
                  <div className="text-xs text-[#991B1B] font-semibold text-center">
                    ⚡ {buildingName} · {Object.values(detail.floors).flat().length}개 호실 · {bldgTenants.length}명 입주자 · AS {bldgAS.length}건
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => setDeleteStep(0)} className="flex-1 py-3 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">아니요, 취소</button>
                  <button onClick={() => setDeleteStep(3)} className="flex-1 py-3 rounded-[10px] border-none bg-[#991B1B] text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">그래도 삭제</button>
                </div>
              </>
            )}
            {deleteStep === 3 && (
              <>
                <div className="text-4xl text-center mb-4">💀</div>
                <div className="text-lg font-bold text-hm-text text-center mb-2">마지막 확인입니다</div>
                <div className="text-sm text-hm-danger text-center mb-4 font-bold">
                  "{buildingName}" 를 입력하고 삭제 버튼을 누르세요.
                </div>
                <input id="deleteConfirmInput" placeholder={`"${buildingName}" 입력`} className={`${inputClassName} !px-4 !py-3 !text-sm text-center mb-4 !border-2 !border-hm-danger-border`} />
                <div className="flex gap-2.5">
                  <button onClick={() => setDeleteStep(0)} className="flex-1 py-3 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                  <button onClick={() => {
                    const input = document.getElementById("deleteConfirmInput") as HTMLInputElement | null;
                    if (input && input.value === buildingName) {
                      persistDeleteBuilding(supabaseId);
                      if (setAllBuildings) {
                        setAllBuildings((prev: any) => {
                          const next = { ...prev };
                          delete next[buildingName];
                          return next;
                        });
                      }
                      setDeleteStep(0); onBack();
                    }
                    else if (input) { input.style.borderColor = "var(--color-hm-danger)"; input.style.background = "var(--color-hm-danger-bg)"; input.placeholder = "건물명이 일치하지 않습니다"; }
                  }} className="flex-1 py-3 rounded-[10px] border-none bg-[#7F1D1D] text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">🗑 영구 삭제</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Past Tenant Photos Table */}
      {(() => {
        const pastKeys = Object.keys(pastTenantsData).filter(k => k.startsWith(buildingName + "_"));
        if (pastKeys.length === 0) return null;
        return (
          <Card className="mb-5">
            <SectionTitle sub={`${pastKeys.length}건 퇴실 기록`}>📷 퇴실자 사진</SectionTitle>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-hm-border">
                  {["호실","퇴실자","퇴실일","입주사진","입주체크사진","퇴실사진",""].map((h, i) => (
                    <th key={i} className={`px-2.5 py-2 text-xs font-bold text-hm-text-muted ${i >= 3 ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastKeys.map(k => {
                  const rawRecords = pastTenantsData[k];
                  const records = Array.isArray(rawRecords) ? rawRecords : [rawRecords].filter(Boolean);
                  if (records.length === 0) return null;
                  const last = records[records.length - 1];
                  const room = k.split("_")[1];
                  const miCount = (last?.moveInPhotos || []).length;
                  const mcCount = (last?.moveInCheckPhotos || []).length;
                  const moCount = (last?.moveOutPhotos || []).length;
                  return (
                    <tr key={k} className="border-b border-[#F0F2F5] hover:bg-hm-bg-hover transition-colors">
                      <td className="px-2.5 py-2 font-bold">{room}호</td>
                      <td className="px-2.5 py-2">{last?.name}</td>
                      <td className="px-2.5 py-2 text-xs text-hm-danger">{last?.moveOut || "\u2014"}</td>
                      <td className="px-2.5 py-2 text-center">
                        {miCount > 0 ? (
                          <span className="text-xs font-bold text-hm-success px-2 py-0.5 rounded bg-[#D1FAE5]">🏠 {miCount}장</span>
                        ) : (
                          <span className="text-xs text-gray-400">{"\u2014"}</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        {mcCount > 0 ? (
                          <span className="text-xs font-bold text-hm-warning px-2 py-0.5 rounded bg-hm-warning-bg">📋 {mcCount}장</span>
                        ) : (
                          <span className="text-xs text-gray-400">{"\u2014"}</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        {moCount > 0 ? (
                          <span className="text-xs font-bold text-hm-danger px-2 py-0.5 rounded bg-[#FEE2E2]">🚪 {moCount}장</span>
                        ) : (
                          <span className="text-xs text-gray-400">{"\u2014"}</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        {(miCount + mcCount + moCount) > 0 && (
                          <button onClick={() => setPhotoViewTarget({ key: k, room, records })}
                            className="px-3 py-1 rounded-md border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark text-xs font-bold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">
                            👁️ 보기
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })()}

      {/* AS Section */}
      {bldgAS.length > 0 && (
        <Card>
          <SectionTitle sub="이 건물 AS 이력">🔧 AS 현황</SectionTitle>
          <Table
            columns={[
              { label: "접수일", key: "date" },
              { label: "호실", key: "room" },
              { label: "내용", key: "content" },
              { label: "긴급도", render: (r: any) => <StatusBadge status={r.priority} /> },
              { label: "상태", render: (r: any) => <StatusBadge status={r.status} /> },
            ]}
            data={bldgAS}
          />
        </Card>
      )}

      {/* Photo View Popup */}
      {photoViewTarget && (() => {
        const { room, records: rawRec } = photoViewTarget;
        const records = Array.isArray(rawRec) ? rawRec : [rawRec].filter(Boolean);
        if (records.length === 0) return null;
        const last = records[records.length - 1];
        const miPhotos = last?.moveInPhotos || [];
        const mcPhotos = last?.moveInCheckPhotos || [];
        const moPhotos = last?.moveOutPhotos || [];
        const renderPhoto = (src: string, idx: number, icon: string) => (
          <div key={idx} className="aspect-square rounded-lg border-[1.5px] border-hm-input-border overflow-hidden bg-hm-bg-slate flex items-center justify-center">
            {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
              <img src={src} alt={`사진 ${idx+1}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{icon}</span>
            )}
          </div>
        );
        return (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
            onClick={() => setPhotoViewTarget(null)}>
            <div onClick={e => e.stopPropagation()}
              className={`bg-white rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${isMobile ? 'w-[95%]' : 'w-[700px]'}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-lg font-bold text-hm-text">{buildingName} {room}호 — {last.name}</div>
                  <div className="text-xs text-hm-text-muted mt-0.5">입주: {last.moveIn || "\u2014"} → 퇴실: {last.moveOut || "\u2014"}</div>
                </div>
                <button onClick={() => setPhotoViewTarget(null)}
                  className="w-8 h-8 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
              </div>

              {miPhotos.length > 0 && (
                <div className="mb-5">
                  <div className="text-sm font-bold text-hm-success mb-2 pb-1.5 border-b-2 border-[#D1FAE5]">
                    🏠 입주사진 ({miPhotos.length}장) <span className="text-xs font-semibold text-hm-text-muted">{last.moveIn || ""}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {miPhotos.map((src: string, i: number) => renderPhoto(src, i, "🏠"))}
                  </div>
                </div>
              )}

              {(mcPhotos.length > 0 || moPhotos.length > 0) && (
                <div className="mb-5">
                  <div className="text-sm font-bold text-hm-text mb-2.5 pb-1.5 border-b-2 border-hm-border">
                    📸 호실 상태 비교 (시작 → 끝)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-2 border-hm-warning-border rounded-xl p-3 bg-hm-warning-bg">
                      <div className="text-xs font-bold text-hm-warning mb-2">📋 입주체크사진 (시작) <span className="text-xs text-hm-text-muted font-semibold">{mcPhotos.length}장</span></div>
                      {mcPhotos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                          {mcPhotos.map((src: string, i: number) => renderPhoto(src, i, "📋"))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-[#B0B5C1] text-xs">사진 없음</div>
                      )}
                    </div>
                    <div className="border-2 border-hm-danger-border rounded-xl p-3 bg-hm-danger-bg">
                      <div className="text-xs font-bold text-hm-danger mb-2">🚪 퇴실사진 (끝) <span className="text-xs text-hm-text-muted font-semibold">{moPhotos.length}장</span></div>
                      {moPhotos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                          {moPhotos.map((src: string, i: number) => renderPhoto(src, i, "🚪"))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-[#B0B5C1] text-xs">사진 없음</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {miPhotos.length === 0 && mcPhotos.length === 0 && moPhotos.length === 0 && (
                <div className="text-center py-10 text-hm-text-muted text-sm">등록된 사진이 없습니다</div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
};
