// @ts-nocheck
/**
 * 퇴실체크 모달 (외부팀 체크)
 * 4개 섹션: 사진비교, 공제항목, 계량기, 이슈체크
 * viewOnly 모드: 완료된 체크 결과 표시
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { PhotoDropZone } from '@/components/PhotoDropZone';
import { persistUpdate, persistUploadPhotos } from '../calendarApi';
import { api } from '@/lib/api';

const ISSUE_ITEMS = [
  { key: "외부업체", label: "외부업체 수리 필요", color: "var(--color-hm-danger)" },
  { key: "교체", label: "가구/설비 교체 필요", color: "var(--color-hm-warning)" },
  { key: "도배", label: "도배/장판 필요", color: "#7C3AED" },
  { key: "누수", label: "누수/배관 이슈", color: "var(--color-hm-blue-dark)" },
  { key: "기타", label: "기타 이슈", color: "#6B7280" },
];

interface ExternalCheckModalProps {
  externalCheckModal: any;
  setExternalCheckModal: (v: any) => void;
  setEvents: (fn: any) => void;
  setActiveTenants?: (fn: any) => void;
  setZoomPhoto?: (v: any) => void;
}

export const ExternalCheckModal = ({
  externalCheckModal: ecm,
  setExternalCheckModal,
  setEvents,
  setActiveTenants,
  setZoomPhoto,
}: ExternalCheckModalProps) => {
  if (!ecm) return null;

  const ecEv = ecm.ev;
  const ecTm = ecm.tm;
  const moveInPhotos = ecTm?.moveInCheckPhotos || [];
  const updateEcm = (patch: any) => setExternalCheckModal((prev: any) => ({ ...prev, ...patch }));

  const [deductionCount, setDeductionCount] = useState(ecm._deductionCount || 3);
  const [comments, setComments] = useState<string[]>(ecm._comments || []);
  const [deductions, setDeductions] = useState<string[]>(ecm._deductions || []);
  const [meterElec, setMeterElec] = useState(ecm._meterElec || "");
  const [meterGas, setMeterGas] = useState(ecm._meterGas || "");
  const [issues, setIssues] = useState<Record<string, boolean>>(ecm._issues || {});
  const [issueEtcText, setIssueEtcText] = useState(ecm._issueEtcText || "");

  const deductionTotal = deductions.reduce((s, v) => s + (Number(String(v).replace(/,/g, "")) || 0), 0);

  const handleComplete = () => {
    const photos = ecTm?.moveOutPhotos || [];
    if (photos.length === 0) { toast.error("퇴실사진을 1장 이상 업로드해주세요."); return; }

    const commentSummary = comments.filter(c => c && c.trim()).join(" / ");
    const deductionItems = comments.map((c, i) => ({
      label: c || "",
      amount: Number(String(deductions[i] || "").replace(/,/g, "")) || 0,
    })).filter(d => d.label || d.amount);

    const hasIssue = Object.values(issues).some(v => v);
    const issueList = Object.entries(issues).filter(([, v]) => v).map(([k]) => k === "기타" ? (issueEtcText || "기타") : k);

    const patch: Record<string, any> = {
      externalCheckDone: true,
      externalCheckComment: commentSummary,
      repairNeeded: hasIssue,
      repairType: issueList.join(", "),
      deductionItems,
      meterElec: meterElec || "",
      meterGas: meterGas || "",
    };

    persistUpdate(ecEv.supabaseId, patch);
    setEvents((prev: any[]) => prev.map((e: any) => e === ecEv ? { ...e, ...patch } : e));
    setExternalCheckModal(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={() => setExternalCheckModal(null)}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-[90%] max-w-[700px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-lg font-extrabold text-hm-text">🔍 퇴실체크</div>
            <div className="text-xs text-hm-text-muted mt-0.5">{ecEv.building} {ecEv.room}호 · {ecEv.name || ""}</div>
          </div>
          <button onClick={() => setExternalCheckModal(null)}
            className="w-8 h-8 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
        </div>

        {/* 입주사진 (참고용) */}
        {moveInPhotos.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-hm-success mb-1.5">🏠 입주 시 사진 ({moveInPhotos.length}장) — 비교 참고용</div>
            <div className="grid grid-cols-6 gap-1">
              {moveInPhotos.slice(0, 12).map((src: string, i: number) => (
                <div key={i} onClick={() => setZoomPhoto?.({ photos: moveInPhotos, index: i, zoom: 1 })}
                  className="aspect-square rounded-md border border-emerald-200 overflow-hidden cursor-pointer bg-hm-success-bg">
                  {src && (String(src).startsWith("data:image/") || String(src).startsWith("http")) ? (
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  ) : <div className="flex items-center justify-center h-full text-base">🏠</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 퇴실사진 업로드 (편집 모드) */}
        {!ecm.viewOnly && (
          <div className="mb-4">
            <div className="text-xs font-bold text-hm-danger mb-1.5">📷 퇴실사진 촬영/업로드</div>
            <PhotoDropZone
              photos={ecTm?.moveOutPhotos || []}
              maxPhotos={50}
              label="퇴실사진"
              color="var(--color-hm-danger)"
              onAdd={async (newPhotos: string[]) => {
                const uploadedUrls = await persistUploadPhotos(newPhotos, ecEv.building, ecEv.room, "move-out");
                const merged = [...(ecTm?.moveOutPhotos || []), ...(uploadedUrls.length > 0 ? uploadedUrls : newPhotos)];
                if (ecTm && !ecTm._isPastTenant && setActiveTenants) {
                  setActiveTenants((prev: any[]) => prev.map((x: any) =>
                    x.building === ecEv.building && String(x.room) === String(ecEv.room) ? { ...x, moveOutPhotos: merged } : x));
                }
                const sbId = ecTm?.supabaseId || ecTm?.id;
                if (sbId) {
                  api.put(`/api/contracts/${sbId}`, { moveOutPhotos: merged }).catch(() => {});
                }
                updateEcm({ tm: { ...ecTm, moveOutPhotos: merged } });
              }}
              onRemove={(idx: number) => {
                const updated = (ecTm?.moveOutPhotos || []).filter((_: any, i: number) => i !== idx);
                if (ecTm && !ecTm._isPastTenant && setActiveTenants) {
                  setActiveTenants((prev: any[]) => prev.map((x: any) =>
                    x.building === ecEv.building && String(x.room) === String(ecEv.room) ? { ...x, moveOutPhotos: updated } : x));
                }
                updateEcm({ tm: { ...ecTm, moveOutPhotos: updated } });
              }}
            />
          </div>
        )}

        {/* viewOnly: 퇴실사진 보기 전용 */}
        {ecm.viewOnly && (ecTm?.moveOutPhotos || []).length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-hm-danger mb-1.5">🚪 퇴실사진 ({(ecTm?.moveOutPhotos || []).length}장)</div>
            <div className="grid grid-cols-6 gap-1">
              {(ecTm?.moveOutPhotos || []).slice(0, 12).map((src: string, i: number) => (
                <div key={i} onClick={() => setZoomPhoto?.({ photos: ecTm?.moveOutPhotos || [], index: i, zoom: 1 })}
                  className="aspect-square rounded-md border border-red-200 overflow-hidden cursor-pointer bg-hm-danger-bg">
                  {src && (String(src).startsWith("data:image/") || String(src).startsWith("http")) ? (
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  ) : <div className="flex items-center justify-center h-full text-base">📷</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 손상내역 / 공제금액 (편집 모드) */}
        {!ecm.viewOnly && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <div className="text-xs font-bold text-hm-text">📝 손상내역 / 공제금액</div>
              {deductionTotal > 0 && <span className="text-[11px] font-extrabold text-hm-danger">공제합계: {deductionTotal.toLocaleString()}원</span>}
            </div>
            <div className="flex gap-1.5 mb-1">
              <span className="min-w-[16px]" />
              <span className="flex-1 text-[9px] text-gray-400 font-semibold">손상 내역 (정산서 공제항목 연동)</span>
              <span className="w-[100px] text-[9px] text-gray-400 font-semibold text-right">공제 금액</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: deductionCount }, (_, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-hm-text-muted min-w-[16px] text-center">{idx + 1}</span>
                  <input value={comments[idx] || ""} onChange={e => {
                    const next = [...comments];
                    while (next.length <= idx) next.push("");
                    next[idx] = e.target.value;
                    setComments(next);
                  }}
                    placeholder={`공제${idx + 1}`}
                    className="flex-1 px-2.5 py-2 rounded-md border border-hm-input-border text-xs font-[inherit] box-border outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
                  <input value={deductions[idx] || ""} onChange={e => {
                    const next = [...deductions];
                    while (next.length <= idx) next.push("");
                    next[idx] = e.target.value;
                    setDeductions(next);
                  }}
                    placeholder="0"
                    className="w-[100px] px-2.5 py-2 rounded-md border border-hm-input-border text-xs font-[inherit] text-right box-border outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDeductionCount(c => c + 1)}
              className="mt-1.5 px-3 py-1 rounded-md border border-dashed border-gray-400 bg-hm-bg-hover text-gray-500 text-[10px] font-semibold cursor-pointer font-[inherit] hover:bg-gray-200 transition-colors">
              + 공제항목 추가
            </button>
          </div>
        )}

        {/* 퇴실 검침값 (편집 모드) */}
        {!ecm.viewOnly && (
          <div className="mb-4">
            <div className="text-xs font-bold text-hm-text mb-1.5">⚡ 퇴실 검침값</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] font-semibold text-hm-warning mb-[3px]">전기 검침</div>
                <input value={meterElec} onChange={e => setMeterElec(e.target.value)}
                  placeholder="검침값 입력" type="number"
                  className="w-full px-2.5 py-2 rounded-md border border-orange-200 bg-hm-warning-bg text-[13px] font-mono text-right box-border outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-hm-blue mb-[3px]">가스 검침</div>
                <input value={meterGas} onChange={e => setMeterGas(e.target.value)}
                  placeholder="검침값 입력" type="number"
                  className="w-full px-2.5 py-2 rounded-md border border-blue-200 bg-hm-blue-bg text-[13px] font-mono text-right box-border outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* 이슈 체크리스트 (편집 모드) */}
        {!ecm.viewOnly && (
          <div className="mb-5">
            <div className="text-xs font-bold text-hm-text mb-2">🔧 이슈 체크</div>
            <div className="flex flex-col gap-1.5">
              {ISSUE_ITEMS.map(item => {
                const checked = !!issues[item.key];
                return (
                  <label key={item.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border-[1.5px] transition-colors ${checked ? 'bg-hm-danger-bg border-red-200' : 'bg-hm-bg-hover border-gray-200'}`}>
                    <input type="checkbox" checked={checked} onChange={() => setIssues(prev => ({ ...prev, [item.key]: !checked }))}
                      className="w-4 h-4" style={{ accentColor: item.color }} />
                    <span className="text-xs" style={{ fontWeight: checked ? 700 : 500, color: checked ? item.color : "var(--color-hm-text-sub)" }}>{item.label}</span>
                    {checked && item.key === "기타" && (
                      <input value={issueEtcText} onChange={e => { e.stopPropagation(); setIssueEtcText(e.target.value); }}
                        onClick={e => e.stopPropagation()} placeholder="내용 입력"
                        className="flex-1 px-2 py-1 rounded border border-hm-input-border text-[11px] font-[inherit] outline-none focus:ring-2 focus:ring-ring transition-colors" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* 체크 완료 버튼 */}
        {!ecm.viewOnly && (
          <button type="button" onClick={handleComplete}
            className="w-full py-3.5 rounded-[10px] border-none bg-hm-blue text-white text-[15px] font-extrabold cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
            ✅ 퇴실체크 완료
          </button>
        )}

        {/* viewOnly: 체크 결과 표시 */}
        {ecm.viewOnly && (
          <div className="mt-2 p-3 rounded-lg bg-hm-bg-hover border border-hm-border">
            <div className="text-[11px] text-hm-text-muted font-bold mb-1">체크 완료됨</div>
            {ecEv.deductionItems && ecEv.deductionItems.length > 0 && (
              <div className="mt-1">
                <div className="text-[11px] font-bold text-hm-text-sub mb-1">📝 공제 내역</div>
                {ecEv.deductionItems.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs text-gray-700 pl-2 mb-0.5">
                    <span>• {d.label}</span>
                    {d.amount > 0 && <span className="font-bold text-hm-danger">{d.amount.toLocaleString()}원</span>}
                  </div>
                ))}
                <div className="flex justify-between pl-2 mt-1 pt-1 border-t border-gray-200 text-xs font-extrabold">
                  <span>공제 합계</span>
                  <span className="text-hm-danger">{ecEv.deductionItems.reduce((s: number, d: any) => s + (d.amount || 0), 0).toLocaleString()}원</span>
                </div>
              </div>
            )}
            {!ecEv.deductionItems && ecEv.externalCheckComment && (
              <div className="mt-1">
                <div className="text-[11px] font-bold text-hm-text-sub mb-0.5">📝 손상 코멘트</div>
                {ecEv.externalCheckComment.split(" / ").map((c: string, i: number) => (
                  <div key={i} className="text-xs text-gray-700 pl-2">• {c}</div>
                ))}
              </div>
            )}
            {(ecEv.meterElec || ecEv.meterGas) && (
              <div className="flex gap-3 mt-2">
                {ecEv.meterElec && <span className="text-[11px] text-hm-warning font-semibold">⚡ 전기: {ecEv.meterElec}</span>}
                {ecEv.meterGas && <span className="text-[11px] text-hm-blue font-semibold">🔥 가스: {ecEv.meterGas}</span>}
              </div>
            )}
            {ecEv.repairNeeded ? (
              <div className="text-xs text-hm-danger mt-2 px-2.5 py-1.5 bg-hm-danger-bg rounded-md border border-red-200">
                🔧 이슈: {ecEv.repairType}
              </div>
            ) : (
              <div className="text-xs text-hm-success mt-2">✔ 이슈 없음</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
