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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F8', fontFamily: "'Pretendard', sans-serif" }}>
      <span style={{ fontSize: 14, color: '#8F95A3' }}>로딩 중...</span>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F8', fontFamily: "'Pretendard', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626' }}>{error}</div>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F8', fontFamily: "'Pretendard', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#059669', marginBottom: 8 }}>퇴실 정보 입력 완료</div>
        <div style={{ fontSize: 13, color: '#8F95A3', lineHeight: 1.6 }}>
          {event?.building_name} {event?.room_number}호<br />
          입력해주셔서 감사합니다.<br />
          퇴실 절차가 진행됩니다.
        </div>
      </div>
    </div>
  );

  const iS = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E0E3E9', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F8', fontFamily: "'Pretendard', sans-serif", padding: '24px 16px' }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8F95A3', marginBottom: 4 }}>HOUSEMAN 건물관리</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1D23', marginBottom: 8 }}>🚪 퇴실 정보 입력</div>
          <div style={{ display: 'inline-flex', gap: 8, padding: '6px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{event?.building_name} {event?.room_number}호</span>
            <span style={{ fontSize: 13, color: '#8F95A3' }}>·</span>
            <span style={{ fontSize: 13, color: '#DC2626' }}>{event?.event_date}</span>
          </div>
        </div>

        {/* 입력 폼 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* 퇴실날짜 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8F95A3', marginBottom: 6 }}>퇴실 예정일</div>
            <div style={{ ...iS, background: '#F8FAFC', color: '#1A1D23', fontWeight: 700 }}>{event?.event_date}</div>
          </div>

          {/* 호실 비밀번호 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1D23', marginBottom: 6 }}>🔑 호실 비밀번호 <span style={{ color: '#DC2626' }}>*</span></div>
            <input value={doorPassword} onChange={e => setDoorPassword(e.target.value)}
              placeholder="현관 비밀번호를 입력해주세요"
              style={iS} />
          </div>

          {/* 환불 계좌 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1D23', marginBottom: 6 }}>🏦 보증금 환불 계좌 <span style={{ color: '#DC2626' }}>*</span></div>
            <select value={refundBank} onChange={e => setRefundBank(e.target.value)}
              style={{ ...iS, marginBottom: 8, cursor: 'pointer' }}>
              <option value="">은행 선택</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input value={refundAccount} onChange={e => setRefundAccount(e.target.value)}
              placeholder="계좌번호 (- 없이 숫자만)"
              style={{ ...iS, marginBottom: 8 }} />
            <input value={refundHolder} onChange={e => setRefundHolder(e.target.value)}
              placeholder="예금주"
              style={iS} />
          </div>
        </div>

        {/* 주의사항 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#EA580C', marginBottom: 10 }}>⚠️ 퇴실 주의사항</div>
          <div style={{ fontSize: 12, color: '#5F6577', lineHeight: 1.8 }}>
            • 퇴실일 당일 짐을 모두 빼주세요.<br />
            • 쓰레기 및 개인물품은 모두 처리해주세요.<br />
            • 시설물 훼손 시 수리비가 청구될 수 있습니다.<br />
            • 보증금 환불은 정산 완료 후 입금됩니다.<br />
            • 퇴실 후 호실 비밀번호가 변경됩니다.
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#059669' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: agreed ? '#059669' : '#8F95A3' }}>위 내용을 확인했습니다</span>
          </label>
        </div>

        {/* 제출 버튼 */}
        <button onClick={handleSubmit}
          disabled={!agreed}
          style={{
            width: '100%', padding: '16px', borderRadius: 12, border: 'none',
            background: agreed ? '#DC2626' : '#E5E7EB',
            color: agreed ? '#fff' : '#9CA3AF',
            fontSize: 16, fontWeight: 800, cursor: agreed ? 'pointer' : 'default',
            fontFamily: 'inherit', boxShadow: agreed ? '0 4px 12px rgba(220,38,38,0.3)' : 'none',
            transition: 'all 0.2s',
          }}>
          퇴실 정보 제출
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#B0B5C1' }}>
          HOUSEMAN 건물관리 시스템
        </div>
      </div>
    </div>
  );
};
