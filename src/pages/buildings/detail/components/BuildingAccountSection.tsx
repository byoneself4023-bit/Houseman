import React from 'react';
import { Card } from '@/components';
import { inputStyle } from '@/components/Field';
import {
  modeOptions, ownerFieldCfg, housemanUsageMap, ownerFirstModes,
  flowMap, banks, acctTypeBg, acctTypeColor, defaultHousemanAccount,
} from '@/config/accountConfig';

interface BuildingAccountSectionProps {
  isMobile: boolean;
  buildingName: string;
  detailBuildingTypes: string[];
  buildingAccounts: Record<string, any>;
  setBuildingAccounts: ((fn: any) => void) | undefined;
  saved: Record<string, any>;
  updateBD: (patch: Record<string, any>) => void;
  secAcctOpen: boolean;
  setSecAcctOpen: (v: boolean) => void;
  secAcctEdit: boolean;
  setSecAcctEdit: (v: boolean) => void;
}

export const BuildingAccountSection: React.FC<BuildingAccountSectionProps> = ({
  isMobile, buildingName, detailBuildingTypes,
  buildingAccounts, setBuildingAccounts,
  saved, updateBD,
  secAcctOpen, setSecAcctOpen, secAcctEdit, setSecAcctEdit,
}) => {
  const detailAcctTypes = detailBuildingTypes.map(t => t === "기업시설관리" ? "관리사무소" : t);
  const bldgAccts = buildingAccounts[buildingName] || { mode1: "", housemanAccount1: defaultHousemanAccount, ownerAccounts1: {}, mode2: "", housemanAccount2: defaultHousemanAccount, ownerAccounts2: {}, mode3: "", housemanAccount3: defaultHousemanAccount, ownerAccounts3: {} };
  const updateBldgAcct = (patch: Record<string, any>) => setBuildingAccounts && setBuildingAccounts((prev: Record<string, any>) => ({ ...prev, [buildingName]: { ...bldgAccts, ...patch } }));
  const contractMsg = saved.contractMsg || "";

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: secAcctOpen ? 12 : 0 }}>
        <div onClick={() => setSecAcctOpen(!secAcctOpen)} style={{ cursor: "pointer", flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>🏦 건물 계좌 정보 & 계약 문자</div>
          <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>계좌: 건물유형({detailBuildingTypes.join(" + ")})에서 자동 반영 · 계약 문자: 계약 시 발송할 문구</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {secAcctOpen && (secAcctEdit ? (
            <>
              <button onClick={() => setSecAcctEdit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              <button onClick={() => setSecAcctEdit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
            </>
          ) : (
            <button onClick={() => setSecAcctEdit(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ 수정</button>
          ))}
          <span onClick={() => setSecAcctOpen(!secAcctOpen)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: secAcctOpen ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
        </div>
      </div>
      {secAcctOpen && <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {/* Left: Account info */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", marginBottom: 10, padding: "6px 10px", background: "#EFF6FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>🏦 건물 계좌 정보</div>
          <div style={{ pointerEvents: secAcctEdit ? "auto" : "none", opacity: secAcctEdit ? 1 : 0.7, transition: "opacity 0.2s" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {detailAcctTypes.map((aType, ai) => {
                const suffix = String(ai + 1);
                const modeKey = `mode${suffix}`;
                const hmKey = `housemanAccount${suffix}`;
                const ownerKey = `ownerAccounts${suffix}`;
                const curOptions = modeOptions[aType] || [];
                const curMode = curOptions.find((o: any) => o.id === bldgAccts[modeKey]) ? bldgAccts[modeKey] : "";
                const curOwnerFields = ownerFieldCfg[curMode] || [];
                const curHmUsage = housemanUsageMap[curMode];
                return (
                  <div key={aType} style={{ padding: "10px 12px", background: acctTypeBg[aType], borderRadius: 8, border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: acctTypeColor[aType], marginBottom: 8 }}>{aType}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: curMode ? 8 : 0 }}>
                      {curOptions.map((opt: any) => (
                        <button key={opt.id} onClick={() => updateBldgAcct({ [modeKey]: opt.id, [ownerKey]: {} })}
                          style={{ padding: "5px 10px", borderRadius: 6, border: curMode === opt.id ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: curMode === opt.id ? "#FEF3C7" : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: curMode === opt.id ? "#92400E" : "#5F6577" }}
                          title={opt.desc}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {curMode && (() => {
                      const hmSection = curHmUsage && (
                        <div key="hm" style={{ padding: "8px 10px", background: "#F0F4FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>🏗️ 하우스맨 계좌 <span style={{ color: "#8F95A3", fontWeight: 500 }}>({curHmUsage})</span></div>
                          <input value={bldgAccts[hmKey]} onChange={e => updateBldgAcct({ [hmKey]: e.target.value })}
                            style={{ ...inputStyle, padding: "6px 10px", fontSize: 11, width: "100%", fontFamily: "monospace" }} />
                        </div>
                      );
                      const ownerSection = curOwnerFields.length > 0 && (
                        <div key="owner" style={{ padding: "8px 10px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>👤 건물주 계좌</div>
                          {curOwnerFields.map((f: any) => (
                            <div key={f.key} style={{ marginBottom: 4 }}>
                              <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>{f.label}</div>
                              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px", gap: 4 }}>
                                <select value={(bldgAccts[ownerKey] || {})[f.key + "_bank"] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key + "_bank"]: e.target.value } })}
                                  style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer" }}>
                                  <option value="">은행</option>
                                  {banks.map((b: string) => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <input value={(bldgAccts[ownerKey] || {})[f.key] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key]: e.target.value } })}
                                  placeholder="계좌번호" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} />
                                <input value={(bldgAccts[ownerKey] || {})[f.key + "_holder"] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key + "_holder"]: e.target.value } })}
                                  placeholder="예금주" style={{ ...inputStyle, padding: "5px 8px", fontSize: 10 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {ownerFirstModes[curMode] ? <>{ownerSection}{hmSection}</> : <>{hmSection}{ownerSection}</>}
                          <div style={{ fontSize: 10, color: "#5F6577", padding: "4px 0" }}>💡 {flowMap[curMode]}</div>
                          {/* Deposit holder selection: only for 단기 + houseman mode */}
                          {aType === "단기" && curMode === "houseman" && (
                            <div style={{ marginTop: 6, padding: "8px 10px", background: "#fff", borderRadius: 6, border: "1px solid #E5E7EB" }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#374151", marginBottom: 6 }}>예치금 보관</div>
                              <div style={{ display: "flex", gap: 4 }}>
                                {[{ id: "hm", label: "하우스맨 보관" }, { id: "owner", label: "건물주 보관" }].map(opt => {
                                  const cur = bldgAccts.depositHolder || "hm";
                                  return (
                                    <button key={opt.id} onClick={() => updateBldgAcct({ depositHolder: opt.id })}
                                      style={{ padding: "5px 12px", borderRadius: 6, border: cur === opt.id ? "1.5px solid #3B82F6" : "1px solid #E0E3E9", background: cur === opt.id ? "#EFF6FF" : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: cur === opt.id ? "#2563EB" : "#5F6577" }}>
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 4 }}>
                                {(bldgAccts.depositHolder || "hm") === "hm" ? "퇴실 시 하우스맨에서 임차인에게 직접 반환" : "퇴실 시 건물주에게 반환 요청 후 임차인에게 반환"}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Move-in fee formula */}
          {(() => {
            const calcTypes = detailAcctTypes.filter(t => ["단기", "일반임대", "근생"].includes(t));
            if (calcTypes.length === 0) return null;
            const calcType = saved.calcType && calcTypes.includes(saved.calcType) ? saved.calcType : calcTypes[0];
            const calcIdx = detailAcctTypes.indexOf(calcType);
            const suffix = String(calcIdx + 1);
            const curMode = bldgAccts[`mode${suffix}`] || "";
            const isSingleAcct = ["houseman", "hm_owner1", "gs1"].includes(curMode);
            return (
              <div style={{ marginTop: 14, padding: "12px 14px", background: "#FFFBEB", borderRadius: 8, border: "1.5px solid #FDE68A" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#92400E" }}>🧮 입주금 계산식</div>
                  {calcTypes.length > 1 && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {calcTypes.map((ct: string) => (
                        <button key={ct} onClick={() => updateBD({ calcType: ct })}
                          style={{ padding: "3px 10px", borderRadius: 5, border: calcType === ct ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: calcType === ct ? "#FEF3C7" : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: calcType === ct ? "#92400E" : "#8F95A3" }}>
                          {ct}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {calcType === "단기" ? (
                  isSingleAcct || !curMode ? (
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23", lineHeight: 1.8 }}>
                      <span style={{ color: "#DC2626", fontWeight: 800 }}>입주금 총합</span> = 보증금(예치금) + 월세(임대료) + 관리비 + 수도 + 인터넷TV
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#8F95A3", padding: "8px 0" }}>
                      계좌 2개/3개 방식의 계산식은 추후 지원 예정입니다.
                    </div>
                  )
                ) : (
                  <div style={{ fontSize: 11, color: "#8F95A3", padding: "8px 0" }}>
                    {calcType} 유형의 입주금 계산식은 추후 지원 예정입니다.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        {/* Right: Contract message */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginBottom: 10, padding: "6px 10px", background: "#F0FDF4", borderRadius: 6, border: "1px solid #BBF7D0" }}>📩 계약 문자</div>
          <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 8 }}>계약 체결 시 임차인에게 발송할 안내 문자를 입력하세요.</div>
          <textarea
            value={contractMsg}
            onChange={e => updateBD({ contractMsg: e.target.value })}
            placeholder={"예시)\n안녕하세요, " + buildingName + " 입니다.\n계약이 완료되었습니다.\n\n입주일: \n보증금: \n월세: \n관리비: \n\n입금계좌: \n\n감사합니다."}
            style={{ ...inputStyle, width: "100%", minHeight: 280, padding: "12px 14px", fontSize: 12, lineHeight: 1.7, resize: "vertical", background: "#fff", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
            <button onClick={() => {
              if (contractMsg) navigator.clipboard.writeText(contractMsg).then(() => alert("복사되었습니다"));
            }}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#059669", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📋 복사
            </button>
          </div>
        </div>
      </div>}
    </Card>
  );
};
