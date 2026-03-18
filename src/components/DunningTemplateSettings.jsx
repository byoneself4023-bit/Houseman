import React, { useState, useEffect } from 'react';
import { Card } from './Card';

const LS_KEY = 'hm_dunningTemplates';

const DUNNING_TYPES = [
  { id: 'shortTerm', label: '단기', fixedStages: true },
  { id: 'regularRental', label: '일반임대', fixedStages: false },
  { id: 'commercial', label: '근생', fixedStages: false },
  { id: 'managementOffice', label: '관리사무소대행', fixedStages: false },
];

const DEFAULT_SHORT_TERM_STAGES = [
  { dayOffset: 0, time: '09:00', message: '[건물명] [호수] [임차인명]님, 월세일입니다. 오늘까지 납부 부탁드립니다.' },
  { dayOffset: 3, time: '09:00', message: '[건물명] [호수] [임차인명]님, 월세가 3일 연체중입니다. 빠른 납부 부탁드립니다.' },
  { dayOffset: 7, time: '09:00', message: '[건물명] [호수] [임차인명]님, 월세가 7일 연체중입니다. 연체수수료가 부과될 수 있습니다.' },
  { dayOffset: 14, time: '09:00', message: '[건물명] [호수] [임차인명]님, 월세가 14일 연체중입니다. 즉시 납부해주세요.' },
  { dayOffset: 30, time: '09:00', message: '[건물명] [호수] [임차인명]님, 월세가 30일 이상 연체중입니다. 법적 조치가 진행될 수 있습니다.' },
];

const getDefaultTemplates = () => ({
  shortTerm: DEFAULT_SHORT_TERM_STAGES.map(s => ({ ...s })),
  regularRental: [],
  commercial: [],
  managementOffice: [],
});

const loadTemplates = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all keys exist
      const defaults = getDefaultTemplates();
      return { ...defaults, ...parsed };
    }
  } catch { /* ignore */ }
  return getDefaultTemplates();
};

const saveTemplates = (data) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
};

