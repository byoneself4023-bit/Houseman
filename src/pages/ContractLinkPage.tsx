/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useIsMobile } from '@/utils/useIsMobile';
import { toast } from 'sonner';

const fmt = (n: any) => n ? Number(n).toLocaleString() : '0';
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };

export const ContractLinkPage = () => {
  const { contractId } = useParams();
  const isMobile = useIsMobile();

  const contract = useMemo(() => {
    try {
      const contracts = JSON.parse(localStorage.getItem('hm_contracts') || '{}');
      return contracts[contractId!] || null;
    } catch { return null; }
  }, [contractId]);

  const [step, setStep] = useState<'broker' | 'tenant' | 'verify' | 'done'>('broker');
  const [brokerForm, setBrokerForm] = useState({ name: '', phone: '', memo: '' });
  const [tenantForm, setTenantForm] = useState({
    name: '', phone: '', ssn: '', address: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    carNumber: '', paymentAlias: '', email: '',
  });
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [, setVerified] = useState(false);

  if (!contract) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>계약서를 찾을 수 없습니다</div>
          <div style={{ fontSize: 14, color: '#6B7280' }}>링크가 만료되었거나 잘못된 주소입니다.</div>
        </div>
      </div>
    );
  }

  const depositLabel = contract.type === '단기' ? '예치금' : '보증금';

  if (step === 'done') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0FDF4', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
        <div style={{ textAlign: 'center', padding: 32, maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#059669', marginBottom: 8 }}>계약서 전송 완료</div>
          <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
            {contract.building} {contract.room}호 계약 정보가 전송되었습니다.<br />
            HOUSEMAN에서 확인 후 안내드리겠습니다.
          </div>
          <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #A7F3D0', textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 8 }}>전송된 정보</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              <div>임차인: {tenantForm.name}</div>
              <div>연락처: {tenantForm.phone}</div>
              <div>입주일: {contract.moveIn}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: '#111', color: '#fff', padding: '16px 20px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>HOUSEMAN</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{contract.building} {contract.room}호 계약서</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{contract.type} · 입주일 {contract.moveIn}</div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 16px' }}>
        {/* 계약 정보 요약 */}
        <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 12 }}>계약 정보</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <div style={{ color: '#6B7280' }}>{depositLabel}</div><div style={{ fontWeight: 700 }}>{fmt(contract.deposit)}만원</div>
            <div style={{ color: '#6B7280' }}>월세</div><div style={{ fontWeight: 700, color: '#c41230' }}>{fmt(contract.rent)}만원</div>
            {contract.mgmt > 0 && <><div style={{ color: '#6B7280' }}>관리비</div><div style={{ fontWeight: 700 }}>{fmt(contract.mgmt)}만원</div></>}
            <div style={{ color: '#6B7280' }}>입주일</div><div style={{ fontWeight: 700 }}>{contract.moveIn}</div>
            {contract.expiry && <><div style={{ color: '#6B7280' }}>만기일</div><div style={{ fontWeight: 700 }}>{contract.expiry}</div></>}
          </div>
        </div>

        {/* 특약사항 */}
        {contract.specialTerms && (
          <div style={{ padding: 16, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E', marginBottom: 8 }}>계약 특약사항</div>
            <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{contract.specialTerms}</div>
          </div>
        )}

        {/* 부동산 입력 단계 */}
        {step === 'broker' && (
          <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '2px solid #3B82F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#3B82F6', padding: '3px 10px', borderRadius: 20 }}>STEP 1</span>
              <span style={{ fontSize: 16, fontWeight: 800 }}>부동산 정보 입력</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>부동산에서 작성할 부분입니다. 완료 후 임차인에게 링크를 전달해주세요.</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>부동산명 *</div>
              <input value={brokerForm.name} onChange={e => setBrokerForm(p => ({ ...p, name: e.target.value }))}
                placeholder={contract.broker || '부동산명'} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>연락처 *</div>
              <input value={brokerForm.phone} onChange={e => setBrokerForm(p => ({ ...p, phone: e.target.value }))}
                placeholder={contract.brokerPhone || '010-0000-0000'} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>메모 (선택)</div>
              <textarea value={brokerForm.memo} onChange={e => setBrokerForm(p => ({ ...p, memo: e.target.value }))}
                placeholder="특이사항이 있으면 입력해주세요" rows={2}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }} />
            </div>

            <button onClick={() => {
              const name = brokerForm.name || contract.broker;
              const phone = brokerForm.phone || contract.brokerPhone;
              if (!name || !phone) { toast.error('부동산명과 연락처를 입력해주세요.'); return; }
              try {
                const contracts = JSON.parse(localStorage.getItem('hm_contracts') || '{}');
                if (contracts[contractId!]) {
                  contracts[contractId!].brokerInputName = name;
                  contracts[contractId!].brokerInputPhone = phone;
                  contracts[contractId!].brokerMemo = brokerForm.memo;
                  contracts[contractId!].status = 'tenant_pending';
                  localStorage.setItem('hm_contracts', JSON.stringify(contracts));
                }
              } catch { /* ignore */ }
              setStep('tenant');
            }}
              style={{ width: '100%', padding: '14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              완료 → 임차인에게 전달하기
            </button>
            <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>완료 후 이 화면을 임차인에게 보여주시면 됩니다</div>
          </div>
        )}

        {/* 임차인 입력 단계 */}
        {step === 'tenant' && (
          <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '2px solid #059669' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#059669', padding: '3px 10px', borderRadius: 20 }}>STEP 2</span>
              <span style={{ fontSize: 16, fontWeight: 800 }}>임차인 정보 입력</span>
            </div>
            <div style={{ fontSize: 12, marginBottom: 16, padding: '8px 12px', background: '#ECFDF5', borderRadius: 6, fontWeight: 600, color: '#059669' }}>
              임차인분께서 직접 입력해주세요
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', marginBottom: 3 }}>이름 *</div>
                <input value={tenantForm.name} onChange={e => setTenantForm(p => ({ ...p, name: e.target.value }))} placeholder="이름" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', marginBottom: 3 }}>연락처 *</div>
                <input value={tenantForm.phone} onChange={e => setTenantForm(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', marginBottom: 3 }}>주민등록번호 *</div>
                <input value={tenantForm.ssn} onChange={e => setTenantForm(p => ({ ...p, ssn: e.target.value }))} placeholder="000000-0000000" style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>이메일</div>
                <input value={tenantForm.email} onChange={e => setTenantForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>주소</div>
              <input value={tenantForm.address} onChange={e => setTenantForm(p => ({ ...p, address: e.target.value }))} placeholder="현재 거주지 주소" style={inputStyle} />
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>비상연락처</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>이름</div>
                <input value={tenantForm.emergencyName} onChange={e => setTenantForm(p => ({ ...p, emergencyName: e.target.value }))} placeholder="이름" style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>연락처</div>
                <input value={tenantForm.emergencyPhone} onChange={e => setTenantForm(p => ({ ...p, emergencyPhone: e.target.value }))} placeholder="010-0000-0000" style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>관계</div>
                <input value={tenantForm.emergencyRelation} onChange={e => setTenantForm(p => ({ ...p, emergencyRelation: e.target.value }))} placeholder="부모/배우자" style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>차량번호</div>
                <input value={tenantForm.carNumber} onChange={e => setTenantForm(p => ({ ...p, carNumber: e.target.value }))} placeholder="12가 3456" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>입금자명</div>
                <input value={tenantForm.paymentAlias} onChange={e => setTenantForm(p => ({ ...p, paymentAlias: e.target.value }))} placeholder="계약금 입금자명" style={inputStyle} />
              </div>
            </div>

            <button onClick={() => {
              if (!tenantForm.name || !tenantForm.phone || !tenantForm.ssn) { toast.error('이름, 연락처, 주민등록번호는 필수입니다.'); return; }
              setVerifyPhone(tenantForm.phone);
              setStep('verify');
            }}
              style={{ width: '100%', padding: '14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              다음 → 본인인증
            </button>
          </div>
        )}

        {/* SMS 인증 단계 */}
        {step === 'verify' && (
          <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '2px solid #F59E0B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#F59E0B', padding: '3px 10px', borderRadius: 20 }}>인증</span>
              <span style={{ fontSize: 16, fontWeight: 800 }}>본인 인증</span>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              {verifyPhone}으로 인증번호를 발송합니다.
            </div>

            {!sentCode ? (
              <button onClick={() => {
                const code = String(Math.floor(100000 + Math.random() * 900000));
                setSentCode(code);
                toast.info(`[테스트] 인증번호: ${code} — 실제 운영 시 SMS로 발송됩니다.`);
              }}
                style={{ width: '100%', padding: '14px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
                📩 인증번호 발송
              </button>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>인증번호 6자리</div>
                  <input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    style={{ ...inputStyle, fontSize: 24, fontWeight: 800, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'monospace' }} />
                </div>
                <button onClick={() => {
                  if (verifyCode === sentCode) {
                    setVerified(true);
                    try {
                      const contracts = JSON.parse(localStorage.getItem('hm_contracts') || '{}');
                      if (contracts[contractId!]) {
                        contracts[contractId!].tenantData = tenantForm;
                        contracts[contractId!].status = 'completed';
                        contracts[contractId!].verifiedAt = new Date().toISOString();
                        contracts[contractId!].verifiedPhone = verifyPhone;
                        localStorage.setItem('hm_contracts', JSON.stringify(contracts));
                      }
                    } catch { /* ignore */ }
                    setStep('done');
                  } else {
                    toast.error('인증번호가 일치하지 않습니다.');
                  }
                }}
                  style={{ width: '100%', padding: '14px', background: verifyCode.length === 6 ? '#059669' : '#D1D5DB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: verifyCode.length === 6 ? 'pointer' : 'default', fontFamily: 'inherit', marginBottom: 8 }}>
                  계약서 전송
                </button>
                <button onClick={() => { setSentCode(''); setVerifyCode(''); }}
                  style={{ width: '100%', padding: '10px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  인증번호 재발송
                </button>
              </>
            )}

            <button onClick={() => setStep('tenant')}
              style={{ width: '100%', padding: '10px', background: 'transparent', color: '#6B7280', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
              ← 이전으로
            </button>
          </div>
        )}

        {/* 하단 */}
        <div style={{ marginTop: 32, padding: '16px', fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
          HOUSEMAN 하우스맨<br />
          문의: 010-5560-8245
        </div>
      </div>
    </div>
  );
};
