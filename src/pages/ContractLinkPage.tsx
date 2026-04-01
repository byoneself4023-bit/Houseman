/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useIsMobile } from '@/utils/useIsMobile';
import { toast } from 'sonner';

const fmt = (n: any) => n ? Number(n).toLocaleString() : '0';
const inputCls = 'w-full px-3 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm font-[inherit] bg-white outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors';

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
      <div className="min-h-screen flex items-center justify-center bg-hm-bg-hover font-['Pretendard',-apple-system,sans-serif]">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">📋</div>
          <div className="text-lg font-bold text-gray-900 mb-2">계약서를 찾을 수 없습니다</div>
          <div className="text-sm text-gray-500">링크가 만료되었거나 잘못된 주소입니다.</div>
        </div>
      </div>
    );
  }

  const depositLabel = contract.type === '단기' ? '예치금' : '보증금';

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 font-['Pretendard',-apple-system,sans-serif]">
        <div className="text-center p-8 max-w-[400px]">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-xl font-bold text-hm-success mb-2">계약서 전송 완료</div>
          <div className="text-sm text-gray-500 leading-relaxed mb-6">
            {contract.building} {contract.room}호 계약 정보가 전송되었습니다.<br />
            HOUSEMAN에서 확인 후 안내드리겠습니다.
          </div>
          <div className="p-4 bg-white rounded-xl border border-hm-success-border text-left">
            <div className="text-xs font-bold text-hm-success mb-2">전송된 정보</div>
            <div className="text-sm text-gray-700 leading-[1.8]">
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
    <div className="min-h-screen bg-hm-bg-hover font-['Pretendard',-apple-system,sans-serif]">
      {/* 헤더 */}
      <div className="bg-gray-900 text-white px-5 py-4">
        <div className="max-w-[520px] mx-auto">
          <div className="text-xs font-semibold text-white/50 mb-1">HOUSEMAN</div>
          <div className="text-lg font-bold">{contract.building} {contract.room}호 계약서</div>
          <div className="text-xs text-white/60 mt-1">{contract.type} · 입주일 {contract.moveIn}</div>
        </div>
      </div>

      <div className={`max-w-[520px] mx-auto ${isMobile ? 'px-4 py-5' : 'px-4 py-8'}`}>
        {/* 계약 정보 요약 */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 mb-5">
          <div className="text-sm font-bold text-gray-900 mb-3">계약 정보</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">{depositLabel}</div><div className="font-bold">{fmt(contract.deposit)}만원</div>
            <div className="text-gray-500">월세</div><div className="font-bold text-[#c41230]">{fmt(contract.rent)}만원</div>
            {contract.mgmt > 0 && <><div className="text-gray-500">관리비</div><div className="font-bold">{fmt(contract.mgmt)}만원</div></>}
            <div className="text-gray-500">입주일</div><div className="font-bold">{contract.moveIn}</div>
            {contract.expiry && <><div className="text-gray-500">만기일</div><div className="font-bold">{contract.expiry}</div></>}
          </div>
        </div>

        {/* 특약사항 */}
        {contract.specialTerms && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-5">
            <div className="text-sm font-bold text-amber-800 mb-2">계약 특약사항</div>
            <div className="text-xs text-amber-900 leading-[1.8] whitespace-pre-wrap">{contract.specialTerms}</div>
          </div>
        )}

        {/* 부동산 입력 단계 */}
        {step === 'broker' && (
          <div className="p-5 bg-white rounded-xl border-2 border-hm-blue">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-white bg-hm-blue px-2.5 py-[3px] rounded-full">STEP 1</span>
              <span className="text-base font-bold">부동산 정보 입력</span>
            </div>
            <div className="text-xs text-gray-500 mb-4">부동산에서 작성할 부분입니다. 완료 후 임차인에게 링크를 전달해주세요.</div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-700 mb-1">부동산명 *</div>
              <input value={brokerForm.name} onChange={e => setBrokerForm(p => ({ ...p, name: e.target.value }))}
                placeholder={contract.broker || '부동산명'} className={inputCls} />
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-700 mb-1">연락처 *</div>
              <input value={brokerForm.phone} onChange={e => setBrokerForm(p => ({ ...p, phone: e.target.value }))}
                placeholder={contract.brokerPhone || '010-0000-0000'} className={inputCls} />
            </div>
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-700 mb-1">메모 (선택)</div>
              <textarea value={brokerForm.memo} onChange={e => setBrokerForm(p => ({ ...p, memo: e.target.value }))}
                placeholder="특이사항이 있으면 입력해주세요" rows={2}
                className={`${inputCls} resize-y min-h-[50px]`} />
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
              className="w-full py-3.5 bg-hm-blue text-white border-none rounded-[10px] text-base font-bold cursor-pointer font-[inherit] hover:bg-blue-600 transition-colors">
              완료 → 임차인에게 전달하기
            </button>
            <div className="text-xs text-gray-400 text-center mt-2">완료 후 이 화면을 임차인에게 보여주시면 됩니다</div>
          </div>
        )}

        {/* 임차인 입력 단계 */}
        {step === 'tenant' && (
          <div className="p-5 bg-white rounded-xl border-2 border-hm-success">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-white bg-hm-success px-2.5 py-[3px] rounded-full">STEP 2</span>
              <span className="text-base font-bold">임차인 정보 입력</span>
            </div>
            <div className="text-xs mb-4 px-3 py-2 bg-hm-success-bg rounded-md font-semibold text-hm-success">
              임차인분께서 직접 입력해주세요
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div>
                <div className="text-xs font-semibold text-hm-danger mb-[3px]">이름 *</div>
                <input value={tenantForm.name} onChange={e => setTenantForm(p => ({ ...p, name: e.target.value }))} placeholder="이름" className={inputCls} />
              </div>
              <div>
                <div className="text-xs font-semibold text-hm-danger mb-[3px]">연락처 *</div>
                <input value={tenantForm.phone} onChange={e => setTenantForm(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div>
                <div className="text-xs font-semibold text-hm-danger mb-[3px]">주민등록번호 *</div>
                <input value={tenantForm.ssn} onChange={e => setTenantForm(p => ({ ...p, ssn: e.target.value }))} placeholder="000000-0000000" className={`${inputCls} font-mono`} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-[3px]">이메일</div>
                <input value={tenantForm.email} onChange={e => setTenantForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className={inputCls} />
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-700 mb-[3px]">주소</div>
              <input value={tenantForm.address} onChange={e => setTenantForm(p => ({ ...p, address: e.target.value }))} placeholder="현재 거주지 주소" className={inputCls} />
            </div>

            <div className="text-xs font-bold text-gray-700 mb-2 mt-4 pt-3 border-t border-gray-200">비상연락처</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">이름</div>
                <input value={tenantForm.emergencyName} onChange={e => setTenantForm(p => ({ ...p, emergencyName: e.target.value }))} placeholder="이름" className={`${inputCls} py-2 text-sm`} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">연락처</div>
                <input value={tenantForm.emergencyPhone} onChange={e => setTenantForm(p => ({ ...p, emergencyPhone: e.target.value }))} placeholder="010-0000-0000" className={`${inputCls} py-2 text-sm`} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">관계</div>
                <input value={tenantForm.emergencyRelation} onChange={e => setTenantForm(p => ({ ...p, emergencyRelation: e.target.value }))} placeholder="부모/배우자" className={`${inputCls} py-2 text-sm`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-[3px]">차량번호</div>
                <input value={tenantForm.carNumber} onChange={e => setTenantForm(p => ({ ...p, carNumber: e.target.value }))} placeholder="12가 3456" className={inputCls} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-[3px]">입금자명</div>
                <input value={tenantForm.paymentAlias} onChange={e => setTenantForm(p => ({ ...p, paymentAlias: e.target.value }))} placeholder="계약금 입금자명" className={inputCls} />
              </div>
            </div>

            <button onClick={() => {
              if (!tenantForm.name || !tenantForm.phone || !tenantForm.ssn) { toast.error('이름, 연락처, 주민등록번호는 필수입니다.'); return; }
              setVerifyPhone(tenantForm.phone);
              setStep('verify');
            }}
              className="w-full py-3.5 bg-hm-success text-white border-none rounded-[10px] text-base font-bold cursor-pointer font-[inherit] hover:bg-emerald-700 transition-colors">
              다음 → 본인인증
            </button>
          </div>
        )}

        {/* SMS 인증 단계 */}
        {step === 'verify' && (
          <div className="p-5 bg-white rounded-xl border-2 border-amber-400">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-white bg-amber-400 px-2.5 py-[3px] rounded-full">인증</span>
              <span className="text-base font-bold">본인 인증</span>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {verifyPhone}으로 인증번호를 발송합니다.
            </div>

            {!sentCode ? (
              <button onClick={() => {
                const code = String(Math.floor(100000 + Math.random() * 900000));
                setSentCode(code);
                toast.info(`[테스트] 인증번호: ${code} — 실제 운영 시 SMS로 발송됩니다.`);
              }}
                className="w-full py-3.5 bg-amber-400 text-white border-none rounded-[10px] text-base font-bold cursor-pointer font-[inherit] mb-3 hover:bg-amber-500 transition-colors">
                📩 인증번호 발송
              </button>
            ) : (
              <>
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">인증번호 6자리</div>
                  <input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className={`${inputCls} text-2xl font-bold text-center tracking-[0.3em] font-mono`} />
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
                  className={`w-full py-3.5 text-white border-none rounded-[10px] text-base font-bold font-[inherit] mb-2 transition-colors ${verifyCode.length === 6 ? 'bg-hm-success cursor-pointer hover:bg-emerald-700' : 'bg-gray-300 cursor-default'}`}>
                  계약서 전송
                </button>
                <button onClick={() => { setSentCode(''); setVerifyCode(''); }}
                  className="w-full py-2.5 bg-gray-100 text-gray-500 border-none rounded-lg text-xs font-semibold cursor-pointer font-[inherit] hover:bg-gray-200 transition-colors">
                  인증번호 재발송
                </button>
              </>
            )}

            <button onClick={() => setStep('tenant')}
              className="w-full py-2.5 bg-transparent text-gray-500 border-none text-xs font-semibold cursor-pointer font-[inherit] mt-2 hover:text-gray-700 transition-colors">
              ← 이전으로
            </button>
          </div>
        )}

        {/* 하단 */}
        <div className="mt-8 p-4 text-xs text-gray-400 text-center leading-relaxed">
          HOUSEMAN 하우스맨<br />
          문의: 010-5560-8245
        </div>
      </div>
    </div>
  );
};
