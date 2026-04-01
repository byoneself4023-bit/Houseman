import React from 'react';
import { Card } from '@/components';
import { inputClassName } from '@/components/Field';
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
    <Card className="mb-4">
      <div className={`flex justify-between items-center ${secAcctOpen ? 'mb-3' : ''}`}>
        <div onClick={() => setSecAcctOpen(!secAcctOpen)} className="cursor-pointer flex-1">
          <div className="text-base font-bold text-hm-text">🏦 건물 계좌 정보 & 계약 문자</div>
          <div className="text-xs text-hm-text-muted mt-0.5">계좌: 건물유형({detailBuildingTypes.join(" + ")})에서 자동 반영 · 계약 문자: 계약 시 발송할 문구</div>
        </div>
        <div className="flex items-center gap-2">
          {secAcctOpen && (secAcctEdit ? (
            <>
              <button onClick={() => setSecAcctEdit(false)} className="px-4 py-[5px] rounded-md border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
              <button onClick={() => setSecAcctEdit(false)} className="px-4 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-xs cursor-pointer font-[inherit] hover:brightness-90 transition-all">💾 저장</button>
            </>
          ) : (
            <button onClick={() => setSecAcctEdit(true)} className="px-4 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-xs cursor-pointer font-[inherit] hover:brightness-90 transition-all">✏️ 수정</button>
          ))}
          <span onClick={() => setSecAcctOpen(!secAcctOpen)} className="text-sm text-hm-text-muted cursor-pointer transition-transform duration-200" style={{ transform: secAcctOpen ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
        </div>
      </div>
      {secAcctOpen && <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        {/* Left: Account info */}
        <div>
          <div className="text-sm font-bold text-hm-blue-dark mb-2.5 px-2.5 py-1.5 bg-hm-blue-bg rounded-md border border-blue-200">🏦 건물 계좌 정보</div>
          <div className={`transition-opacity duration-200 ${secAcctEdit ? 'opacity-100' : 'opacity-70 pointer-events-none'}`}>
            <div className="flex flex-col gap-3">
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
                  <div key={aType} className="px-3 py-2.5 rounded-lg" style={{ background: acctTypeBg[aType], border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                    <div className="text-xs font-bold mb-2" style={{ color: acctTypeColor[aType] }}>{aType}</div>
                    <div className={`flex gap-1 flex-wrap ${curMode ? 'mb-2' : ''}`}>
                      {curOptions.map((opt: any) => (
                        <button key={opt.id} onClick={() => updateBldgAcct({ [modeKey]: opt.id, [ownerKey]: {} })}
                          className={`px-2.5 py-[5px] rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors ${curMode === opt.id ? 'border-[1.5px] border-amber-400 bg-amber-50 text-amber-800' : 'border border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}
                          title={opt.desc}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {curMode && (() => {
                      const hmSection = curHmUsage && (
                        <div key="hm" className="px-2.5 py-2 bg-[#F0F4FF] rounded-md border border-blue-200">
                          <div className="text-xs font-bold text-hm-blue-dark mb-1">🏗️ 하우스맨 계좌 <span className="text-hm-text-muted font-medium">({curHmUsage})</span></div>
                          <input value={bldgAccts[hmKey]} onChange={e => updateBldgAcct({ [hmKey]: e.target.value })}
                            className={`${inputClassName} !px-2.5 !py-1.5 !text-xs !w-full !font-mono`} />
                        </div>
                      );
                      const ownerSection = curOwnerFields.length > 0 && (
                        <div key="owner" className="px-2.5 py-2 bg-hm-warning-bg rounded-md border border-orange-200">
                          <div className="text-xs font-bold text-hm-warning mb-1">👤 건물주 계좌</div>
                          {curOwnerFields.map((f: any) => (
                            <div key={f.key} className="mb-1">
                              <div className="text-[8px] font-bold text-hm-warning mb-1">{f.label}</div>
                              <div className="grid grid-cols-[90px_1fr_70px] gap-1">
                                <select value={(bldgAccts[ownerKey] || {})[f.key + "_bank"] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key + "_bank"]: e.target.value } })}
                                  className={`${inputClassName} !px-1.5 !py-[5px] !text-xs !cursor-pointer`}>
                                  <option value="">은행</option>
                                  {banks.map((b: string) => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <input value={(bldgAccts[ownerKey] || {})[f.key] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key]: e.target.value } })}
                                  placeholder="계좌번호" className={`${inputClassName} !px-2 !py-[5px] !text-xs !font-mono`} />
                                <input value={(bldgAccts[ownerKey] || {})[f.key + "_holder"] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key + "_holder"]: e.target.value } })}
                                  placeholder="예금주" className={`${inputClassName} !px-2 !py-[5px] !text-xs`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                      return (
                        <div className="flex flex-col gap-1.5">
                          {ownerFirstModes[curMode] ? <>{ownerSection}{hmSection}</> : <>{hmSection}{ownerSection}</>}
                          <div className="text-xs text-hm-text-sub py-1">💡 {flowMap[curMode]}</div>
                          {/* Deposit holder selection: only for 단기 + houseman mode */}
                          {aType === "단기" && curMode === "houseman" && (
                            <div className="mt-1.5 px-2.5 py-2 bg-white rounded-md border border-gray-200">
                              <div className="text-xs font-bold text-gray-700 mb-1.5">예치금 보관</div>
                              <div className="flex gap-1">
                                {[{ id: "hm", label: "하우스맨 보관" }, { id: "owner", label: "건물주 보관" }].map(opt => {
                                  const cur = bldgAccts.depositHolder || "hm";
                                  return (
                                    <button key={opt.id} onClick={() => updateBldgAcct({ depositHolder: opt.id })}
                                      className={`px-3 py-[5px] rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors ${cur === opt.id ? 'border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark' : 'border border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
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
              <div className="mt-3.5 px-4 py-3 bg-amber-50 rounded-lg border-[1.5px] border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-bold text-amber-800">🧮 입주금 계산식</div>
                  {calcTypes.length > 1 && (
                    <div className="flex gap-1">
                      {calcTypes.map((ct: string) => (
                        <button key={ct} onClick={() => updateBD({ calcType: ct })}
                          className={`px-2.5 py-[3px] rounded-[5px] text-xs font-bold cursor-pointer font-[inherit] transition-colors ${calcType === ct ? 'border-[1.5px] border-amber-400 bg-amber-50 text-amber-800' : 'border border-hm-input-border bg-white text-hm-text-muted hover:bg-hm-bg-hover'}`}>
                          {ct}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {calcType === "단기" ? (
                  isSingleAcct || !curMode ? (
                    <div className="text-xs font-bold text-hm-text leading-[1.8]">
                      <span className="text-hm-danger font-bold">입주금 총합</span> = 보증금(예치금) + 월세(임대료) + 관리비 + 수도 + 인터넷TV
                    </div>
                  ) : (
                    <div className="text-xs text-hm-text-muted py-2">
                      계좌 2개/3개 방식의 계산식은 추후 지원 예정입니다.
                    </div>
                  )
                ) : (
                  <div className="text-xs text-hm-text-muted py-2">
                    {calcType} 유형의 입주금 계산식은 추후 지원 예정입니다.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        {/* Right: Contract message */}
        <div>
          <div className="text-sm font-bold text-hm-success mb-2.5 px-2.5 py-1.5 bg-green-50 rounded-md border border-green-200">📩 계약 문자</div>
          <div className="text-xs text-hm-text-muted mb-2">계약 체결 시 임차인에게 발송할 안내 문자를 입력하세요.</div>
          <textarea
            value={contractMsg}
            onChange={e => updateBD({ contractMsg: e.target.value })}
            placeholder={"예시)\n안녕하세요, " + buildingName + " 입니다.\n계약이 완료되었습니다.\n\n입주일: \n보증금: \n월세: \n관리비: \n\n입금계좌: \n\n감사합니다."}
            className={`${inputClassName} !w-full !min-h-[280px] !px-4 !py-3 !text-xs !leading-[1.7] !resize-y !bg-white !font-[inherit]`}
          />
          <div className="flex justify-end gap-1.5 mt-2">
            <button onClick={() => {
              if (contractMsg) navigator.clipboard.writeText(contractMsg).then(() => alert("복사되었습니다"));
            }}
              className="px-4 py-1.5 rounded-md border border-green-200 bg-green-50 text-hm-success text-xs font-bold cursor-pointer font-[inherit] hover:brightness-95 transition-all">
              📋 복사
            </button>
          </div>
        </div>
      </div>}
    </Card>
  );
};
