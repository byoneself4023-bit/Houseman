/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { getBillingInitialSetup, saveBillingInitialSetup } from '@/lib/billingEngine';
import { toast } from 'sonner';

const VARIABLE_FEE_OPTIONS = [
  { type: 'elec_apportion', label: '전기 안분', icon: '⚡', desc: '건물 일괄수전 → 호실별 사설계량기 검침 → 금액 안분' },
  { type: 'water_apportion', label: '수도 안분', icon: '💧', desc: '건물 공용계량기 → 호실별 사설계량기 검침 → 금액 안분' },
  { type: 'common_elec', label: '공용전기 안분', icon: '🏢', desc: '총사용량 - 호실합계 = 공용전기, 입주호실에만 배분' },
  { type: 'septic_incident', label: '정화조 (발생시)', icon: '🪣', desc: '정화조 요금 발생 시 해당 월에 청구' },
  { type: 'septic_monthly', label: '정화조 (1/12 분할)', icon: '📅', desc: '연간 정화조 요금을 12개월 분할 청구' },
];

const CASE_OPTIONS = [
  { value: 'A', label: '전부 합산 1통', desc: '월세+고정관리비+변동관리비 합산하여 1통 발송', msgs: 1 },
  { value: 'B2', label: '구분 표시 1통', desc: '항목을 구분하여 표시하되 1통으로 발송', msgs: 1 },
  { value: 'C', label: '변동관리비만 1통', desc: '월세+고정관리비는 보내지 않고 변동관리비만 발송', msgs: 1 },
  { value: 'E', label: '고정+변동 1통', desc: '월세는 보내지 않고 고정+변동관리비 합쳐서 발송', msgs: 1 },
  { value: 'B1', label: '월세 + 관리비 2통', desc: '월세 별도 1통 + 관리비(고정+변동) 별도 1통', msgs: 2 },
  { value: 'D', label: '월세+고정 + 변동 2통', desc: '월세+고정관리비 1통 + 변동관리비 1통', msgs: 2 },
];

interface BillingSetupWizardProps {
  buildingId: any;
  buildingName: string;
  buildingType: 'short' | 'fixed' | 'variable';
  onComplete?: (saved: any) => void;
  onCancel?: () => void;
}

/**
 * BillingSetupWizard -- 건물 첫 청구 시 초기설정
 */
