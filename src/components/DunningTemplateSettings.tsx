import React, { useState } from 'react';
import { Card } from './Card';

const LS_KEY = 'hm_dunningTemplates';

interface DunningType {
  id: string;
  label: string;
  fixedStages: boolean;
}

interface DunningStage {
  dayOffset: number;
  time: string;
  message: string;
}

type TemplateData = Record<string, DunningStage[]>;

const DUNNING_TYPES: DunningType[] = [
  { id: 'shortTerm', label: '단기', fixedStages: true },
  { id: 'regularRental', label: '일반임대', fixedStages: false },
  { id: 'commercial', label: '근생', fixedStages: false },
  { id: 'managementOffice', label: '관리사무소대행', fixedStages: false },
];

const DEFAULT_SHORT_TERM_STAGES: DunningStage[] = [
  {
    dayOffset: 0,
    time: '09:00',
    message: '[건물명] [호수] [임차인명]님, 월세일입니다. 오늘까지 납부 부탁드립니다.',
  },
  {
    dayOffset: 3,
    time: '09:00',
    message: '[건물명] [호수] [임차인명]님, 월세가 3일 연체중입니다. 빠른 납부 부탁드립니다.',
  },
  {
    dayOffset: 7,
    time: '09:00',
    message:
      '[건물명] [호수] [임차인명]님, 월세가 7일 연체중입니다. 연체수수료가 부과될 수 있습니다.',
  },
  {
    dayOffset: 14,
    time: '09:00',
    message: '[건물명] [호수] [임차인명]님, 월세가 14일 연체중입니다. 즉시 납부해주세요.',
  },
  {
    dayOffset: 30,
    time: '09:00',
    message:
      '[건물명] [호수] [임차인명]님, 월세가 30일 이상 연체중입니다. 법적 조치가 진행될 수 있습니다.',
  },
];

const getDefaultTemplates = (): TemplateData => ({
  shortTerm: DEFAULT_SHORT_TERM_STAGES.map((s) => ({ ...s })),
  regularRental: [],
  commercial: [],
  managementOffice: [],
});

const loadTemplates = (): TemplateData => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = getDefaultTemplates();
      return { ...defaults, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return getDefaultTemplates();
};

const saveTemplates = (data: TemplateData): void => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
};

