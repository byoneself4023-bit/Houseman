import React from 'react';
import { inputStyle } from '@/components/Field';
import { useIsMobile } from '@/utils';
import { TYPE_COLORS } from '../constants';

interface ContractEventFormProps {
  showForm: boolean;
  formType: string;
  formDate: string;
  setFormDate: (v: string) => void;
  activeVacancies: Record<string, any>[];
  selectedVacancy: number | null;
  setSelectedVacancy: (v: number | null) => void;
  vacancyEdits: Record<string, any>;
  setVacancyEdits: (fn: any) => void;
  setEvents: (fn: any) => void;
  setActiveVacancies?: (fn: any) => void;
  setShowForm: (v: boolean) => void;
  currentStaff: Record<string, any> | null;
  openSendModal: (evt: Record<string, any>) => void;
}

export const ContractEventForm: React.FC<ContractEventFormProps> = ({
  showForm, formType, formDate, setFormDate,
  activeVacancies, selectedVacancy, setSelectedVacancy,
  vacancyEdits, setVacancyEdits, setEvents, setActiveVacancies,
  setShowForm, currentStaff, openSendModal,
}) => {
  const isMobile = useIsMobile();

  if (!showForm || formType !== "계약") return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => { setShowForm(false); setSelectedVacancy(null); setVacancyEdits({}); }}>
      <div style={{ background: "#FAFBFF", borderRadius: 16, padding: 24, width: 600, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "2px solid #3B82F6" }}
        onClick={e => e.stopPropagation()}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23", marginBottom: 14 }}>📦 계약 등록 — 공실 선택</div>

      <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #E0E3E9", borderRadius: 8, marginBottom: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#F3F4F8", position: "sticky", top: 0 }}>
              {["건물", "호실", "유형", "보증금", "월세", "NEGO", "관리비", "공실일"].map(h => (
                <th key={h} style={{ padding: "7px 8px", fontWeight: 700, color: "#5F6577", textAlign: "left", borderBottom: "1px solid #E0E3E9", fontSize: 10 }}>{h}</th>
              ))}
              <th style={{ padding: "7px 8px", borderBottom: "1px solid #E0E3E9" }}></th>
            </tr>
          </thead>
          <tbody>
            {activeVacancies.filter((v: any) => v.status === "홍보중").map((v: any, vi: number) => {
              const isSelected = selectedVacancy === vi;
              return (
                <tr key={vi} onClick={() => {
                  setSelectedVacancy(vi);
                  const edits: Record<string, any> = { deposit: v.deposit, rent: v.rent, nego: v.nego, mgmt: v.mgmt };
                  if (v.type === "단기") { edits.water = v.water; edits.cable = v.cable; edits.exitFee = v.exitFee; edits.commBroker = v.commBroker; }
                  setVacancyEdits(edits);
                }}
                  style={{ background: isSelected ? "#EFF6FF" : vi % 2 === 0 ? "#fff" : "#FAFBFC", cursor: "pointer", transition: "background 0.1s" }}>
                  <td style={{ padding: "7px 8px", fontWeight: 600, borderBottom: "1px solid #F0F2F5" }}>{v.building}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.room}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 600, background: v.type === "단기" ? "#EFF6FF" : v.type === "일반임대" ? "#F0FDF4" : v.type === "근생" ? "#FFF7ED" : "#F5F3FF", color: v.type === "단기" ? "#2563EB" : v.type === "일반임대" ? "#16A34A" : v.type === "근생" ? "#EA580C" : "#7C3AED" }}>{v.type}</span>
                  </td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.deposit}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.rent}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5", color: v.nego < v.rent ? "#DC2626" : "inherit", fontWeight: v.nego < v.rent ? 700 : 400 }}>{v.nego}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.mgmt}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5", color: v.days > 30 ? "#DC2626" : "#5F6577", fontWeight: v.days > 30 ? 700 : 400 }}>{v.days}일</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{isSelected && <span style={{ fontSize: 12, color: "#3B82F6" }}>✓</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedVacancy !== null && (() => {
        const promoVacancies = activeVacancies.filter((v: any) => v.status === "홍보중");
        const sv = promoVacancies[selectedVacancy];
        if (!sv) return null;
        const isDangi = sv.type === "단기";
        return (
          <div style={{ padding: 14, background: "#fff", border: "1px solid #BFDBFE", borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 10 }}>
              📦 {sv.building} {sv.room}호 계약 등록
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, marginLeft: 6, fontWeight: 600, background: isDangi ? "#EFF6FF" : "#F0FDF4", color: isDangi ? "#2563EB" : "#16A34A" }}>{sv.type}</span>
            </div>
            {/* 부동산명, 연락처, 입주일, 기간, 만기일 */}
            <div style={{ padding: 12, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>부동산명 *</div>
                  <input value={vacancyEdits.broker ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, broker: e.target.value }))}
                    placeholder="부동산명 입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>연락처 *</div>
                  <input value={vacancyEdits.brokerPhone ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, brokerPhone: e.target.value }))}
                    placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff", borderColor: !(vacancyEdits.brokerPhone) ? "#FECACA" : undefined }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr auto 1fr" : "1fr auto 1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>입주일 *</div>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff", borderColor: "#FECACA" }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, gap: 4 }}>
                  {isDangi ? (
                    <button onClick={() => {
                      if (!formDate) return alert("입주일을 먼저 선택하세요");
                      const d = new Date(formDate); d.setMonth(d.getMonth() + 3); d.setDate(d.getDate() - 1);
                      setVacancyEdits((prev: any) => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                    }}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                      3개월 →
                    </button>
                  ) : (<>
                    <button onClick={() => {
                      if (!formDate) return alert("입주일을 먼저 선택하세요");
                      const d = new Date(formDate); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1);
                      setVacancyEdits((prev: any) => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                    }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                      1년 →
                    </button>
                    <button onClick={() => {
                      if (!formDate) return alert("입주일을 먼저 선택하세요");
                      const d = new Date(formDate); d.setFullYear(d.getFullYear() + 2); d.setDate(d.getDate() - 1);
                      setVacancyEdits((prev: any) => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                    }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                      2년 →
                    </button>
                  </>)}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>만기일 *</div>
                  <input type="date" value={vacancyEdits.expiry ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, expiry: e.target.value }))}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff", borderColor: "#FECACA" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>계약일 (자동)</div>
                  <div style={{ padding: "8px 10px", fontSize: 12, background: "#F3F4F6", borderRadius: 8, border: "1px solid #E0E3E9", color: "#5F6577" }}>
                    {new Date().toISOString().slice(0, 10)}
                  </div>
                </div>
              </div>
            </div>
            {/* 기본 금액 */}
            {(() => {
              const negoApplied = vacancyEdits.negoApplied === true;
              const negoVal = Number(vacancyEdits.nego) || sv.nego;
              const rentVal = Number(vacancyEdits.rent) || sv.rent;
              const hasNego = negoVal < (Number(vacancyEdits.rentOriginal) || sv.rent);
              return (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>보증금 (만원)</div>
                    <input type="number" value={vacancyEdits.deposit ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, deposit: e.target.value }))}
                      style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: negoApplied ? "#DC2626" : "#8F95A3", marginBottom: 3 }}>월세 (만원) {negoApplied && <span style={{ fontSize: 8, color: "#DC2626" }}>NEGO적용</span>}</div>
                    <input type="number" value={vacancyEdits.rent ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, rent: e.target.value }))}
                      style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: negoApplied ? "#FEF2F2" : "#fff", color: negoApplied ? "#DC2626" : "#1A1D23", fontWeight: negoApplied ? 700 : 400 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>NEGO ({sv.nego}만)</div>
                    <button onClick={() => {
                      if (negoApplied) {
                        setVacancyEdits((prev: any) => ({ ...prev, negoApplied: false, rent: String(prev.rentOriginal || sv.rent) }));
                      } else {
                        setVacancyEdits((prev: any) => ({ ...prev, negoApplied: true, rentOriginal: Number(prev.rent) || sv.rent, rent: String(negoVal) }));
                      }
                    }}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        border: negoApplied ? "1.5px solid #DC2626" : "1.5px solid #3B82F6",
                        background: negoApplied ? "#DC2626" : "#EFF6FF",
                        color: negoApplied ? "#fff" : "#2563EB" }}>
                      {negoApplied ? "✓ 적용" : "미적용"}
                    </button>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>관리비 (만원)</div>
                    <input type="number" value={vacancyEdits.mgmt ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, mgmt: e.target.value }))}
                      style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                  </div>
                </div>
              );
            })()}
            {/* Row 3: 단기 전용 */}
            {isDangi && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>수도</div>
                  <input value={vacancyEdits.water ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, water: e.target.value }))}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>인터넷/케이블</div>
                  <input value={vacancyEdits.cable ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, cable: e.target.value }))}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>퇴실청소비 (만원)</div>
                  <input type="number" value={vacancyEdits.exitFee ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, exitFee: e.target.value }))}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>중개수수료 (%)</div>
                  <input type="number" value={vacancyEdits.commBroker ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, commBroker: e.target.value }))}
                    style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => {
                if (!formDate) return alert("입주일을 선택하세요");
                if (!(vacancyEdits.brokerPhone || "").trim()) return alert("부동산 연락처를 입력하세요");
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
                const registeredAt = `${todayStr} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
                const newEvt: Record<string, any> = {
                  date: formDate, type: "계약",
                  building: sv.building, room: sv.room, name: "",
                  color: TYPE_COLORS["계약"], registeredAt, registeredBy: currentStaff?.name || "알수없음",
                  contractDate: todayStr,
                  deposit: Number(vacancyEdits.deposit) || sv.deposit,
                  rent: Number(vacancyEdits.rent) || sv.rent,
                  nego: Number(vacancyEdits.nego) || sv.nego,
                  mgmt: Number(vacancyEdits.mgmt) || sv.mgmt,
                  broker: vacancyEdits.broker || "", brokerPhone: vacancyEdits.brokerPhone || "",
                  moveIn: formDate, expiry: vacancyEdits.expiry || "",
                  ...(isDangi ? {
                    water: vacancyEdits.water ?? sv.water,
                    cable: vacancyEdits.cable ?? sv.cable,
                    exitFee: Number(vacancyEdits.exitFee) || sv.exitFee,
                    commBroker: Number(vacancyEdits.commBroker) || sv.commBroker,
                  } : {}),
                };
                setEvents((prev: any[]) => [...prev, newEvt]);
                if (setActiveVacancies) {
                  setActiveVacancies((prev: any[]) => prev.map((x: any) =>
                    x.building === sv.building && x.room === sv.room ? { ...x, status: "계약서입력" } : x
                  ));
                }
                openSendModal(newEvt);
                setFormDate(""); setSelectedVacancy(null); setVacancyEdits({});
                setShowForm(false);
              }}
                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                계약 등록
              </button>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
};
