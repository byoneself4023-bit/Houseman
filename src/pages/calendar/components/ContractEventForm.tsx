import React from 'react';
import { toast } from 'sonner';
import { inputClassName } from '@/components/Field';
import { useIsMobile } from '@/utils';
import { TYPE_COLORS } from '../constants';
import { persistInsert } from '../calendarApi';

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
    <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center"
      onClick={() => { setShowForm(false); setSelectedVacancy(null); setVacancyEdits({}); }}>
      <div className="bg-[#FAFBFF] rounded-2xl p-6 w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.2)] border-2 border-hm-blue"
        onClick={e => e.stopPropagation()}>
      <div className="text-[15px] font-extrabold text-hm-text mb-3.5">📦 계약 등록 — 공실 선택</div>

      <div className="max-h-60 overflow-y-auto border border-hm-input-border rounded-lg mb-3">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-hm-bg sticky top-0">
              {["건물", "호실", "유형", "보증금", "월세", "NEGO", "관리비", "공실일"].map(h => (
                <th key={h} className="px-2 py-[7px] font-bold text-hm-text-sub text-left border-b border-hm-input-border text-[10px]">{h}</th>
              ))}
              <th className="px-2 py-[7px] border-b border-hm-input-border"></th>
            </tr>
          </thead>
          <tbody>
            {activeVacancies.filter((v: any) => v.status === "홍보중").map((v: any, vi: number) => {
              const isSelected = selectedVacancy === vi;
              return (
                <tr key={vi} onClick={() => {
                  setSelectedVacancy(vi);
                  const edits: Record<string, any> = { deposit: v.deposit, rent: v.rent, nego: v.nego, mgmt: v.mgmt };
                  if (v.type === "단기") { edits.waterFee = v.waterFee; edits.cable = v.cable; edits.exitFee = v.exitFee; edits.commBroker = v.commBroker; }
                  setVacancyEdits(edits);
                }}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-hm-blue-bg' : vi % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                  <td className="px-2 py-[7px] font-semibold border-b border-[#F0F2F5]">{v.building}</td>
                  <td className="px-2 py-[7px] border-b border-[#F0F2F5]">{v.room}</td>
                  <td className="px-2 py-[7px] border-b border-[#F0F2F5]">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${v.type === "단기" ? "bg-hm-blue-bg text-hm-blue-dark" : v.type === "일반임대" ? "bg-green-50 text-green-600" : v.type === "근생" ? "bg-hm-warning-bg text-hm-warning" : "bg-purple-50 text-purple-600"}`}>{v.type}</span>
                  </td>
                  <td className="px-2 py-[7px] border-b border-[#F0F2F5]">{v.deposit}</td>
                  <td className="px-2 py-[7px] border-b border-[#F0F2F5]">{v.rent}</td>
                  <td className={`px-2 py-[7px] border-b border-[#F0F2F5] ${v.nego < v.rent ? 'text-hm-danger font-bold' : ''}`}>{v.nego}</td>
                  <td className="px-2 py-[7px] border-b border-[#F0F2F5]">{v.mgmt}</td>
                  <td className={`px-2 py-[7px] border-b border-[#F0F2F5] ${v.days > 30 ? 'text-hm-danger font-bold' : 'text-hm-text-sub'}`}>{v.days}일</td>
                  <td className="px-2 py-[7px] border-b border-[#F0F2F5]">{isSelected && <span className="text-xs text-hm-blue">✓</span>}</td>
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
          <div className="p-3.5 bg-white border border-blue-200 rounded-lg">
            <div className="text-xs font-extrabold text-hm-text mb-2.5">
              📦 {sv.building} {sv.room}호 계약 등록
              <span className={`text-[9px] px-1.5 py-0.5 rounded ml-1.5 font-semibold ${isDangi ? "bg-hm-blue-bg text-hm-blue-dark" : "bg-green-50 text-green-600"}`}>{sv.type}</span>
            </div>
            {/* 부동산명, 연락처, 입주일, 기간, 만기일 */}
            <div className="p-3 bg-hm-danger-bg border border-red-200 rounded-lg mb-2.5">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-2.5`}>
                <div>
                  <div className="text-[9px] font-bold text-hm-danger mb-[3px]">부동산명 *</div>
                  <input value={vacancyEdits.broker ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, broker: e.target.value }))}
                    placeholder="부동산명 입력" className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-hm-danger mb-[3px]">연락처 *</div>
                  <input value={vacancyEdits.brokerPhone ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, brokerPhone: e.target.value }))}
                    placeholder="010-0000-0000" className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`}
                    style={{ borderColor: !(vacancyEdits.brokerPhone) ? "var(--color-hm-danger-border)" : undefined }} />
                </div>
              </div>
              <div className={`grid ${isMobile ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr_1fr]'} gap-2`}>
                <div>
                  <div className="text-[9px] font-bold text-hm-danger mb-[3px]">입주일 *</div>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white !border-red-200`} />
                </div>
                <div className="flex items-end justify-center pb-1 gap-1">
                  {isDangi ? (
                    <button onClick={() => {
                      if (!formDate) { toast.error("입주일을 먼저 선택하세요"); return; }
                      const d = new Date(formDate); d.setMonth(d.getMonth() + 3); d.setDate(d.getDate() - 1);
                      setVacancyEdits((prev: any) => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                    }}
                      className="px-3.5 py-1.5 rounded-md border-[1.5px] border-hm-danger bg-hm-danger-bg text-hm-danger text-[11px] font-extrabold cursor-pointer whitespace-nowrap font-[inherit] hover:bg-red-100 transition-colors">
                      3개월 →
                    </button>
                  ) : (<>
                    <button onClick={() => {
                      if (!formDate) { toast.error("입주일을 먼저 선택하세요"); return; }
                      const d = new Date(formDate); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1);
                      setVacancyEdits((prev: any) => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                    }}
                      className="px-2.5 py-1.5 rounded-md border-[1.5px] border-hm-danger bg-hm-danger-bg text-hm-danger text-[11px] font-extrabold cursor-pointer whitespace-nowrap font-[inherit] hover:bg-red-100 transition-colors">
                      1년 →
                    </button>
                    <button onClick={() => {
                      if (!formDate) { toast.error("입주일을 먼저 선택하세요"); return; }
                      const d = new Date(formDate); d.setFullYear(d.getFullYear() + 2); d.setDate(d.getDate() - 1);
                      setVacancyEdits((prev: any) => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                    }}
                      className="px-2.5 py-1.5 rounded-md border-[1.5px] border-hm-danger bg-hm-danger-bg text-hm-danger text-[11px] font-extrabold cursor-pointer whitespace-nowrap font-[inherit] hover:bg-red-100 transition-colors">
                      2년 →
                    </button>
                  </>)}
                </div>
                <div>
                  <div className="text-[9px] font-bold text-hm-danger mb-[3px]">만기일 *</div>
                  <input type="date" value={vacancyEdits.expiry ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, expiry: e.target.value }))}
                    className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white !border-red-200`} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">계약일 (자동)</div>
                  <div className="py-2 px-2.5 text-xs bg-gray-100 rounded-lg border border-hm-input-border text-hm-text-sub">
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
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2 mb-2.5`}>
                  <div>
                    <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">보증금 (만원)</div>
                    <input type="number" value={vacancyEdits.deposit ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, deposit: e.target.value }))}
                      className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`} />
                  </div>
                  <div>
                    <div className={`text-[9px] font-bold mb-[3px] ${negoApplied ? 'text-hm-danger' : 'text-hm-text-muted'}`}>월세 (만원) {negoApplied && <span className="text-[8px] text-hm-danger">NEGO적용</span>}</div>
                    <input type="number" value={vacancyEdits.rent ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, rent: e.target.value }))}
                      className={`${inputClassName} !py-[7px] !px-2.5 !text-xs ${negoApplied ? '!bg-hm-danger-bg !text-hm-danger !font-bold' : '!bg-white !text-hm-text'}`} />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">NEGO ({sv.nego}만)</div>
                    <button onClick={() => {
                      if (negoApplied) {
                        setVacancyEdits((prev: any) => ({ ...prev, negoApplied: false, rent: String(prev.rentOriginal || sv.rent) }));
                      } else {
                        setVacancyEdits((prev: any) => ({ ...prev, negoApplied: true, rentOriginal: Number(prev.rent) || sv.rent, rent: String(negoVal) }));
                      }
                    }}
                      className={`w-full py-[7px] px-2.5 rounded-lg text-xs font-extrabold cursor-pointer font-[inherit] transition-all border-[1.5px] ${negoApplied ? 'border-hm-danger bg-hm-danger text-white' : 'border-hm-blue bg-hm-blue-bg text-hm-blue-dark'}`}>
                      {negoApplied ? "✓ 적용" : "미적용"}
                    </button>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">관리비 (만원)</div>
                    <input type="number" value={vacancyEdits.mgmt ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, mgmt: e.target.value }))}
                      className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`} />
                  </div>
                </div>
              );
            })()}
            {/* Row 3: 단기 전용 */}
            {isDangi && (
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2 mb-2.5`}>
                <div>
                  <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">수도</div>
                  <input value={vacancyEdits.waterFee ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, waterFee: e.target.value }))}
                    className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">인터넷/케이블</div>
                  <input value={vacancyEdits.cable ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, cable: e.target.value }))}
                    className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">퇴실청소비 (만원)</div>
                  <input type="number" value={vacancyEdits.exitFee ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, exitFee: e.target.value }))}
                    className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-hm-text-muted mb-[3px]">중개수수료 (%)</div>
                  <input type="number" value={vacancyEdits.commBroker ?? ""} onChange={e => setVacancyEdits((prev: any) => ({ ...prev, commBroker: e.target.value }))}
                    className={`${inputClassName} !py-[7px] !px-2.5 !text-xs !bg-white`} />
                </div>
              </div>
            )}
            <div className="flex justify-end mt-3">
              <button onClick={() => {
                if (!formDate) { toast.error("입주일을 선택하세요"); return; }
                if (!(vacancyEdits.brokerPhone || "").trim()) { toast.error("부동산 연락처를 입력하세요"); return; }
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
                    waterFee: vacancyEdits.waterFee ?? sv.waterFee,
                    cable: vacancyEdits.cable ?? sv.cable,
                    exitFee: Number(vacancyEdits.exitFee) || sv.exitFee,
                    commBroker: Number(vacancyEdits.commBroker) || sv.commBroker,
                  } : {}),
                };
                persistInsert(newEvt).then((result) => {
                  if (result?.data?.id) {
                    setEvents((prev: any[]) => prev.map((e: any) => e === newEvt ? { ...e, supabaseId: result.data.id, source: 'supabase' } : e));
                  }
                });
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
                className="px-6 py-[9px] rounded-lg border-none bg-gradient-to-br from-hm-blue to-hm-blue-dark text-white text-xs font-bold cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
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