export const DunningTemplateSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('shortTerm');
  const [templates, setTemplates] = useState<TemplateData>(loadTemplates);
  const [saved, setSaved] = useState<boolean>(false);

  const currentType = DUNNING_TYPES.find((t) => t.id === activeTab);
  const stages = templates[activeTab] || [];

  const updateStage = (index: number, field: keyof DunningStage, value: string): void => {
    setTemplates((prev) => {
      const next = { ...prev };
      const arr = [...(next[activeTab] || [])];
      arr[index] = { ...arr[index], [field]: field === 'dayOffset' ? parseInt(value) || 0 : value };
      next[activeTab] = arr;
      return next;
    });
    setSaved(false);
  };

  const addStage = (): void => {
    setTemplates((prev) => {
      const next = { ...prev };
      const arr = [...(next[activeTab] || [])];
      const lastDay = arr.length > 0 ? arr[arr.length - 1].dayOffset + 7 : 0;
      arr.push({ dayOffset: lastDay, time: '09:00', message: '[건물명] [호수] [임차인명]님, ' });
      next[activeTab] = arr;
      return next;
    });
    setSaved(false);
  };

  const removeStage = (index: number): void => {
    setTemplates((prev) => {
      const next = { ...prev };
      const arr = [...(next[activeTab] || [])];
      arr.splice(index, 1);
      next[activeTab] = arr;
      return next;
    });
    setSaved(false);
  };

  const handleSave = (): void => {
    saveTemplates(templates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = (): void => {
    if (!confirm('기본 템플릿으로 초기화하시겠습니까?')) return;
    const defaults = getDefaultTemplates();
    setTemplates(defaults);
    saveTemplates(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-4">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {DUNNING_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveTab(type.id)}
            className={`px-5 py-2.5 rounded-[10px] font-bold text-[13px] cursor-pointer font-[inherit] transition-all duration-150 ${
              activeTab === type.id
                ? 'border-2 border-hm-blue bg-hm-blue-bg text-hm-blue-dark'
                : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub hover:border-hm-blue/40'
            }`}
          >
            {type.label}
            {(templates[type.id] || []).length > 0 && (
              <span
                className={`ml-1.5 px-[7px] py-px rounded-[10px] text-[11px] font-extrabold ${
                  activeTab === type.id
                    ? 'bg-hm-blue text-white'
                    : 'bg-[#F3F4F6] text-hm-text-muted'
                }`}
              >
                {(templates[type.id] || []).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Description */}
      <Card className="px-[18px] py-3.5 mb-3 bg-[#F8FAFC] border border-hm-border">
        <div className="text-xs text-hm-text-sub leading-relaxed">
          {currentType?.fixedStages ? (
            <>
              <span className="font-bold text-hm-text">단기</span> — 모든 단기 호실에
              동일하게 적용되는 5단계 독촉 메시지입니다. 단계 수는 고정이며, 내용과 발송 시간을
              수정할 수 있습니다.
            </>
          ) : (
            <>
              <span className="font-bold text-hm-text">{currentType?.label}</span> —
              단계를 자유롭게 추가/삭제할 수 있습니다. 모든 {currentType?.label} 호실에 동일한
              메시지가 적용됩니다.
            </>
          )}
        </div>
      </Card>

      {/* Stages */}
      <div className="flex flex-col gap-2.5">
        {stages.length === 0 && (
          <Card className="px-5 py-10 text-center">
            <div className="text-[13px] text-hm-text-muted mb-3">
              등록된 독촉 단계가 없습니다
            </div>
            <button
              onClick={addStage}
              className="px-6 py-2.5 rounded-lg border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark font-bold text-[13px] cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors"
            >
              + 첫 번째 단계 추가
            </button>
          </Card>
        )}

        {stages.map((stage, idx) => (
          <Card key={idx} className="px-[18px] py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg bg-gradient-to-br from-hm-blue to-hm-blue-dark text-white flex items-center justify-center text-xs font-extrabold"
                >
                  {idx + 1}
                </div>
                <span className="text-[13px] font-bold text-hm-text">
                  {idx + 1}단계
                </span>
              </div>
              {!currentType?.fixedStages && (
                <button
                  onClick={() => removeStage(idx)}
                  className="px-2.5 py-1 rounded-md border border-red-200 bg-hm-danger-bg text-hm-danger text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="flex gap-3 mb-2.5 flex-wrap">
              {/* Day offset */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-hm-text-muted">
                  납부일 기준 (일)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-bold text-hm-text-sub">+</span>
                  <input
                    type="number"
                    min="0"
                    value={stage.dayOffset}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateStage(idx, 'dayOffset', e.target.value)
                    }
                    className="w-[70px] px-2.5 py-2 rounded-lg border-[1.5px] border-hm-input-border text-[13px] font-semibold font-[inherit] outline-none text-center focus:border-hm-blue focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  />
                  <span className="text-xs text-hm-text-muted">일</span>
                </div>
              </div>

              {/* Send time */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-hm-text-muted">발송 시간</label>
                <input
                  type="time"
                  value={stage.time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateStage(idx, 'time', e.target.value)
                  }
                  className="w-[120px] px-2.5 py-2 rounded-lg border-[1.5px] border-hm-input-border text-[13px] font-semibold font-[inherit] outline-none focus:border-hm-blue focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                />
              </div>

              {/* Summary badge */}
              <div className="flex items-end pb-0.5">
                <span className="px-3 py-1.5 rounded-lg bg-hm-bg text-[11px] font-semibold text-hm-text-sub">
                  납부일 +{stage.dayOffset}일 {stage.time} 발송
                </span>
              </div>
            </div>

            {/* Message textarea */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-hm-text-muted">문자 내용</label>
              <textarea
                value={stage.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateStage(idx, 'message', e.target.value)
                }
                placeholder="독촉 문자 내용을 입력하세요. [건물명]은 실제 건물명으로 자동 치환됩니다."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-hm-input-border text-[13px] font-[inherit] outline-none resize-y leading-relaxed bg-[#FAFBFC] focus:border-hm-blue focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
              />
              <div className="text-[10px] text-[#B0B5C1]">
                치환 변수: [건물명], [호수], [임차인명], [월세], [연체일수]
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 items-center flex-wrap">
        {!currentType?.fixedStages && stages.length > 0 && (
          <button
            onClick={addStage}
            className="px-5 py-2.5 rounded-[10px] border-[1.5px] border-dashed border-blue-200 bg-[#F8FAFC] text-hm-blue font-bold text-[13px] cursor-pointer font-[inherit] transition-all duration-150 hover:border-hm-blue hover:bg-hm-blue-bg"
          >
            + 단계 추가
          </button>
        )}
        <button
          onClick={handleSave}
          className={`px-7 py-2.5 rounded-[10px] border-none text-white font-extrabold text-sm cursor-pointer font-[inherit] transition-all duration-200 ${
            saved
              ? 'bg-hm-success'
              : 'bg-gradient-to-br from-hm-blue to-hm-blue-dark hover:shadow-md'
          }`}
        >
          {saved ? '저장 완료' : '저장'}
        </button>
        <button
          onClick={handleReset}
          className="px-5 py-2.5 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-muted font-bold text-[13px] cursor-pointer font-[inherit] hover:border-hm-text-muted transition-colors"
        >
          기본값 초기화
        </button>
      </div>
    </div>
  );
};
