import { useState } from 'react';
import { useIsMobile } from '../utils';

const LS_HP = "hm_homepage_content";
const load = () => { try { return JSON.parse(localStorage.getItem(LS_HP)) || {}; } catch { return {}; } };
const save = (c) => localStorage.setItem(LS_HP, JSON.stringify(c));

const FIELDS = [
  { section: "히어로 (메인 배너)", fields: [
    { key: "heroSub", label: "상단 작은 글씨", default: "15년 경험 · 서울 100여 건물 관리" },
    { key: "heroTitle", label: "메인 타이틀", default: "건물 운영의 격을\n다르게 합니다" },
    { key: "heroDesc", label: "설명 문구", default: "현실을 아는 운영, 숫자로 증명되는 결과." },
  ]},
  { section: "About (회사 소개)", fields: [
    { key: "aboutTitle", label: "소개 제목", default: "실전에서 증명된 운영 전문 기업, HOUSEMAN" },
    { key: "aboutBody1", label: "소개 본문 1", default: "HOUSEMAN은 단순히 스타트업이 아니라, 14년간 현장을 누비며 건물 운영의 본질을 지켜온 실전형 전문가 조직입니다. 건물 관리는 단순히 시스템을 도입하거나 IT 기술을 흉내낸다고 해서 운영이 되는 일이 아닙니다.", type: "long" },
    { key: "aboutBody2", label: "소개 본문 2", default: "HOUSEMAN은 2012년 설립 이후 수많은 건물을 직접 관리하며 축적한 현장 중심의 노하우를 바탕으로, 운영 프로세스 개선, 기술 도입, 문제 해결력 강화를 멈추지 않고 이어가고 있습니다. 기술도 경험도 함께 갖춘, 가장 현실적이고 신뢰할 수 있는 운영 파트너, 그 이름이 바로 HOUSEMAN입니다.", type: "long" },
  ]},
  { section: "하이라이트 (중개보수 배너)", fields: [
    { key: "highlightTitle", label: "제목", default: "하우스맨은 중개보수를\n쉐어하지 않습니다." },
    { key: "highlightDesc", label: "설명", default: "그래서 더 많은 중개사가 움직이고,\n공실은 더 빨리 사라집니다." },
  ]},
  { section: "CTA (하단 문의 섹션)", fields: [
    { key: "ctaTitle", label: "제목", default: "당신의 건물,\n하우스맨이 책임집니다." },
    { key: "ctaDesc", label: "설명", default: "표준화된 매뉴얼과 AI 기반 시스템으로\n공실 없는 건물, 수익 중심의 운영을 실현합니다." },
  ]},
  { section: "통계 숫자", fields: [
    { key: "stat1Num", label: "운영 경험 (숫자)", default: "15" },
    { key: "stat2Num", label: "관리 건물 (숫자)", default: "100" },
    { key: "stat3Num", label: "중개 네트워크 (숫자)", default: "800" },
    { key: "stat4Num", label: "입주율 (숫자)", default: "98" },
  ]},
];

export const HomepageEditPage = () => {
  const isMobile = useIsMobile();
  const [data, setData] = useState(load);
  const [saved, setSaved] = useState(false);

  const update = (key, val) => {
    const next = { ...data, [key]: val };
    setData(next);
    setSaved(false);
  };

  const handleSave = () => {
    save(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("모든 수정 내용을 초기화하시겠습니까?")) {
      localStorage.removeItem(LS_HP);
      setData({});
      setSaved(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "'Pretendard', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.03em" }}>홈페이지 편집</h1>
          <p style={{ fontSize: 13, color: "#86868b", margin: 0 }}>홈페이지에 표시되는 텍스트를 수정합니다</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleReset} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e5ea", background: "#fff", color: "#6e6e73", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>초기화</button>
          <button onClick={handleSave} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saved ? "#34c759" : "#c8161d", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "background 0.3s" }}>
            {saved ? "✓ 저장완료" : "저장"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <a href="/?mode=homepage" target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", borderRadius: 8, background: "#f5f5f7", border: "1px solid #e5e5ea", color: "#1d1d1f", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>🌐 홈페이지 미리보기</a>
      </div>

      {FIELDS.map((section, si) => (
        <div key={si} style={{ marginBottom: 32, background: "#fff", borderRadius: 16, border: "1px solid #e5e5ea", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "#f5f5f7", borderBottom: "1px solid #e5e5ea" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#1d1d1f" }}>{section.section}</h2>
          </div>
          <div style={{ padding: "20px" }}>
            {section.fields.map((field, fi) => (
              <div key={fi} style={{ marginBottom: fi < section.fields.length - 1 ? 20 : 0 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6e6e73", marginBottom: 6 }}>{field.label}</label>
                {field.type === "long" ? (
                  <textarea
                    value={data[field.key] ?? field.default}
                    onChange={e => update(field.key, e.target.value)}
                    placeholder={field.default}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e5e5ea", fontSize: 14, fontFamily: "inherit", resize: "vertical", minHeight: 100, outline: "none", lineHeight: 1.7, boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = "#c8161d"}
                    onBlur={e => e.target.style.borderColor = "#e5e5ea"}
                  />
                ) : (
                  <input
                    value={data[field.key] ?? field.default}
                    onChange={e => update(field.key, e.target.value)}
                    placeholder={field.default}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e5e5ea", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = "#c8161d"}
                    onBlur={e => e.target.style.borderColor = "#e5e5ea"}
                  />
                )}
                {(data[field.key] && data[field.key] !== field.default) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#c8161d", fontWeight: 600 }}>수정됨</span>
                    <span onClick={() => update(field.key, field.default)} style={{ fontSize: 11, color: "#86868b", cursor: "pointer", textDecoration: "underline" }}>원래대로</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ padding: "20px", background: "#f5f5f7", borderRadius: 16, marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#86868b", marginBottom: 8 }}>안내</div>
        <div style={{ fontSize: 13, color: "#6e6e73", lineHeight: 1.7 }}>
          • 저장 후 홈페이지를 새로고침하면 반영됩니다<br/>
          • 줄바꿈은 텍스트 입력란에서 Enter로 가능합니다<br/>
          • 초기화하면 기본 텍스트로 돌아갑니다<br/>
          • 서비스 상세 페이지 내용은 추후 편집 기능 추가 예정
        </div>
      </div>
    </div>
  );
};
