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
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E5E5', padding: 32, maxWidth: 700 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>
          청구 초기설정
        </h2>
        <p style={{ fontSize: 13, color: '#888', margin: '6px 0 0' }}>
          {buildingName} — {buildingType === 'short' ? '단기' : buildingType === 'variable' ? '변동관리비' : '고정관리비'}
        </p>
      </div>

      {/* 스텝 인디케이터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: s <= step ? '#346aff' : '#E5E5E5',
            transition: 'background 0.3s',
          }} />
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
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>단기 청구 설정</h3>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
            단기 건물은 전기/가스 엑셀 업로드로 자동 매칭됩니다.
            초기 검침 데이터는 엑셀 업로드 시 자동으로 설정됩니다.
          </p>
        </div>
      )}

      {/* Step 2 (variable): 케이스 선택 */}
      {step === 2 && buildingType === 'variable' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>청구 케이스 선택</h3>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
            이 건물의 기본 청구 발송 방식을 선택하세요 (임차인별로 변경 가능)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CASE_OPTIONS.map(opt => (
              <div
                key={opt.value}
                onClick={() => setSelectedCase(opt.value)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: selectedCase === opt.value ? '2px solid #346aff' : '1px solid #E5E5E5',
                  background: selectedCase === opt.value ? '#EBF0FF' : '#fff',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: selectedCase === opt.value ? '#346aff' : '#F7F8FA',
                  color: selectedCase === opt.value ? '#fff' : '#888',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800,
                }}>
                  {opt.value}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selectedCase === opt.value ? '#346aff' : '#111' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{opt.desc}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: opt.msgs === 1 ? '#ECFDF5' : '#FFF7ED', color: opt.msgs === 1 ? '#059669' : '#EA580C' }}>
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
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>설정 확인</h3>
          <div style={{ background: '#F7F8FA', borderRadius: 8, padding: 16, fontSize: 12, color: '#333', lineHeight: 2 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
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

  const cardStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '12px 14px', borderRadius: 10, cursor: isSelected ? 'default' : 'pointer',
    border: isSelected ? '2px solid #346aff' : '1px solid #E5E5E5',
    background: isSelected ? '#EBF0FF' : '#fff',
    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none',
  });

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>변동관리비 항목 구성</h3>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>왼쪽에서 클릭으로 추가, 오른쪽에서 화살표로 순서 변경</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8 }}>사용 가능</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {available.length === 0 && <div style={{ fontSize: 12, color: '#ccc', padding: 20, textAlign: 'center', border: '1px dashed #E5E5E5', borderRadius: 10 }}>모두 선택됨</div>}
            {available.map(opt => (
              <div key={opt.type} style={cardStyle(false)} onClick={() => setSelectedComponents(p => [...p, opt.type])}>
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div><div style={{ fontSize: 10, color: '#888' }}>{opt.desc}</div></div>
                <span style={{ fontSize: 16, color: '#346aff', fontWeight: 800 }}>+</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#346aff', marginBottom: 8 }}>적용 항목 ({selectedComponents.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120, padding: selectedComponents.length === 0 ? 20 : 0, border: selectedComponents.length === 0 ? '2px dashed #D1D5DB' : 'none', borderRadius: 10, textAlign: 'center' }}>
            {selectedComponents.length === 0 && <div style={{ fontSize: 12, color: '#ccc' }}>왼쪽에서 클릭하세요</div>}
            {selectedComponents.map((type, index) => {
              const opt = VARIABLE_FEE_OPTIONS.find(o => o.type === type);
              return opt ? (
                <div key={type} style={cardStyle(true)}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      style={{
                        background: 'none', border: 'none', fontSize: 10, color: index === 0 ? '#ccc' : '#888',
                        cursor: index === 0 ? 'default' : 'pointer', padding: 0, lineHeight: 1,
                      }}
                    >▲</button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === selectedComponents.length - 1}
                      style={{
                        background: 'none', border: 'none', fontSize: 10,
                        color: index === selectedComponents.length - 1 ? '#ccc' : '#888',
                        cursor: index === selectedComponents.length - 1 ? 'default' : 'pointer', padding: 0, lineHeight: 1,
                      }}
                    >▼</button>
                  </div>
                  <span style={{ fontSize: 18 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#346aff' }}>{opt.label}</div></div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedComponents(p => p.filter(t => t !== type)); }}
                    style={{ background: 'none', border: 'none', fontSize: 14, color: '#E52528', cursor: 'pointer' }}>✕</button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 8 }}>직접 추가</div>
        {customItems.map((item: any, idx: number) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={item.label} onChange={e => updateCustomItem(idx, 'label', e.target.value)} placeholder="항목명"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #CCCCCC', fontSize: 12, fontFamily: 'inherit' }} />
            <button onClick={() => removeCustomItem(idx)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E5E5', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#E52528' }}>✕</button>
          </div>
        ))}
        <button onClick={addCustomItem} style={{ padding: '8px 14px', borderRadius: 6, border: '1px dashed #D1D5DB', background: '#FAFBFC', fontSize: 12, fontWeight: 600, color: '#666', cursor: 'pointer', width: '100%' }}>+ 항목 직접 추가</button>
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
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>연체수수료 설정</h3>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>기본값은 꺼짐입니다. 필요시 활성화하세요.</p>

      <div
        onClick={() => setEnabled(!enabled)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10,
          border: enabled ? '2px solid #346aff' : '1px solid #E5E5E5',
          background: enabled ? '#EBF0FF' : '#fff', cursor: 'pointer', marginBottom: 16,
        }}
      >
        <div style={{
          width: 40, height: 22, borderRadius: 11, padding: 2,
          background: enabled ? '#346aff' : '#D1D5DB', transition: 'background 0.2s',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 9, background: '#fff',
            transform: enabled ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 0.2s',
          }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: enabled ? '#346aff' : '#666' }}>
          연체수수료 {enabled ? '활성' : '비활성'}
        </span>
      </div>

      {enabled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#888' }}>수수료율 (%)</span>
            <input
              type="number" value={rate} onChange={e => setRate(Number(e.target.value) || 0)}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #CCCCCC', fontSize: 13, fontFamily: 'inherit' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#888' }}>적용 기준</span>
            <select
              value={type} onChange={e => setType(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #CCCCCC', fontSize: 13, fontFamily: 'inherit' }}
            >
              <option value="days">며칠 후</option>
              <option value="months">개월 후</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#888' }}>{type === 'days' ? '일수' : '개월수'}</span>
            <input
              type="number" value={value} onChange={e => setValue(Number(e.target.value) || 0)}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #CCCCCC', fontSize: 13, fontFamily: 'inherit' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
