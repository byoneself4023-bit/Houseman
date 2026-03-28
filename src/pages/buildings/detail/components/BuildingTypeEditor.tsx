import React from 'react';
import { Card, SectionTitle, Table, StatusBadge } from '@/components';
import { inputStyle } from '@/components/Field';
import { rtCfg } from '@/components/RoomTypeBadge';
import { getRoomType } from '@/config';
import {
  modeOptions, ownerFieldCfg, housemanUsageMap,
  flowMap, acctTypeBg, acctTypeColor, defaultHousemanAccount,
} from '@/config/accountConfig';
import { fmt } from '@/utils';

const statusStyle = (status: string) => {
  switch (status) {
    case "공실": return { bg: "#FEF3C7", border: "#FDE68A", color: "#92400E", icon: "□" };
    case "연체": return { bg: "#FEE2E2", border: "#FECACA", color: "#991B1B", icon: "!" };
    default: return { bg: "#D1FAE5", border: "#A7F3D0", color: "#065F46", icon: "●" };
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
  photoViewTarget, setPhotoViewTarget,
}) => {
  return (
    <>
      {/* Preview Modal */}
      {showDetailPreview && (() => {
        const previewAcctTypes = detailBuildingTypes.map(t => t === "기업시설관리" ? "관리사무소" : t);
        const previewAccts = buildingAccounts[buildingName] || { mode1: "", housemanAccount1: defaultHousemanAccount, ownerAccounts1: {}, mode2: "", housemanAccount2: defaultHousemanAccount, ownerAccounts2: {}, mode3: "", housemanAccount3: defaultHousemanAccount, ownerAccounts3: {} };
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 9999, overflowY: "auto", padding: "40px 20px" }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "0", maxWidth: 800, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              {/* Preview Header */}
              <div style={{ padding: "20px 28px", background: "linear-gradient(135deg, #1A1D23 0%, #2D3748 100%)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>📋 {buildingName} 미리보기</div>
                  <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 2 }}>{detailBuildingTypes.join(" + ")} · {bldg.rooms}실 · {detail.owner && `건물주: ${detail.owner}`}</div>
                </div>
                <button onClick={() => setShowDetailPreview(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #A0AEC0", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ 닫기</button>
              </div>

              <div style={{ padding: "20px 28px" }}>
                {/* Preview: Basic Info */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📋 기본 정보</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
                      <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, minWidth: 80 }}>{x.l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{x.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {Object.entries(typeCounts).filter(([,v]) => v > 0).map(([t, v]) => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: rtCfg(t).bg, color: rtCfg(t).c }}>{t} {v}</span>
                    ))}
                  </div>
                </div>

                {/* Preview: Owner Info */}
                {detail.owner && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>👤 건물주 정보</div>
                    <div style={{ padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", marginBottom: 6 }}>건물주 1 (주)</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <div><span style={{ fontSize: 9, color: "#8F95A3" }}>이름</span><div style={{ fontSize: 12, fontWeight: 700 }}>{detail.owner}</div></div>
                        {detail.ownerPhone && <div><span style={{ fontSize: 9, color: "#8F95A3" }}>전화번호</span><div style={{ fontSize: 12, fontWeight: 700 }}>{detail.ownerPhone}</div></div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview: Account Info */}
                {(previewAccts.mode1 || previewAccts.mode2) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏦 건물 계좌 정보</div>
                    <div style={{ display: "grid", gridTemplateColumns: previewAcctTypes.length === 3 ? "1fr 1fr 1fr" : previewAcctTypes.length === 2 ? "1fr 1fr" : "1fr", gap: 10 }}>
                      {previewAcctTypes.map((aType, ai) => {
                        const suffix = String(ai + 1);
                        const curMode = previewAccts[`mode${suffix}`];
                        if (!curMode) return null;
                        const curOptions = modeOptions[aType] || [];
                        const modeLabel = curOptions.find((o: any) => o.id === curMode)?.label || curMode;
                        const curOwnerFields = ownerFieldCfg[curMode] || [];
                        const hmUsage = housemanUsageMap[curMode];
                        return (
                          <div key={aType} style={{ padding: "10px 12px", background: acctTypeBg[aType], borderRadius: 8, border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: acctTypeColor[aType], marginBottom: 6 }}>{aType} · {modeLabel}</div>
                            <div style={{ fontSize: 10, color: "#5F6577", marginBottom: 4 }}>💡 {flowMap[curMode]}</div>
                            {hmUsage && (
                              <div style={{ fontSize: 10, marginBottom: 4 }}>
                                <span style={{ color: "#2563EB", fontWeight: 600 }}>하우스맨 계좌 ({hmUsage}):</span>
                                <span style={{ fontFamily: "monospace", marginLeft: 4 }}>{previewAccts[`housemanAccount${suffix}`]}</span>
                              </div>
                            )}
                            {curOwnerFields.map((f: any) => {
                              const accts = previewAccts[`ownerAccounts${suffix}`] || {};
                              const bank = accts[f.key + "_bank"] || "";
                              const num = accts[f.key] || "";
                              const holder = accts[f.key + "_holder"] || "";
                              if (!bank && !num && !holder) return null;
                              return (
                                <div key={f.key} style={{ fontSize: 10, marginBottom: 2 }}>
                                  <span style={{ color: "#EA580C", fontWeight: 600 }}>{f.label}:</span>
                                  <span style={{ fontFamily: "monospace", marginLeft: 4 }}>{[bank, num, holder].filter(Boolean).join(" ")}</span>
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
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏢 담당자 & 계약 조건</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {[
                      { l: "수수료", v: bldg.feeType === "pct" ? `${(bldg.fee * 100)}%` : (bldg.fixedFee ? `${bldg.fixedFee.toLocaleString()}원` : "") },
                      { l: "수수료 유형", v: bldg.feeType === "pct" ? "수수료율" : "정액제" },
                      { l: "관리비 유형", v: bdMgmtType || "변동관리비" },
                      { l: "관리시작일", v: detail.start },
                    ].filter(x => x.v).map((x, i) => (
                      <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ fontSize: 10, color: "#8F95A3" }}>{x.l}</span>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview: Vendors */}
                {Object.values(vendorEnabled).some(v => v) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🔧 협력업체</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[
                        { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981" },
                        { key: "elevator", label: "승강기", icon: "🛗", color: "#3B82F6" },
                        { key: "fire", label: "소방", icon: "🔥", color: "#DC2626" },
                        { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1" },
                        { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6" },
                        { key: "custom1", label: "기타1", icon: "📋", color: "#64748B" },
                        { key: "custom2", label: "기타2", icon: "📋", color: "#64748B" },
                      ].filter(v => vendorEnabled[v.key]).map(v => (
                        <span key={v.key} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: v.color + "15", color: v.color, border: `1px solid ${v.color}40` }}>
                          {v.icon} {v.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview: Floor/Room Status */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏗️ 층별 호실 현황</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {floorKeys.map(floor => {
                      const rooms = detail.floors[floor];
                      return (
                        <div key={floor} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: "#1B1F2E", padding: "4px 10px", borderRadius: 6, minWidth: 36, textAlign: "center" }}>{floor}</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {rooms.map((room: string) => {
                              const info = getRoomStatus(room);
                              const st = statusStyle(info.status === "정상" ? "입주" : info.status === "연체" ? "연체" : info.status);
                              return (
                                <span key={room} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
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
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📷 퇴실자 사진 ({pastKeys.length}건)</div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 6 }}>
                        {pastKeys.slice(0, 6).map(k => {
                          const rawRec = pastTenantsData[k];
                          const records = Array.isArray(rawRec) ? rawRec : [rawRec].filter(Boolean);
                          if (records.length === 0) return null;
                          const last = records[records.length - 1];
                          const room = k.split("_")[1];
                          return (
                            <div key={k} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", cursor: "pointer" }}
                              onClick={() => setPhotoViewTarget({ key: k, room, records })}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, fontWeight: 800 }}>{room}호 {last?.name}</span>
                                <span style={{ fontSize: 9, color: "#8F95A3" }}>{last?.moveOut || ""}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>
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
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🔧 AS 현황 ({bldgAS.length}건)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {bldgAS.map((a: any, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", background: i % 2 === 0 ? "#FAFBFC" : "#fff", borderRadius: 6, border: "1px solid #E8ECF0", alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "#8F95A3", minWidth: 70 }}>{a.date}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 40 }}>{a.room}</span>
                          <span style={{ fontSize: 11, flex: 1 }}>{a.content}</span>
                          <StatusBadge status={a.priority} />
                          <StatusBadge status={a.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer close button */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid #E5E7EB", textAlign: "center" }}>
                <button onClick={() => setShowDetailPreview(false)}
                  style={{ padding: "10px 40px", borderRadius: 10, border: "none", background: "#1A1D23", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deleteStep > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 36px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            {deleteStep === 1 && (
              <>
                <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>⚠️</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23", textAlign: "center", marginBottom: 8 }}>건물을 삭제하시겠습니까?</div>
                <div style={{ fontSize: 13, color: "#5F6577", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
                  <strong style={{ color: "#DC2626" }}>{buildingName}</strong>의 모든 정보와<br />
                  <strong style={{ color: "#DC2626" }}>{Object.values(detail.floors).flat().length}개 호실</strong>이 영구적으로 삭제됩니다.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteStep(0)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                  <button onClick={() => setDeleteStep(2)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>삭제 진행</button>
                </div>
              </>
            )}
            {deleteStep === 2 && (
              <>
                <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>🚨</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", textAlign: "center", marginBottom: 8 }}>정말요? 되돌릴 수 없습니다!</div>
                <div style={{ fontSize: 13, color: "#5F6577", textAlign: "center", marginBottom: 16, lineHeight: 1.6 }}>
                  삭제 시 복구가 불가능합니다.<br />
                  입주자 정보, 수금 내역, AS 이력, 순회 기록까지<br />
                  모두 함께 삭제됩니다.
                </div>
                <div style={{ padding: "12px 16px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, textAlign: "center" }}>
                    ⚡ {buildingName} · {Object.values(detail.floors).flat().length}개 호실 · {bldgTenants.length}명 입주자 · AS {bldgAS.length}건
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteStep(0)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>아니요, 취소</button>
                  <button onClick={() => setDeleteStep(3)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#991B1B", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>그래도 삭제</button>
                </div>
              </>
            )}
            {deleteStep === 3 && (
              <>
                <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>💀</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23", textAlign: "center", marginBottom: 8 }}>마지막 확인입니다</div>
                <div style={{ fontSize: 14, color: "#DC2626", textAlign: "center", marginBottom: 16, fontWeight: 700 }}>
                  "{buildingName}" 를 입력하고 삭제 버튼을 누르세요.
                </div>
                <input id="deleteConfirmInput" placeholder={`"${buildingName}" 입력`} style={{ ...inputStyle, padding: "12px 16px", fontSize: 14, textAlign: "center", marginBottom: 16, border: "2px solid #FECACA" }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteStep(0)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                  <button onClick={() => {
                    const input = document.getElementById("deleteConfirmInput") as HTMLInputElement | null;
                    if (input && input.value === buildingName) { setDeleteStep(0); onBack(); }
                    else if (input) { input.style.borderColor = "#DC2626"; input.style.background = "#FEF2F2"; input.placeholder = "건물명이 일치하지 않습니다"; }
                  }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#7F1D1D", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🗑 영구 삭제</button>
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
          <Card style={{ marginBottom: 20 }}>
            <SectionTitle sub={`${pastKeys.length}건 퇴실 기록`}>📷 퇴실자 사진</SectionTitle>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                  {["호실","퇴실자","퇴실일","입주사진","입주체크사진","퇴실사진",""].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i >= 3 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3" }}>{h}</th>
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
                    <tr key={k} style={{ borderBottom: "1px solid #F0F2F5" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "8px 10px", fontWeight: 700 }}>{room}호</td>
                      <td style={{ padding: "8px 10px" }}>{last?.name}</td>
                      <td style={{ padding: "8px 10px", fontSize: 11, color: "#DC2626" }}>{last?.moveOut || "\u2014"}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {miCount > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", padding: "2px 8px", borderRadius: 4, background: "#D1FAE5" }}>🏠 {miCount}장</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{"\u2014"}</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {mcCount > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", padding: "2px 8px", borderRadius: 4, background: "#FFF7ED" }}>📋 {mcCount}장</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{"\u2014"}</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {moCount > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", padding: "2px 8px", borderRadius: 4, background: "#FEE2E2" }}>🚪 {moCount}장</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{"\u2014"}</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {(miCount + mcCount + moCount) > 0 && (
                          <button onClick={() => setPhotoViewTarget({ key: k, room, records })}
                            style={{ padding: "4px 12px", borderRadius: 6, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
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
          <div key={idx} style={{ aspectRatio: "1", borderRadius: 8, border: "1.5px solid #E0E3E9", overflow: "hidden", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
              <img src={src} alt={`사진 ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 20 }}>{icon}</span>
            )}
          </div>
        );
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setPhotoViewTarget(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "95%" : 700, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>{buildingName} {room}호 — {last.name}</div>
                  <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>입주: {last.moveIn || "\u2014"} → 퇴실: {last.moveOut || "\u2014"}</div>
                </div>
                <button onClick={() => setPhotoViewTarget(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>✕</button>
              </div>

              {miPhotos.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #D1FAE5" }}>
                    🏠 입주사진 ({miPhotos.length}장) <span style={{ fontSize: 10, fontWeight: 600, color: "#8F95A3" }}>{last.moveIn || ""}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                    {miPhotos.map((src: string, i: number) => renderPhoto(src, i, "🏠"))}
                  </div>
                </div>
              )}

              {(mcPhotos.length > 0 || moPhotos.length > 0) && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #E8ECF0" }}>
                    📸 호실 상태 비교 (시작 → 끝)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ border: "2px solid #FED7AA", borderRadius: 12, padding: 12, background: "#FFF7ED" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", marginBottom: 8 }}>📋 입주체크사진 (시작) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{mcPhotos.length}장</span></div>
                      {mcPhotos.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                          {mcPhotos.map((src: string, i: number) => renderPhoto(src, i, "📋"))}
                        </div>
                      ) : (
                        <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 11 }}>사진 없음</div>
                      )}
                    </div>
                    <div style={{ border: "2px solid #FECACA", borderRadius: 12, padding: 12, background: "#FEF2F2" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8 }}>🚪 퇴실사진 (끝) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{moPhotos.length}장</span></div>
                      {moPhotos.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                          {moPhotos.map((src: string, i: number) => renderPhoto(src, i, "🚪"))}
                        </div>
                      ) : (
                        <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 11 }}>사진 없음</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {miPhotos.length === 0 && mcPhotos.length === 0 && moPhotos.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "#8F95A3", fontSize: 13 }}>등록된 사진이 없습니다</div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
};
