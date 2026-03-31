// @ts-nocheck
import { useState, useCallback } from 'react';
import { Card, SectionTitle } from '../components';
import { inputClassName } from '../components/Field';
import { useLocalStorage } from '../utils/useLocalStorage';
import { useIsMobile } from '../utils/useIsMobile';

const BANK_LIST = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행",
  "기업은행", "SC제일은행", "씨티은행", "카카오뱅크", "토스뱅크",
  "케이뱅크", "새마을금고", "신협", "우체국", "수협은행",
  "대구은행", "부산은행", "경남은행", "광주은행", "전북은행", "제주은행"
];

const STATUS_OPTIONS = [
  { value: "active", label: "사용중", color: "#16A34A", bg: "#F0FDF4" },
  { value: "deprecating", label: "폐기예정", color: "#D97706", bg: "#FFFBEB" },
  { value: "inactive", label: "미사용", color: "#9CA3AF", bg: "#F3F4F6" },
];

const defaultSettings = {
  company_name: "",
  company_phone: "",
  company_email: "",
  company_address: "",
  houseman_bank_accounts: [],
};

const emptyAccount = { alias: "", account_number: "", bank: "국민은행", holder: "", status: "active", note: "", isPrimary: false };

export const CompanySettingsPage = () => {
  const isMobile = useIsMobile();
  const [settings, setSettings] = useLocalStorage("hm_companySettings", defaultSettings);
  const [saved, setSaved] = useState(false);

  const update = useCallback((field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }, [setSettings]);

  const accounts = settings.houseman_bank_accounts || [];

  const addAccount = () => {
    update("houseman_bank_accounts", [...accounts, { ...emptyAccount, id: Date.now() }]);
  };

  const removeAccount = (idx) => {
    update("houseman_bank_accounts", accounts.filter((_, i) => i !== idx));
  };

  const updateAccount = (idx, field, value) => {
    const updated = accounts.map((acc, i) => i === idx ? { ...acc, [field]: value } : acc);
    update("houseman_bank_accounts", updated);
  };

  const handleSave = () => {
    // Settings are already persisted via useLocalStorage on every change.
    // This button gives the user explicit confirmation.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openPostcodeSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      // Load Daum Postcode script dynamically
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => runPostcode();
      document.head.appendChild(script);
    } else {
      runPostcode();
    }
  };

  const runPostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.roadAddress || data.jibunAddress;
        update("company_address", addr);
      }
    }).open();
  };

  return (
    <div>
      <SectionTitle sub="하우스맨 회사 기본정보를 관리합니다">
        {"🏢 하우스맨 기본정보"}
      </SectionTitle>

      {/* Company Info */}
      <Card style={{ marginBottom: 20 }}>
        <div className="text-sm font-extrabold text-hm-text mb-4 flex items-center gap-2">
          <span className="text-base">{"📋"}</span> 회사 정보
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div>
            <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">회사명</div>
            <input
              value={settings.company_name || ""}
              onChange={e => update("company_name", e.target.value)}
              placeholder="예: (주)하우스맨"
              className={`${inputClassName} px-3.5 py-2.5`}
            />
          </div>
          <div>
            <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">대표 전화번호</div>
            <input
              value={settings.company_phone || ""}
              onChange={e => update("company_phone", e.target.value)}
              placeholder="예: 02-1234-5678"
              className={`${inputClassName} px-3.5 py-2.5`}
            />
          </div>
          <div>
            <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">대표 이메일</div>
            <input
              value={settings.company_email || ""}
              onChange={e => update("company_email", e.target.value)}
              placeholder="예: info@houseman.co.kr"
              className={`${inputClassName} px-3.5 py-2.5`}
            />
          </div>
          <div>
            <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">회사 주소</div>
            <div className="flex gap-2">
              <input
                value={settings.company_address || ""}
                onChange={e => update("company_address", e.target.value)}
                placeholder="주소를 입력하거나 검색하세요"
                className={`${inputClassName} px-3.5 py-2.5 flex-1`}
              />
              <button
                onClick={openPostcodeSearch}
                className="px-4 py-2.5 rounded-lg border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark font-bold text-xs cursor-pointer font-[inherit] whitespace-nowrap shrink-0 hover:bg-blue-100 transition-colors"
              >
                {"🔍"} 주소검색
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Bank Accounts */}
      <Card style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-extrabold text-hm-text flex items-center gap-2">
            <span className="text-base">{"🏦"}</span> 하우스맨 계좌 목록
            <span className="text-xs font-semibold text-hm-text-muted">({accounts.length}개)</span>
          </div>
          <button
            onClick={addAccount}
            className="px-5 py-2 rounded-lg border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark font-bold text-xs cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors"
          >
            + 계좌 추가
          </button>
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-8 text-hm-text-muted text-[13px]">
            등록된 계좌가 없습니다. 위의 &quot;계좌 추가&quot; 버튼을 눌러 추가하세요.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {accounts.map((acc, idx) => {
            const statusCfg = STATUS_OPTIONS.find(s => s.value === acc.status) || STATUS_OPTIONS[0];
            return (
              <div key={acc.id || idx} className="p-4 rounded-xl border border-hm-border bg-[#FAFBFC] relative">
                {/* Remove button */}
                <button
                  onClick={() => removeAccount(idx)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full border border-red-200 bg-hm-danger-bg text-hm-danger text-sm font-bold cursor-pointer flex items-center justify-center font-[inherit] leading-none hover:bg-red-100 transition-colors"
                  title="계좌 삭제"
                >
                  x
                </button>

                {/* 대표계좌 표시 */}
                {acc.isPrimary && (
                  <div className="mb-2">
                    <span className="text-[10px] font-extrabold text-hm-blue-dark bg-hm-blue-bg px-2 py-0.5 rounded border border-blue-200">★ 대표계좌</span>
                  </div>
                )}

                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} gap-3 mb-3`}>
                  <div>
                    <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">별칭 (용도)</div>
                    <input
                      value={acc.alias || ""}
                      onChange={e => updateAccount(idx, "alias", e.target.value)}
                      placeholder="예: 관리비통장, 월세통장"
                      className={`${inputClassName} px-3 py-[9px]`}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">은행명</div>
                    <select
                      value={acc.bank || "국민은행"}
                      onChange={e => updateAccount(idx, "bank", e.target.value)}
                      className={`${inputClassName} px-3 py-[9px] cursor-pointer`}
                    >
                      {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">계좌번호</div>
                    <input
                      value={acc.account_number || ""}
                      onChange={e => updateAccount(idx, "account_number", e.target.value)}
                      placeholder="예: 123-456-789012"
                      className={`${inputClassName} px-3 py-[9px]`}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">예금주</div>
                    <input
                      value={acc.holder || ""}
                      onChange={e => updateAccount(idx, "holder", e.target.value)}
                      placeholder="예: 박종호"
                      className={`${inputClassName} px-3 py-[9px]`}
                    />
                  </div>
                </div>

                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[auto_1fr_2fr]'} gap-3`}>
                  <div>
                    <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">대표계좌</div>
                    <button
                      onClick={() => {
                        if (acc.isPrimary) return;
                        const updated = accounts.map((a, i) => ({ ...a, isPrimary: i === idx }));
                        update("houseman_bank_accounts", updated);
                      }}
                      className="font-[inherit] transition-colors"
                      style={{
                        padding: "7px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                        border: acc.isPrimary ? "1.5px solid #2563EB" : "1px solid #E0E3E9",
                        background: acc.isPrimary ? "#EFF6FF" : "#fff",
                        color: acc.isPrimary ? "#2563EB" : "#8F95A3",
                        cursor: acc.isPrimary ? "default" : "pointer",
                      }}
                    >
                      {acc.isPrimary ? "★ 대표" : "대표로 설정"}
                    </button>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">상태</div>
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map(opt => {
                        const selected = acc.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => updateAccount(idx, "status", opt.value)}
                            className="flex-1 font-[inherit] cursor-pointer transition-colors"
                            style={{
                              padding: "7px 8px", borderRadius: 7, fontSize: 11, fontWeight: selected ? 700 : 500,
                              border: selected ? `1.5px solid ${opt.color}` : "1px solid #E0E3E9",
                              background: selected ? opt.bg : "#fff",
                              color: selected ? opt.color : "#8F95A3",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-hm-text-sub mb-[5px]">메모</div>
                    <input
                      value={acc.note || ""}
                      onChange={e => updateAccount(idx, "note", e.target.value)}
                      placeholder="예: 자동이체 연결됨, 예비 계좌"
                      className={`${inputClassName} px-3 py-[9px]`}
                    />
                  </div>
                </div>

                {/* Status indicator bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: statusCfg.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: statusCfg.color }}>
                    {acc.bank} {acc.account_number ? `(${acc.account_number})` : ""} - {statusCfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          className={`px-10 py-3 rounded-[10px] border-none text-white font-extrabold text-sm cursor-pointer font-[inherit] transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)] ${saved ? 'bg-green-600' : 'bg-hm-blue-dark'}`}
        >
          {saved ? "저장 완료!" : "저장"}
        </button>
      </div>
    </div>
  );
};