export default function BillingSetupWizard({ buildingId, buildingName, buildingType, onComplete, onCancel }: BillingSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // 변동관리비 항목 선택
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  // 커스텀 항목
  const [customItems, setCustomItems] = useState<any[]>([]);
  // 케이스 선택
  const [selectedCase, setSelectedCase] = useState('A');
  // 연체수수료
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeeRate, setLateFeeRate] = useState(5);
  const [lateFeeType, setLateFeeType] = useState('days');
  const [lateFeeValue, setLateFeeValue] = useState(5);

  // 기존 설정 로드
  useEffect(() => {
    if (!buildingId) return;
    getBillingInitialSetup(buildingId).then(setup => {
      if (!setup) return;
      if (setup.variable_fee_components?.length > 0) {
        const standard = setup.variable_fee_components.filter((c: any) => !c.custom);
        const custom = setup.variable_fee_components.filter((c: any) => c.custom);
        setSelectedComponents(standard.map((c: any) => c.type));
        setCustomItems(custom);
      }
      if (setup.setup_completed) {
        // 이미 완료된 설정 — 수정 모드
      }
    });
  }, [buildingId]);

  const totalSteps = buildingType === 'variable' ? 4 : buildingType === 'short' ? 3 : 2;

  // 커스텀 항목 추가
  const addCustomItem = () => {
    setCustomItems(prev => [...prev, { type: `custom_${Date.now()}`, label: '', desc: '', custom: true }]);
  };

  const updateCustomItem = (idx: number, field: string, value: string) => {
    setCustomItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeCustomItem = (idx: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== idx));
  };

  // 저장
  const handleComplete = useCallback(async () => {
    setSaving(true);
    const components = [
      ...selectedComponents.map(type => {
        const opt = VARIABLE_FEE_OPTIONS.find(o => o.type === type);
        return { type, label: opt?.label || type, custom: false };
      }),
      ...customItems.filter(c => c.label.trim()),
    ];

    const setup = {
      building_id: buildingId,
      variable_fee_components: components,
      initial_meter_done: buildingType !== 'short', // 단기는 별도 입력 필요
      setup_completed: true,
      setup_completed_at: new Date().toISOString(),
      setup_completed_by: 'admin',
    };

    const saved = await saveBillingInitialSetup(setup);

    // TODO Phase 6: 연체수수료 → API mutation으로 전환
    // lateFeeEnabled, lateFeeRate, lateFeeType, lateFeeValue → PUT /api/buildings/{id}

    setSaving(false);

    if (saved) {
      if (onComplete) onComplete(saved);
    } else {
      toast.error('저장 실패');
    }
  }, [buildingId, buildingType, selectedComponents, customItems, onComplete, lateFeeEnabled, lateFeeRate, lateFeeType, lateFeeValue]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-8 max-w-[700px]">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-hm-text m-0">
          청구 초기설정
        </h2>
        <p className="text-sm text-hm-text-muted mt-1.5">
          {buildingName} — {buildingType === 'short' ? '단기' : buildingType === 'variable' ? '변동관리비' : '고정관리비'}
        </p>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex gap-2 mb-7">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div key={s} className={`flex-1 h-1 rounded-sm transition-colors duration-300 ${s <= step ? 'bg-[#346aff]' : 'bg-[#E5E5E5]'}`} />
        ))}
      </div>

      {/* Step 1: 변동관리비 항목 구성 — 리스트 with 순서 변경 */}
      {step === 1 && buildingType === 'variable' && (
        <VariableFeeBuilder
          selectedComponents={selectedComponents}
          setSelectedComponents={setSelectedComponents}
          customItems={customItems}
          addCustomItem={addCustomItem}
          updateCustomItem={updateCustomItem}
          removeCustomItem={removeCustomItem}
        />
      )}

      {/* Step 1 (고정관리비): 바로 연체수수료 */}
      {step === 1 && buildingType === 'fixed' && (
        <LateFeeStep
          enabled={lateFeeEnabled} setEnabled={setLateFeeEnabled}
          rate={lateFeeRate} setRate={setLateFeeRate}
          type={lateFeeType} setType={setLateFeeType}
          value={lateFeeValue} setValue={setLateFeeValue}
        />
      )}

      {/* Step 1 (단기): 안내 메시지 */}
      {step === 1 && buildingType === 'short' && (
        <div>
          <h3 className="text-base font-bold text-hm-text mb-1.5">단기 청구 설정</h3>
          <p className="text-xs text-hm-text-muted mb-5">
            단기 건물은 전기/가스 엑셀 업로드로 자동 매칭됩니다.
            초기 검침 데이터는 엑셀 업로드 시 자동으로 설정됩니다.
          </p>
        </div>
      )}

      {/* Step 2 (variable): 케이스 선택 */}
      {step === 2 && buildingType === 'variable' && (
        <div>
          <h3 className="text-base font-bold text-hm-text mb-1.5">청구 케이스 선택</h3>
          <p className="text-xs text-hm-text-muted mb-5">
            이 건물의 기본 청구 발송 방식을 선택하세요 (임차인별로 변경 가능)
          </p>
          <div className="flex flex-col gap-3">
            {CASE_OPTIONS.map(opt => (
              <div
                key={opt.value}
                onClick={() => setSelectedCase(opt.value)}
                className={`px-4 py-3.5 rounded-lg cursor-pointer flex items-center gap-3 transition-all duration-150 ${
                  selectedCase === opt.value
                    ? 'border-2 border-[#346aff] bg-[#EBF0FF]'
                    : 'border border-[#E5E5E5] bg-white hover:border-[#346aff]/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  selectedCase === opt.value
                    ? 'bg-[#346aff] text-white'
                    : 'bg-hm-bg text-hm-text-muted'
                }`}>
                  {opt.value}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-bold ${selectedCase === opt.value ? 'text-[#346aff]' : 'text-hm-text'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-hm-text-muted mt-0.5">{opt.desc}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  opt.msgs === 1 ? 'bg-hm-success-bg text-hm-success' : 'bg-hm-warning-bg text-hm-warning'
                }`}>
                  {opt.msgs}통
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 (short): 연체수수료 */}
      {step === 2 && buildingType === 'short' && (
        <LateFeeStep
          enabled={lateFeeEnabled} setEnabled={setLateFeeEnabled}
          rate={lateFeeRate} setRate={setLateFeeRate}
          type={lateFeeType} setType={setLateFeeType}
          value={lateFeeValue} setValue={setLateFeeValue}
        />
      )}

      {/* Step 3 (variable): 연체수수료 */}
      {step === 3 && buildingType === 'variable' && (
        <LateFeeStep
          enabled={lateFeeEnabled} setEnabled={setLateFeeEnabled}
          rate={lateFeeRate} setRate={setLateFeeRate}
          type={lateFeeType} setType={setLateFeeType}
          value={lateFeeValue} setValue={setLateFeeValue}
        />
      )}

      {/* Step 4 (variable) / Step 3 (short) / Step 2 (fixed): 완료 확인 */}
      {step === totalSteps && (
        <div>
          <h3 className="text-base font-bold text-hm-text mb-1.5">설정 확인</h3>
          <div className="bg-hm-bg rounded-lg p-4 text-xs text-[#333] leading-8">
            {buildingType === 'variable' && (
              <>
                <div><strong>변동관리비 항목:</strong> {selectedComponents.map(t => VARIABLE_FEE_OPTIONS.find(o => o.type === t)?.label).filter(Boolean).join(', ') || '없음'}</div>
                {customItems.filter(c => c.label).length > 0 && <div><strong>직접추가:</strong> {customItems.filter(c => c.label).map((c: any) => c.label).join(', ')}</div>}
                <div><strong>기본 케이스:</strong> {CASE_OPTIONS.find(c => c.value === selectedCase)?.label}</div>
              </>
            )}
            <div><strong>연체수수료:</strong> {lateFeeEnabled ? `${lateFeeRate}%, ${lateFeeType === 'days' ? `${lateFeeValue}일 후` : `${lateFeeValue}개월 후`} 적용` : '미적용'}</div>
          </div>
        </div>
      )}

      {/* 네비게이션 */}
      <div className="flex justify-between mt-7">
        <div>
          {step > 1 && (
            <button className="billing-btn ghost" onClick={() => setStep(s => s - 1)}>← 이전</button>
          )}
          {step === 1 && onCancel && (
            <button className="billing-btn ghost" onClick={onCancel}>취소</button>
          )}
        </div>
        <div>
          {step < totalSteps ? (
            <button className="billing-btn primary" onClick={() => setStep(s => s + 1)}>
              다음 →
            </button>
          ) : (
            <button className="billing-btn success" onClick={handleComplete} disabled={saving}>
              {saving ? '저장 중...' : '설정 완료'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VariableFeeBuilder -- 항목 구성 (up/down 버튼으로 순서 변경)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VariableFeeBuilderProps {
  selectedComponents: string[];
  setSelectedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  customItems: any[];
  addCustomItem: () => void;
  updateCustomItem: (idx: number, field: string, value: string) => void;
  removeCustomItem: (idx: number) => void;
}

function VariableFeeBuilder({ selectedComponents, setSelectedComponents, customItems, addCustomItem, updateCustomItem, removeCustomItem }: VariableFeeBuilderProps) {
  const available = VARIABLE_FEE_OPTIONS.filter(o => !selectedComponents.includes(o.type));

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setSelectedComponents(prev => {
      const arr = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  return (
    <div>
      <h3 className="text-base font-bold text-hm-text mb-1.5">변동관리비 항목 구성</h3>
      <p className="text-xs text-hm-text-muted mb-4">왼쪽에서 클릭으로 추가, 오른쪽에서 화살표로 순서 변경</p>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="text-xs font-bold text-hm-text-muted mb-2">사용 가능</div>
          <div className="flex flex-col gap-2">
            {available.length === 0 && <div className="text-xs text-[#ccc] p-5 text-center border border-dashed border-[#E5E5E5] rounded-lg">모두 선택됨</div>}
            {available.map(opt => (
              <div
                key={opt.type}
                onClick={() => setSelectedComponents(p => [...p, opt.type])}
                className="px-4 py-3 rounded-lg cursor-pointer border border-[#E5E5E5] bg-white transition-all duration-150 flex items-center gap-3 select-none hover:border-[#346aff]/40"
              >
                <span className="text-lg">{opt.icon}</span>
                <div className="flex-1"><div className="text-xs font-bold">{opt.label}</div><div className="text-xs text-hm-text-muted">{opt.desc}</div></div>
                <span className="text-base text-[#346aff] font-bold">+</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-[#346aff] mb-2">적용 항목 ({selectedComponents.length})</div>
          <div className={`flex flex-col gap-2 min-h-[120px] rounded-lg ${
            selectedComponents.length === 0 ? 'p-5 border-2 border-dashed border-gray-300 text-center' : ''
          }`}>
            {selectedComponents.length === 0 && <div className="text-xs text-[#ccc]">왼쪽에서 클릭하세요</div>}
            {selectedComponents.map((type, index) => {
              const opt = VARIABLE_FEE_OPTIONS.find(o => o.type === type);
              return opt ? (
                <div key={type} className="px-4 py-3 rounded-lg border-2 border-[#346aff] bg-[#EBF0FF] transition-all duration-150 flex items-center gap-3 select-none">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className={`bg-transparent border-none text-xs p-0 leading-none ${
                        index === 0 ? 'text-[#ccc] cursor-default' : 'text-hm-text-muted cursor-pointer hover:text-hm-text'
                      }`}
                    >▲</button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === selectedComponents.length - 1}
                      className={`bg-transparent border-none text-xs p-0 leading-none ${
                        index === selectedComponents.length - 1 ? 'text-[#ccc] cursor-default' : 'text-hm-text-muted cursor-pointer hover:text-hm-text'
                      }`}
                    >▼</button>
                  </div>
                  <span className="text-lg">{opt.icon}</span>
                  <div className="flex-1"><div className="text-xs font-bold text-[#346aff]">{opt.label}</div></div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedComponents(p => p.filter(t => t !== type)); }}
                    className="bg-transparent border-none text-sm text-hm-danger cursor-pointer hover:text-red-700 transition-colors">✕</button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-[#666] mb-2">직접 추가</div>
        {customItems.map((item: any, idx: number) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input value={item.label} onChange={e => updateCustomItem(idx, 'label', e.target.value)} placeholder="항목명"
              className="flex-1 px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] focus:ring-2 focus:ring-ring focus:ring-offset-1 outline-none transition-colors" />
            <button onClick={() => removeCustomItem(idx)} className="px-2.5 py-1.5 rounded-md border border-[#E5E5E5] bg-white text-xs cursor-pointer text-hm-danger hover:bg-hm-danger-bg transition-colors">✕</button>
          </div>
        ))}
        <button onClick={addCustomItem} className="px-4 py-2 rounded-md border border-dashed border-gray-300 bg-[#FAFBFC] text-xs font-semibold text-[#666] cursor-pointer w-full hover:border-[#346aff] hover:text-[#346aff] transition-colors">+ 항목 직접 추가</button>
      </div>
    </div>
  );
}

// ── 연체수수료 설정 서브 컴포넌트 ──
interface LateFeeStepProps {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  rate: number;
  setRate: (v: number) => void;
  type: string;
  setType: (v: string) => void;
  value: number;
  setValue: (v: number) => void;
}

function LateFeeStep({ enabled, setEnabled, rate, setRate, type, setType, value, setValue }: LateFeeStepProps) {
  return (
    <div>
      <h3 className="text-base font-bold text-hm-text mb-1.5">연체수수료 설정</h3>
      <p className="text-xs text-hm-text-muted mb-5">기본값은 꺼짐입니다. 필요시 활성화하세요.</p>

      <div
        onClick={() => setEnabled(!enabled)}
        className={`flex items-center gap-3 p-3.5 rounded-lg cursor-pointer mb-4 transition-all duration-150 ${
          enabled ? 'border-2 border-[#346aff] bg-[#EBF0FF]' : 'border border-[#E5E5E5] bg-white hover:border-[#346aff]/40'
        }`}
      >
        <div className={`w-10 h-[22px] rounded-full p-0.5 transition-colors duration-200 ${enabled ? 'bg-[#346aff]' : 'bg-gray-300'}`}>
          <div className={`w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
        </div>
        <span className={`text-sm font-bold ${enabled ? 'text-[#346aff]' : 'text-[#666]'}`}>
          연체수수료 {enabled ? '활성' : '비활성'}
        </span>
      </div>

      {enabled && (
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-hm-text-muted">수수료율 (%)</span>
            <input
              type="number" value={rate} onChange={e => setRate(Number(e.target.value) || 0)}
              className="px-2.5 py-2 rounded-md border border-[#CCCCCC] text-sm font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-hm-text-muted">적용 기준</span>
            <select
              value={type} onChange={e => setType(e.target.value)}
              className="px-2.5 py-2 rounded-md border border-[#CCCCCC] text-sm font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
            >
              <option value="days">며칠 후</option>
              <option value="months">개월 후</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-hm-text-muted">{type === 'days' ? '일수' : '개월수'}</span>
            <input
              type="number" value={value} onChange={e => setValue(Number(e.target.value) || 0)}
              className="px-2.5 py-2 rounded-md border border-[#CCCCCC] text-sm font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
            />
          </label>
        </div>
      )}
    </div>
  );
}
