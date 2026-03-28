// @ts-nocheck
import { useState, useCallback } from 'react';
import { Card, SectionTitle } from '../components';
import { inputStyle } from '../components/Field';
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

  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 5 };

  return (
    <div>
      <SectionTitle sub="하우스맨 회사 기본정보를 관리합니다">
        {"🏢 하우스맨 기본정보"}
      </SectionTitle>

      {/* Company Info */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{"📋"}</span> 회사 정보
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <div>
            <div style={labelStyle}>회사명</div>
            <input
              value={settings.company_name || ""}
              onChange={e => update("company_name", e.target.value)}
              placeholder="예: (주)하우스맨"
              style={{ ...inputStyle, padding: "10px 14px" }}
            />
          </div>
          <div>
            <div style={labelStyle}>대표 전화번호</div>
            <input
              value={settings.company_phone || ""}
              onChange={e => update("company_phone", e.target.value)}
              placeholder="예: 02-1234-5678"
              style={{ ...inputStyle, padding: "10px 14px" }}
            />
          </div>
          <div>
            <div style={labelStyle}>대표 이메일</div>
            <input
              value={settings.company_email || ""}
              onChange={e => update("company_email", e.target.value)}
              placeholder="예: info@houseman.co.kr"
              style={{ ...inputStyle, padding: "10px 14px" }}
            />
          </div>
          <div>
            <div style={labelStyle}>회사 주소</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={settings.company_address || ""}
                onChange={e => update("company_address", e.target.value)}
                placeholder="주소를 입력하거나 검색하세요"
                style={{ ...inputStyle, padding: "10px 14px", flex: 1 }}
              />
              <button
                onClick={openPostcodeSearch}
                style={{
                  padding: "10px 16px", borderRadius: 8, border: "1.5px solid #3B82F6",
                  background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0
                }}
              >
                {"🔍"} 주소검색
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Bank Accounts */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{"🏦"}</span> 하우스맨 계좌 목록
            <span style={{ fontSize: 12, fontWeight: 600, color: "#8F95A3" }}>({accounts.length}개)</span>
          </div>
          <button
            onClick={addAccount}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "1.5px solid #3B82F6",
              background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit"
            }}
          >
            + 계좌 추가
          </button>
        </div>

        {accounts.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#8F95A3", fontSize: 13 }}>
            등록된 계좌가 없습니다. 위의 &quot;계좌 추가&quot; 버튼을 눌러 추가하세요.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {accounts.map((acc, idx) => {
            const statusCfg = STATUS_OPTIONS.find(s => s.value === acc.status) || STATUS_OPTIONS[0];
            return (
              <div key={acc.id || idx} style={{
                padding: 16, borderRadius: 12, border: "1px solid #E8ECF0", background: "#FAFBFC",
                position: "relative"
              }}>
                {/* Remove button */}
                <button
                  onClick={() => removeAccount(idx)}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    width: 28, height: 28, borderRadius: "50%",
                    border: "1px solid #FECACA", background: "#FEF2F2",
                    color: "#DC2626", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit", lineHeight: 1
                  }}
                  title="계좌 삭제"
                >
                  x
                </button>

                {/* 대표계좌 표시 */}
                {acc.isPrimary && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: 4, border: "1px solid #BFDBFE" }}>★ 대표계좌</span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={labelStyle}>별칭 (용도)</div>
                    <input
                      value={acc.alias || ""}
                      onChange={e => updateAccount(idx, "alias", e.target.value)}
                      placeholder="예: 관리비통장, 월세통장"
                      style={{ ...inputStyle, padding: "9px 12px" }}
                    />
                  </div>
                  <div>
                    <div style={labelStyle}>은행명</div>
                    <select
                      value={acc.bank || "국민은행"}
                      onChange={e => updateAccount(idx, "bank", e.target.value)}
                      style={{ ...inputStyle, padding: "9px 12px", cursor: "pointer" }}
                    >
                      {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>계좌번호</div>
                    <input
                      value={acc.account_number || ""}
                      onChange={e => updateAccount(idx, "account_number", e.target.value)}
                      placeholder="예: 123-456-789012"
                      style={{ ...inputStyle, padding: "9px 12px" }}
                    />
                  </div>
                  <div>
                    <div style={labelStyle}>예금주</div>
                    <input
                      value={acc.holder || ""}
                      onChange={e => updateAccount(idx, "holder", e.target.value)}
                      placeholder="예: 박종호"
                      style={{ ...inputStyle, padding: "9px 12px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr 2fr", gap: 12 }}>
                  <div>
                    <div style={labelStyle}>대표계좌</div>
                    <button
                      onClick={() => {
                        if (acc.isPrimary) return;
                        const updated = accounts.map((a, i) => ({ ...a, isPrimary: i === idx }));
                        update("houseman_bank_accounts", updated);
                      }}
                      style={{
                        padding: "7px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                        border: acc.isPrimary ? "1.5px solid #2563EB" : "1px solid #E0E3E9",
                        background: acc.isPrimary ? "#EFF6FF" : "#fff",
                        color: acc.isPrimary ? "#2563EB" : "#8F95A3",
                        cursor: acc.isPrimary ? "default" : "pointer", fontFamily: "inherit",
                      }}
                    >
                      {acc.isPrimary ? "★ 대표" : "대표로 설정"}
                    </button>
                  </div>
                  <div>
                    <div style={labelStyle}>상태</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {STATUS_OPTIONS.map(opt => {
                        const selected = acc.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => updateAccount(idx, "status", opt.value)}
                            style={{
                              flex: 1, padding: "7px 8px", borderRadius: 7, fontSize: 11, fontWeight: selected ? 700 : 500,
                              border: selected ? `1.5px solid ${opt.color}` : "1px solid #E0E3E9",
                              background: selected ? opt.bg : "#fff",
                              color: selected ? opt.color : "#8F95A3",
                              cursor: "pointer", fontFamily: "inherit"
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>메모</div>
                    <input
                      value={acc.note || ""}
                      onChange={e => updateAccount(idx, "note", e.target.value)}
                      placeholder="예: 자동이체 연결됨, 예비 계좌"
                      style={{ ...inputStyle, padding: "9px 12px" }}
                    />
                  </div>
                </div>

                {/* Status indicator bar */}
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusCfg.color }} />
                  <span style={{ fontSize: 11, color: statusCfg.color, fontWeight: 600 }}>
                    {acc.bank} {acc.account_number ? `(${acc.account_number})` : ""} - {statusCfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 40px", borderRadius: 10, border: "none",
            background: saved ? "#16A34A" : "#2563EB",
            color: "#fff", fontWeight: 800, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)"
          }}
        >
          {saved ? "저장 완료!" : "저장"}
        </button>
      </div>
    </div>
  );
};