export const DunningTemplateSettings = () => {
  const [activeTab, setActiveTab] = useState('shortTerm');
  const [templates, setTemplates] = useState(loadTemplates);
  const [saved, setSaved] = useState(false);

  const currentType = DUNNING_TYPES.find(t => t.id === activeTab);
  const stages = templates[activeTab] || [];

  const updateStage = (index, field, value) => {
    setTemplates(prev => {
      const next = { ...prev };
      const arr = [...(next[activeTab] || [])];
      arr[index] = { ...arr[index], [field]: field === 'dayOffset' ? (parseInt(value) || 0) : value };
      next[activeTab] = arr;
      return next;
    });
    setSaved(false);
  };

  const addStage = () => {
    setTemplates(prev => {
      const next = { ...prev };
      const arr = [...(next[activeTab] || [])];
      const lastDay = arr.length > 0 ? arr[arr.length - 1].dayOffset + 7 : 0;
      arr.push({ dayOffset: lastDay, time: '09:00', message: '[건물명] [호수] [임차인명]님, ' });
      next[activeTab] = arr;
      return next;
    });
    setSaved(false);
  };

  const removeStage = (index) => {
    setTemplates(prev => {
      const next = { ...prev };
      const arr = [...(next[activeTab] || [])];
      arr.splice(index, 1);
      next[activeTab] = arr;
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    saveTemplates(templates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (!confirm('기본 템플릿으로 초기화하시겠습니까?')) return;
    const defaults = getDefaultTemplates();
    setTemplates(defaults);
    saveTemplates(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {DUNNING_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveTab(type.id)}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: activeTab === type.id ? '2px solid #3B82F6' : '1.5px solid #E0E3E9',
              background: activeTab === type.id ? '#EFF6FF' : '#fff',
              color: activeTab === type.id ? '#2563EB' : '#5F6577',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {type.label}
            {(templates[type.id] || []).length > 0 && (
              <span style={{
                marginLeft: 6,
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
                background: activeTab === type.id ? '#3B82F6' : '#F3F4F6',
                color: activeTab === type.id ? '#fff' : '#8F95A3',
              }}>
                {(templates[type.id] || []).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Description */}
      <Card style={{ padding: '14px 18px', marginBottom: 12, background: '#F8FAFC', border: '1px solid #E8ECF0' }}>
        <div style={{ fontSize: 12, color: '#5F6577', lineHeight: 1.6 }}>
          {currentType?.fixedStages ? (
            <>
              <span style={{ fontWeight: 700, color: '#1A1D23' }}>단기</span> — 모든 단기 호실에 동일하게 적용되는 5단계 독촉 메시지입니다.
              단계 수는 고정이며, 내용과 발송 시간을 수정할 수 있습니다.
            </>
          ) : (
            <>
              <span style={{ fontWeight: 700, color: '#1A1D23' }}>{currentType?.label}</span> — 단계를 자유롭게 추가/삭제할 수 있습니다.
              모든 {currentType?.label} 호실에 동일한 메시지가 적용됩니다.
            </>
          )}
        </div>
      </Card>

      {/* Stages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.length === 0 && (
          <Card style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8F95A3', marginBottom: 12 }}>등록된 독촉 단계가 없습니다</div>
            <button
              onClick={addStage}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1.5px solid #3B82F6',
                background: '#EFF6FF',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + 첫 번째 단계 추가
            </button>
          </Card>
        )}

        {stages.map((stage, idx) => (
          <Card key={idx} style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1D23' }}>
                  {idx + 1}단계
                </span>
              </div>
              {!currentType?.fixedStages && (
                <button
                  onClick={() => removeStage(idx)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  삭제
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
              {/* Day offset */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8F95A3' }}>납부일 기준 (일)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#5F6577' }}>+</span>
                  <input
                    type="number"
                    min="0"
                    value={stage.dayOffset}
                    onChange={e => updateStage(idx, 'dayOffset', e.target.value)}
                    style={{
                      width: 70,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1.5px solid #E0E3E9',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3B82F6'}
                    onBlur={e => e.target.style.borderColor = '#E0E3E9'}
                  />
                  <span style={{ fontSize: 12, color: '#8F95A3' }}>일</span>
                </div>
              </div>

              {/* Send time */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8F95A3' }}>발송 시간</label>
                <input
                  type="time"
                  value={stage.time}
                  onChange={e => updateStage(idx, 'time', e.target.value)}
                  style={{
                    width: 120,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #E0E3E9',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = '#E0E3E9'}
                />
              </div>

              {/* Summary badge */}
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#F3F4F6',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#5F6577',
                }}>
                  납부일 +{stage.dayOffset}일 {stage.time} 발송
                </span>
              </div>
            </div>

            {/* Message textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8F95A3' }}>문자 내용</label>
              <textarea
                value={stage.message}
                onChange={e => updateStage(idx, 'message', e.target.value)}
                placeholder="독촉 문자 내용을 입력하세요. [건물명]은 실제 건물명으로 자동 치환됩니다."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #E0E3E9',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  background: '#FAFBFC',
                }}
                onFocus={e => e.target.style.borderColor = '#3B82F6'}
                onBlur={e => e.target.style.borderColor = '#E0E3E9'}
              />
              <div style={{ fontSize: 10, color: '#B0B5C1' }}>
                치환 변수: [건물명], [호수], [임차인명], [월세], [연체일수]
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {!currentType?.fixedStages && stages.length > 0 && (
          <button
            onClick={addStage}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1.5px dashed #BFDBFE',
              background: '#F8FAFC',
              color: '#3B82F6',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            + 단계 추가
          </button>
        )}
        <button
          onClick={handleSave}
          style={{
            padding: '10px 28px',
            borderRadius: 10,
            border: 'none',
            background: saved ? '#059669' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '저장 완료' : '저장'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1.5px solid #E0E3E9',
            background: '#fff',
            color: '#8F95A3',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          기본값 초기화
        </button>
      </div>
    </div>
  );
};
