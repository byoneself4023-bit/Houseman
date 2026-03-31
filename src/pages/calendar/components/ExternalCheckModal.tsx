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
import { supabase } from '@/lib/supabase';

const ISSUE_ITEMS = [
  { key: "외부업체", label: "외부업체 수리 필요", color: "#DC2626" },
  { key: "교체", label: "가구/설비 교체 필요", color: "#EA580C" },
  { key: "도배", label: "도배/장판 필요", color: "#7C3AED" },
  { key: "누수", label: "누수/배관 이슈", color: "#2563EB" },
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setExternalCheckModal(null)}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, padding: 24, width: "90%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>🔍 퇴실체크</div>
            <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2 }}>{ecEv.building} {ecEv.room}호 · {ecEv.name || ""}</div>
          </div>
          <button onClick={() => setExternalCheckModal(null)}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>✕</button>
        </div>

        {/* 입주사진 (참고용) */}
        {moveInPhotos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 6 }}>🏠 입주 시 사진 ({moveInPhotos.length}장) — 비교 참고용</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
              {moveInPhotos.slice(0, 12).map((src: string, i: number) => (
                <div key={i} onClick={() => setZoomPhoto?.({ photos: moveInPhotos, index: i, zoom: 1 })}
                  style={{ aspectRatio: "1", borderRadius: 6, border: "1px solid #A7F3D0", overflow: "hidden", cursor: "pointer", background: "#ECFDF5" }}>
                  {src && (String(src).startsWith("data:image/") || String(src).startsWith("http")) ? (
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 16 }}>🏠</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 퇴실사진 업로드 (편집 모드) */}
        {!ecm.viewOnly && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>📷 퇴실사진 촬영/업로드</div>
            <PhotoDropZone
              photos={ecTm?.moveOutPhotos || []}
              maxPhotos={50}
              label="퇴실사진"
              color="#DC2626"
              onAdd={async (newPhotos: string[]) => {
                const uploadedUrls = await persistUploadPhotos(newPhotos, ecEv.building, ecEv.room, "move-out");
                const merged = [...(ecTm?.moveOutPhotos || []), ...(uploadedUrls.length > 0 ? uploadedUrls : newPhotos)];
                if (ecTm && !ecTm._isPastTenant && setActiveTenants) {
                  setActiveTenants((prev: any[]) => prev.map((x: any) =>
                    x.building === ecEv.building && String(x.room) === String(ecEv.room) ? { ...x, moveOutPhotos: merged } : x));
                }
                const sbId = ecTm?.supabaseId;
                if (sbId && supabase) {
                  supabase.from('tenants').update({ move_out_photos: merged }).eq('id', sbId);
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
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>🚪 퇴실사진 ({(ecTm?.moveOutPhotos || []).length}장)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
              {(ecTm?.moveOutPhotos || []).slice(0, 12).map((src: string, i: number) => (
                <div key={i} onClick={() => setZoomPhoto?.({ photos: ecTm?.moveOutPhotos || [], index: i, zoom: 1 })}
                  style={{ aspectRatio: "1", borderRadius: 6, border: "1px solid #FECACA", overflow: "hidden", cursor: "pointer", background: "#FEF2F2" }}>
                  {src && (String(src).startsWith("data:image/") || String(src).startsWith("http")) ? (
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 16 }}>📷</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 손상내역 / 공제금액 (편집 모드) */}
        {!ecm.viewOnly && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>📝 손상내역 / 공제금액</div>
              {deductionTotal > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: "#DC2626" }}>공제합계: {deductionTotal.toLocaleString()}원</span>}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <span style={{ minWidth: 16 }} />
              <span style={{ flex: 1, fontSize: 9, color: "#9CA3AF", fontWeight: 600 }}>손상 내역 (정산서 공제항목 연동)</span>
              <span style={{ width: 100, fontSize: 9, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>공제 금액</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Array.from({ length: deductionCount }, (_, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#8F95A3", minWidth: 16, textAlign: "center" }}>{idx + 1}</span>
                  <input value={comments[idx] || ""} onChange={e => {
                    const next = [...comments];
                    while (next.length <= idx) next.push("");
                    next[idx] = e.target.value;
                    setComments(next);
                  }}
                    placeholder={`공제${idx + 1}`}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                  <input value={deductions[idx] || ""} onChange={e => {
                    const next = [...deductions];
                    while (next.length <= idx) next.push("");
                    next[idx] = e.target.value;
                    setDeductions(next);
                  }}
                    placeholder="0"
                    style={{ width: 100, padding: "8px 10px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", textAlign: "right", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDeductionCount(c => c + 1)}
              style={{ marginTop: 6, padding: "4px 12px", borderRadius: 6, border: "1px dashed #9CA3AF", background: "#F9FAFB", color: "#6B7280", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              + 공제항목 추가
            </button>
          </div>
        )}

        {/* 퇴실 검침값 (편집 모드) */}
        {!ecm.viewOnly && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23", marginBottom: 6 }}>⚡ 퇴실 검침값</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#EA580C", marginBottom: 3 }}>전기 검침</div>
                <input value={meterElec} onChange={e => setMeterElec(e.target.value)}
                  placeholder="검침값 입력" type="number"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #FED7AA", background: "#FFF7ED", fontSize: 13, fontFamily: "monospace", textAlign: "right", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#3B82F6", marginBottom: 3 }}>가스 검침</div>
                <input value={meterGas} onChange={e => setMeterGas(e.target.value)}
                  placeholder="검침값 입력" type="number"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #BFDBFE", background: "#EFF6FF", fontSize: 13, fontFamily: "monospace", textAlign: "right", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        )}

        {/* 이슈 체크리스트 (편집 모드) */}
        {!ecm.viewOnly && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23", marginBottom: 8 }}>🔧 이슈 체크</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ISSUE_ITEMS.map(item => {
                const checked = !!issues[item.key];
                return (
                  <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                    background: checked ? "#FEF2F2" : "#F9FAFB", border: `1.5px solid ${checked ? "#FECACA" : "#E5E7EB"}` }}>
                    <input type="checkbox" checked={checked} onChange={() => setIssues(prev => ({ ...prev, [item.key]: !checked }))}
                      style={{ width: 16, height: 16, accentColor: item.color }} />
                    <span style={{ fontSize: 12, fontWeight: checked ? 700 : 500, color: checked ? item.color : "#5F6577" }}>{item.label}</span>
                    {checked && item.key === "기타" && (
                      <input value={issueEtcText} onChange={e => { e.stopPropagation(); setIssueEtcText(e.target.value); }}
                        onClick={e => e.stopPropagation()} placeholder="내용 입력"
                        style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid #E0E3E9", fontSize: 11, fontFamily: "inherit" }} />
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
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "#3B82F6", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            ✅ 퇴실체크 완료
          </button>
        )}

        {/* viewOnly: 체크 결과 표시 */}
        {ecm.viewOnly && (
          <div style={{ marginTop: 8, padding: "12px", borderRadius: 8, background: "#F9FAFB", border: "1px solid #E8ECF0" }}>
            <div style={{ fontSize: 11, color: "#8F95A3", fontWeight: 700, marginBottom: 4 }}>체크 완료됨</div>
            {ecEv.deductionItems && ecEv.deductionItems.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>📝 공제 내역</div>
                {ecEv.deductionItems.map((d: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151", paddingLeft: 8, marginBottom: 2 }}>
                    <span>• {d.label}</span>
                    {d.amount > 0 && <span style={{ fontWeight: 700, color: "#DC2626" }}>{d.amount.toLocaleString()}원</span>}
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, marginTop: 4, paddingTop: 4, borderTop: "1px solid #E5E7EB", fontSize: 12, fontWeight: 800 }}>
                  <span>공제 합계</span>
                  <span style={{ color: "#DC2626" }}>{ecEv.deductionItems.reduce((s: number, d: any) => s + (d.amount || 0), 0).toLocaleString()}원</span>
                </div>
              </div>
            )}
            {!ecEv.deductionItems && ecEv.externalCheckComment && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 2 }}>📝 손상 코멘트</div>
                {ecEv.externalCheckComment.split(" / ").map((c: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", paddingLeft: 8 }}>• {c}</div>
                ))}
              </div>
            )}
            {(ecEv.meterElec || ecEv.meterGas) && (
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {ecEv.meterElec && <span style={{ fontSize: 11, color: "#EA580C", fontWeight: 600 }}>⚡ 전기: {ecEv.meterElec}</span>}
                {ecEv.meterGas && <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600 }}>🔥 가스: {ecEv.meterGas}</span>}
              </div>
            )}
            {ecEv.repairNeeded ? (
              <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8, padding: "6px 10px", background: "#FEF2F2", borderRadius: 6, border: "1px solid #FECACA" }}>
                🔧 이슈: {ecEv.repairType}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#059669", marginTop: 8 }}>✔ 이슈 없음</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
