// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';

/**
 * 임차인 퇴실 링크 페이지 (외부 — 인증 없이 접근)
 * URL: /move-out/:eventId
 *
 * 임차인이 입력하는 항목:
 * 1. 퇴실날짜 (자동 표시, 확인만)
 * 2. 호실 비밀번호
 * 3. 환불 계좌 (은행/계좌번호/예금주)
 * 4. 주의사항 확인 (체크박스)
 */

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행",
  "기업은행", "SC제일은행", "씨티은행", "카카오뱅크", "토스뱅크",
  "케이뱅크", "새마을금고", "신협", "우체국", "수협은행",
];

const inputCls = 'w-full px-4 py-3 rounded-lg border border-hm-input-border text-sm font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors';

export const MoveOutLinkPage = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // 입력값
  const [doorPassword, setDoorPassword] = useState('');
  const [refundBank, setRefundBank] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundHolder, setRefundHolder] = useState('');
  const [agreed, setAgreed] = useState(false);

  // 이벤트 로드
  useEffect(() => {
    if (!eventId) { setError('잘못된 링크입니다.'); setLoading(false); return; }
    // TODO Phase 6: 공개 API endpoint 필요 (GET /api/move-out-link/:eventId)
    api.get(`/api/calendar/${eventId}`)
      .then((data) => {
        if (!data) {
          setError('퇴실 정보를 찾을 수 없습니다.');
        } else if ((data as any).moveOutLinkCompleted) {
          setSubmitted(true);
          setEvent(data);
        } else {
          setEvent(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('퇴실 정보를 찾을 수 없습니다.');
        setLoading(false);
      });
  }, [eventId]);

  const handleSubmit = async () => {
    if (!doorPassword) return alert('호실 비밀번호를 입력해주세요.');
    if (!refundBank) return alert('환불 은행을 선택해주세요.');
    if (!refundAccount) return alert('환불 계좌번호를 입력해주세요.');
    if (!refundHolder) return alert('예금주를 입력해주세요.');
    if (!agreed) return alert('주의사항을 확인해주세요.');

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    // TODO Phase 6: 공개 API endpoint 필요 (PUT /api/move-out-link/:eventId)
    let err = null;
    try {
      await api.put(`/api/calendar/${eventId}`, {
        moveOutLinkCompleted: true,
        moveOutLinkCompletedAt: now,
        doorPassword,
        refundBank,
        refundAccount,
        refundHolder,
      });
    } catch (e) {
      err = e;
    }

    if (err) {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } else {
      setSubmitted(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-hm-bg font-['Pretendard',sans-serif]">
      <span className="text-sm text-hm-text-muted">로딩 중...</span>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-hm-bg font-['Pretendard',sans-serif]">
      <div className="bg-white rounded-2xl p-8 max-w-[400px] text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="text-5xl mb-4">😔</div>
        <div className="text-base font-bold text-hm-danger">{error}</div>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-hm-bg font-['Pretendard',sans-serif]">
      <div className="bg-white rounded-2xl p-8 max-w-[400px] text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="text-5xl mb-4">✅</div>
        <div className="text-lg font-bold text-hm-success mb-2">퇴실 정보 입력 완료</div>
        <div className="text-sm text-hm-text-muted leading-relaxed">
          {event?.building_name} {event?.room_number}호<br />
          입력해주셔서 감사합니다.<br />
          퇴실 절차가 진행됩니다.
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-hm-bg font-['Pretendard',sans-serif] px-4 py-6">
      <div className="max-w-[420px] mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl px-5 py-6 mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-center">
          <div className="text-sm font-bold text-hm-text-muted mb-1">HOUSEMAN 건물관리</div>
          <div className="text-xl font-bold text-hm-text mb-2">🚪 퇴실 정보 입력</div>
          <div className="inline-flex gap-2 px-4 py-1.5 rounded-lg bg-hm-danger-bg border border-hm-danger-border">
            <span className="text-sm font-bold text-hm-danger">{event?.building_name} {event?.room_number}호</span>
            <span className="text-sm text-hm-text-muted">·</span>
            <span className="text-sm text-hm-danger">{event?.event_date}</span>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl px-5 py-6 mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {/* 퇴실날짜 */}
          <div className="mb-5">
            <div className="text-xs font-bold text-hm-text-muted mb-1.5">퇴실 예정일</div>
            <div className={`${inputCls} bg-hm-bg-slate text-hm-text font-bold`}>{event?.event_date}</div>
          </div>

          {/* 호실 비밀번호 */}
          <div className="mb-5">
            <div className="text-xs font-bold text-hm-text mb-1.5">🔑 호실 비밀번호 <span className="text-hm-danger">*</span></div>
            <input value={doorPassword} onChange={e => setDoorPassword(e.target.value)}
              placeholder="현관 비밀번호를 입력해주세요"
              className={inputCls} />
          </div>

          {/* 환불 계좌 */}
          <div className="mb-5">
            <div className="text-xs font-bold text-hm-text mb-1.5">🏦 보증금 환불 계좌 <span className="text-hm-danger">*</span></div>
            <select value={refundBank} onChange={e => setRefundBank(e.target.value)}
              className={`${inputCls} mb-2 cursor-pointer`}>
              <option value="">은행 선택</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input value={refundAccount} onChange={e => setRefundAccount(e.target.value)}
              placeholder="계좌번호 (- 없이 숫자만)"
              className={`${inputCls} mb-2`} />
            <input value={refundHolder} onChange={e => setRefundHolder(e.target.value)}
              placeholder="예금주"
              className={inputCls} />
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="text-xs font-bold text-hm-warning mb-2.5">⚠️ 퇴실 주의사항</div>
          <div className="text-xs text-hm-text-sub leading-[1.8]">
            • 퇴실일 당일 짐을 모두 빼주세요.<br />
            • 쓰레기 및 개인물품은 모두 처리해주세요.<br />
            • 시설물 훼손 시 수리비가 청구될 수 있습니다.<br />
            • 보증금 환불은 정산 완료 후 입금됩니다.<br />
            • 퇴실 후 호실 비밀번호가 변경됩니다.
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="w-[18px] h-[18px] accent-hm-success" />
            <span className={`text-sm font-bold ${agreed ? 'text-hm-success' : 'text-hm-text-muted'}`}>위 내용을 확인했습니다</span>
          </label>
        </div>

        {/* 제출 버튼 */}
        <button onClick={handleSubmit}
          disabled={!agreed}
          className={`w-full py-4 rounded-xl border-none text-base font-bold font-[inherit] transition-all duration-200 ${agreed ? 'bg-hm-danger text-white cursor-pointer shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-default shadow-none'}`}>
          퇴실 정보 제출
        </button>

        <div className="text-center mt-4 text-xs text-[#B0B5C1]">
          HOUSEMAN 건물관리 시스템
        </div>
      </div>
    </div>
  );
};
