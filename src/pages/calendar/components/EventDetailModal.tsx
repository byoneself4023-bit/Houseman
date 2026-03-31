import React from 'react';
import { toast } from 'sonner';
import { inputClassName } from '@/components/Field';
import { persistUpdate, persistDelete } from '../calendarApi';

interface EventDetailModalProps {
  editEvent: { idx: number; evt: Record<string, any>; edits: Record<string, any> } | null;
  setEditEvent: (v: any) => void;
  setEvents: (fn: any) => void;
  saveEditEvent: () => void;
  setActiveVacancies?: (fn: any) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  editEvent, setEditEvent, setEvents, saveEditEvent, setActiveVacancies,
}) => {
  if (!editEvent) return null;

  const { edits } = editEvent;
  const edt = (k: string, v: any) => setEditEvent((prev: any) => ({ ...prev, edits: { ...prev.edits, [k]: v } }));
  const fld = (label: string, key: string, type = "text") => (
    <div>
      <div className="text-[10px] font-bold text-hm-text-sub mb-[3px]">{label}</div>
      <input value={edits[key] || ""} onChange={e => edt(key, type === "number" ? Number(e.target.value) || 0 : e.target.value)}
        type={type} className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
      onClick={() => setEditEvent(null)}>
      <div className="bg-white rounded-2xl p-6 w-[420px] max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,.3)]"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-extrabold text-hm-text">✏️ {edits.type} 수정</div>
          <button onClick={() => setEditEvent(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* 공통: 날짜 */}
          <div>
            <div className="text-[10px] font-bold text-hm-text-sub mb-[3px]">날짜</div>
            <input type="date" value={edits.date || ""} onChange={e => {
              edt("date", e.target.value);
              if (edits.type === "계약" && edits.moveIn === editEvent.evt.date) edt("moveIn", e.target.value);
            }} className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
          </div>

          {/* 계약 */}
          {edits.type === "계약" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {fld("건물명", "building")}
                {fld("호실", "room")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fld("보증금 (만원)", "deposit", "number")}
                {fld("월세 (만원)", "rent", "number")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fld("NEGO (만원)", "nego", "number")}
                {fld("관리비 (만원)", "mgmt", "number")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] font-bold text-hm-text-sub mb-[3px]">입주일</div>
                  <input type="date" value={edits.moveIn || ""} onChange={e => edt("moveIn", e.target.value)}
                    className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-hm-text-sub mb-[3px]">만기일</div>
                  <input type="date" value={edits.expiry || ""} onChange={e => edt("expiry", e.target.value)}
                    className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] font-bold text-hm-text-sub mb-[3px]">계약일</div>
                  <input type="date" value={edits.contractDate || ""} onChange={e => edt("contractDate", e.target.value)}
                    className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-hm-text-sub mb-[3px]">등록자</div>
                  <input value={edits.registeredBy || ""} readOnly
                    className={`${inputClassName} !px-2.5 !py-2 !text-xs !bg-gray-100 !text-hm-text-muted`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fld("부동산", "broker")}
                {fld("부동산 연락처", "brokerPhone")}
              </div>
              {(edits.waterFee != null || edits.cable != null || edits.exitFee != null || edits.commBroker != null) && (
                <>
                  <div className="text-[10px] font-bold text-hm-blue mt-1">단기 전용</div>
                  <div className="grid grid-cols-2 gap-2">
                    {fld("수도", "waterFee")}
                    {fld("인터넷/케이블", "cable")}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fld("퇴실청소비 (만원)", "exitFee", "number")}
                    {fld("중개수수료 (%)", "commBroker", "number")}
                  </div>
                </>
              )}
            </>
          )}

          {/* 퇴실 */}
          {edits.type === "퇴실" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {fld("건물명", "building")}
                {fld("호실", "room")}
              </div>
            </>
          )}

          {/* 휴무 */}
          {edits.type === "휴무" && (
            <>
              {fld("이름", "name")}
            </>
          )}
        </div>

        <div className="flex justify-between items-center mt-5">
          <button onClick={() => {
            const { idx, evt } = editEvent;
            if (evt.type === "퇴실" && (evt.externalCheckDone || evt.moveOutLinkCompleted || evt.moveOutLinkSent || evt.settled || evt.cleaningDone)) { toast.error("퇴실 워크플로우가 진행된 일정은 삭제할 수 없습니다."); return; }
            persistDelete(evt.supabaseId);
            if (evt.type === "계약" && evt.building && evt.room) {
              setActiveVacancies?.((prev: any[]) => prev.map((v: any) => v.building === evt.building && String(v.room) === String(evt.room) ? { ...v, status: "홍보중" } : v));
            }
            setEditEvent(null);
            setEvents((prev: any[]) => prev.filter((_: any, j: number) => j !== idx));
          }}
            className="px-5 py-2 rounded-lg border border-red-200 bg-hm-danger-bg text-hm-danger font-bold text-xs cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">
            일정삭제
          </button>
          <div className="flex gap-2">
            <button onClick={() => setEditEvent(null)}
              className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              취소
            </button>
            <button onClick={() => { persistUpdate(editEvent.evt.supabaseId, editEvent.edits); saveEditEvent(); }}
              className="px-5 py-2 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
