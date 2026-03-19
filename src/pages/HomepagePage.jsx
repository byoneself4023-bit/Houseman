import { useState, useEffect, useRef, useCallback } from 'react';
import { vacancies } from '../data';
import { useIsMobile, fmt } from '../utils';
import '../styles/homepage.css';

/* ─── Scroll reveal hook ─── */
const useReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, []); return ref;
};
const Reveal = ({ children, cls = "hm-reveal", delay = 0, style = {} }) => {
  const ref = useReveal();
  return <div ref={ref} className={cls} style={{ transitionDelay: `${delay}s`, ...style }}>{children}</div>;
};

/* ─── CountUp ─── */
const CountUp = ({ end, suffix = "" }) => {
  const [v, setV] = useState(0); const ref = useRef(null); const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true; let s = 0; const step = Math.max(1, Math.ceil(end / 50));
        const t = setInterval(() => { s += step; if (s >= end) { setV(end); clearInterval(t); } else setV(s); }, 30);
      }
    }, { threshold: 0.3 }); obs.observe(el); return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{v}{suffix}</span>;
};

const SITE = { phone: "1544-4150", kakao: "https://pf.kakao.com/_hYmxjn/chat", blog: "https://blog.naver.com/houseman842", email: "rokmc842@hanmail.net", address: "서울시 강남구 학동로8길 9, 5층", ceo: "박종호", bizNo: "206-16-25497" };

const LS_HP = "hm_homepage_content";
const loadContent = () => { try { return JSON.parse(localStorage.getItem(LS_HP)) || {}; } catch { return {}; } };
const saveContent = (c) => localStorage.setItem(LS_HP, JSON.stringify(c));

const DEFAULT_SERVICES = [
  { id: "building", icon: "🏢", title: "중소형 빌딩 관리", desc: "하우스맨은 중개보수를 쉐어하지 않습니다. 그래서 더 많은 중개사가 움직이고, 공실은 더 빨리 사라집니다.", img: "/svc3.jpg", heroImg: "/sv3-intro.jpg",
    detail: "'건물 운영', 생각보다 복잡하고 중요합니다. 세입자 관리, 임대료 수금, 계약 연장, 민원 대응, 시설 유지보수까지 건물을 직접 운영한다는 건 생각보다 훨씬 많은 시간과 스트레스를 요구합니다.",
    features: [{ t: "공실 관리", d: "임대 광고, 임대료 책정, 800여 부동산 연계로 빠른 공실 해소" }, { t: "수금·계약 관리", d: "체계적인 수납 시스템 + 연체 시 법적 대응까지" }, { t: "시설 유지보수", d: "정기 점검으로 장기 비용 절감 & 긴급 상황 즉시 대응" }, { t: "세입자 민원 대응", d: "건물주 대신 빠르고 깔끔하게 처리" }] },
  { id: "housing", icon: "🏠", title: "중소형 주택 관리", desc: "민원, 수금, 정산까지 대신 관리해 입주자 만족과 건물주 수익을 동시에 책임집니다.", img: "/svc4.jpg", heroImg: "/sv4-intro.jpg",
    detail: "운영은 복잡하고, 직접 하기엔 너무 번거롭습니다. 중소형 주택은 규모는 작아도 손이 많이 갑니다. 하우스맨은 건물주를 대신해 임차인 대응, 시설 관리, 공실 해결, 수금 및 정산을 처리합니다.",
    features: [{ t: "세입자 민원 응대", d: "층간소음, 청소, 고장 수리 등 즉시 처리" }, { t: "시설 유지보수", d: "정기 점검 및 긴급 대응" }, { t: "공실 대응", d: "단기·장기 병행 운영 전략, 빠른 계약 유도" }, { t: "임대료 수금 및 퇴실 정산", d: "체계적 수납 관리 및 원상복구" }] },
  { id: "shortterm", icon: "🔑", title: "단기임대", desc: "수익성과 운영 적합성을 먼저 진단하고, 검증된 건물만 전략적으로 운영합니다.", img: "/svc1.jpg", heroImg: "/sv1-intro.jpg",
    detail: "수익은 극대화되지만, 전략 없이 시작하면 실패합니다. 단기임대는 기존 장기임대 대비 수익이 월등히 높은 구조입니다. HOUSEMAN 운영 지역에서 최대 50% 이상 수익 상승 사례가 존재합니다.",
    features: [{ t: "수익성 시뮬레이션", d: "강남·서초·관악·동작 등 주요 지역 실전 경험 기반 분석" }, { t: "공실 최소화", d: "AI 기반 지역 중개 네트워크로 빠른 매칭" }, { t: "3개월 단위 계약", d: "유연한 계약 구조로 최적 수익 확보" }, { t: "100% 수금 책임제", d: "민원, 수금, 계약 All-in-One 대행" }] },
  { id: "corporate", icon: "🏗️", title: "기업 시설 관리", desc: "포르쉐 코리아 등 대형 기관에서 검증된 기준으로 합리적 비용의 고품질 관리를 제공합니다.", img: "/svc2.jpg", heroImg: "/sv2-intro.jpg",
    detail: "시설 관리도, 결국은 '회사 이미지'입니다. 전등 하나, 화장실 한 칸의 청결이 회사 인상을 좌우합니다. HOUSEMAN은 포르쉐 코리아, 보건복지부 산하 이브릿지 등 대형 기관에서 검증된 기준으로 관리합니다.",
    features: [{ t: "정기 방문 & 상시 점검", d: "전등 교체, 간단 수리, 청소 등 즉시 해결" }, { t: "투명한 운영 프로세스", d: "작업 이력과 비용 공개" }, { t: "기업 이미지 상승", d: "방문 고객과 협력사에게 보여지는 공간 완성도 향상" }, { t: "고정 인건비 절감", d: "별도 인력 없이 전문 관리" }] },
  { id: "nonresident", icon: "🏛️", title: "비상주 관리사무소", desc: "전담 인력의 순회 관리로, 관리사무소 없이도 체계적인 운영을 실현합니다.", img: "/svc5.jpg", heroImg: "/sv5-intro.jpg",
    detail: "관리사무소 없이도, 체계적인 운영이 가능합니다. 150세대 미만의 공동주택은 전담 관리사무소를 두기엔 비용이 부담스럽지만, HOUSEMAN은 전담 인력이 정기적으로 순회하며 민원 대응, 공용시설 관리, 관리비 정산 등을 수행합니다.",
    features: [{ t: "순회 방문 관리", d: "민원 처리, 공용시설 점검, 입퇴실 관리" }, { t: "입주민 만족도 향상", d: "체계적인 소통 채널 운영" }, { t: "합리적 비용 구조", d: "관리사무소 인건비 대비 절감" }, { t: "맞춤형 서비스", d: "건물 특성에 맞는 서비스 선택 가능" }] },
];

export const HomepagePage = ({ buildingData = {}, activeVacancies = [], isAdmin = false }) => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [vacancyFilter, setVacancyFilter] = useState("전체");
  const [detailRoom, setDetailRoom] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [serviceDetail, setServiceDetail] = useState(null); // 서비스 상세 페이지
  const [editMode, setEditMode] = useState(false); // 관리자 편집 모드
  const [editContent, setEditContent] = useState(loadContent);
  const SERVICES = DEFAULT_SERVICES.map(s => ({ ...s, ...((editContent.services || {})[s.id] || {}) }));

  // activeVacancies가 비어있으면 localStorage에서 직접 읽기 (풀화면 모드용)
  const lsVacancies = useMemo(() => {
    if (activeVacancies.length > 0) return activeVacancies;
    try { const v = JSON.parse(localStorage.getItem("hm_activeVacancies")); if (v && v.length > 0) return v; } catch {}
    return vacancies;
  }, [activeVacancies]);
  const src = lsVacancies;
  const pub = src.filter(v => v.status !== "점검/청소중");
  const filtered = vacancyFilter === "전체" ? pub : pub.filter(v => v.type === vacancyFilter);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // 히어로 이미지 자동 전환
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(p => (p + 1) % 2), 6000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = useCallback(id => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }, []);
  const getPhotos = (b, r) => (buildingData[b] || {})[`roomPhotos_${r}`] || [];
  const badgeColor = t => t === "단기" ? "#d4a853" : t === "근생" ? "#34c759" : "#0071e3";
  const navItems = [{ l: "소개", id: "about" }, { l: "서비스", id: "services" }, { l: "공실", id: "vacancy" }, { l: "사례", id: "cases" }, { l: "문의", id: "contact" }];

  // 관리자 편집 저장
  const saveEdit = (key, val) => {
    const next = { ...editContent, [key]: val };
    setEditContent(next); saveContent(next);
  };
  const EditableText = ({ field, defaultVal, tag: Tag = "p", style = {} }) => {
    const val = editContent[field] ?? defaultVal;
    if (!editMode) return <Tag style={style}>{val}</Tag>;
    return <textarea value={val} onChange={e => saveEdit(field, e.target.value)}
      style={{ ...style, background: "rgba(0,113,227,0.05)", border: "2px dashed var(--clr-red)", borderRadius: 8, padding: 12, width: "100%", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", color: "inherit", resize: "vertical", minHeight: 60 }} />;
  };

  // ─── SERVICE DETAIL VIEW ───
  if (serviceDetail) {
    const s = serviceDetail;
    return (
      <div className="hm-page" style={{ background: "var(--clr-white)", minHeight: "100vh" }}>
        {/* 히어로 이미지 */}
        <div style={{ position: "relative", height: isMobile ? "50vh" : "60vh", overflow: "hidden" }}>
          <img src={s.heroImg} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? "32px 24px" : "60px 80px" }}>
            <div onClick={() => setServiceDetail(null)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>← 돌아가기</div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 8, letterSpacing: "0.04em" }}>서비스안내</p>
            <h1 style={{ fontSize: isMobile ? 32 : 52, fontWeight: 700, color: "#fff", letterSpacing: "-0.04em", margin: 0, lineHeight: 1.1 }}>{s.title}</h1>
          </div>
        </div>
        {/* 본문 */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "48px 24px" : "80px 24px" }}>
          <Reveal>
            <p className="hm-body" style={{ fontSize: isMobile ? 16 : 19, lineHeight: 1.8, marginBottom: 56 }}>{s.detail}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="hm-headline" style={{ fontSize: isMobile ? 24 : 32, margin: "0 0 32px" }}>HOUSEMAN이 제공하는 관리</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 56 }}>
            {s.features.map((f, i) => (
              <Reveal key={i} className="hm-reveal-scale" delay={i * 0.08}>
                <div className="hm-svc-card" style={{ padding: isMobile ? 24 : 32 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--clr-black)", marginBottom: 8, letterSpacing: "-0.01em" }}>{f.t}</div>
                  <div className="hm-body" style={{ fontSize: 14 }}>{f.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
          {/* CTA */}
          <Reveal>
            <div style={{ background: "var(--clr-bg)", borderRadius: 24, padding: isMobile ? "32px 24px" : "48px 40px", textAlign: "center" }}>
              <h3 className="hm-headline" style={{ fontSize: isMobile ? 22 : 28, margin: "0 0 12px" }}>당신의 건물, 하우스맨이 책임집니다.</h3>
              <p className="hm-body" style={{ fontSize: 15, marginBottom: 28 }}>표준화된 매뉴얼과 AI 기반 시스템으로 공실 없는 건물, 수익 중심의 운영을 실현합니다.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={`tel:${SITE.phone}`} className="hm-btn hm-btn-filled">📞 {SITE.phone}</a>
                <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-btn" style={{ padding: "14px 32px", borderRadius: 980, background: "#fee500", color: "#1d1d1f", textDecoration: "none", fontWeight: 500, fontSize: 17 }}>💬 카카오톡 문의</a>
              </div>
            </div>
          </Reveal>
        </div>
        {/* 하단 고정 바 (모바일) */}
        {isMobile && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, display: "flex", gap: 0, background: "#fff", borderTop: "1px solid var(--clr-border)", padding: "10px 16px", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
            <a href={`tel:${SITE.phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12, background: "var(--clr-black)", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 15 }}>📞 전화</a>
            <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12, background: "#fee500", color: "#1d1d1f", textDecoration: "none", fontWeight: 600, fontSize: 15, marginLeft: 8 }}>💬 카카오톡</a>
          </div>
        )}
      </div>
    );
  }

  // ─── VACANCY DETAIL VIEW ───
  if (detailRoom) {
    const v = detailRoom; const photos = getPhotos(v.building, v.room); const idx = photoIdx < photos.length ? photoIdx : 0;
    return (
      <div className="hm-page" style={{ background: "var(--clr-white)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "20px" : "48px 20px" }}>
          <div onClick={() => setDetailRoom(null)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--clr-red)" }}>← 목록으로</div>
          <div style={{ aspectRatio: "16/9", borderRadius: 24, overflow: "hidden", position: "relative", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {photos.length ? <img src={photos[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> :
              <div style={{ textAlign: "center", color: "var(--clr-light)" }}><div style={{ fontSize: 48 }}>🏢</div><div style={{ fontSize: 14, marginTop: 8 }}>사진 준비중</div></div>}
            {photos.length > 1 && <>
              <div onClick={() => setPhotoIdx(idx > 0 ? idx - 1 : photos.length - 1)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: "#1d1d1f", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>‹</div>
              <div onClick={() => setPhotoIdx(idx < photos.length - 1 ? idx + 1 : 0)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: "#1d1d1f", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>›</div>
            </>}
          </div>
          <h2 className="hm-headline" style={{ fontSize: 32, margin: "28px 0 24px" }}>{v.building} {v.room}호</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[{ l: "보증금", val: fmt(v.deposit) + "만" }, { l: "월세", val: fmt(v.rent) + "만", c: "var(--clr-red)" }, { l: "관리비", val: v.mgmt > 0 ? v.mgmt + "만" : "없음" }].map((x, i) =>
              <div key={i} style={{ padding: 20, background: "var(--clr-bg)", borderRadius: 18, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--clr-light)", marginBottom: 6 }}>{x.l}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: x.c || "var(--clr-black)", letterSpacing: "-0.03em" }}>{x.val}</div>
              </div>)}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
            <a href={`tel:${SITE.phone}`} className="hm-btn hm-btn-dark" style={{ flex: 1, justifyContent: "center" }}>📞 {SITE.phone}</a>
            <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-btn" style={{ flex: 1, justifyContent: "center", background: "#fee500", color: "#1d1d1f", fontWeight: 600, padding: "14px 32px", borderRadius: 980, textDecoration: "none", fontSize: 17 }}>💬 카카오톡</a>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN PAGE ───
  return (
    <div className="hm-page" style={{ background: "var(--clr-white)", overflowX: "hidden" }}>

      {/* ═══ NAV ═══ */}
      <nav className={`hm-nav${scrolled ? " scrolled" : ""}`} style={{ padding: isMobile ? "14px 20px" : "14px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo-c.svg" alt="HOUSEMAN" style={{ height: isMobile ? 44 : 54, width: "auto", transition: "filter 0.4s", filter: scrolled ? "none" : "brightness(0) invert(1)" }} />
          {isMobile && (
            <div style={{ transition: "color 0.4s" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: scrolled ? "var(--clr-black)" : "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>HOUSEMAN</div>
              <div style={{ fontSize: 9, color: scrolled ? "var(--clr-muted)" : "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>중소형 빌딩 관리<br/>임대 주택 관리</div>
            </div>
          )}
        </div>
        {isMobile ? (
          <div onClick={() => setMenuOpen(!menuOpen)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 24, color: scrolled ? "var(--clr-black)" : "#fff", transition: "color 0.4s" }}>{menuOpen ? "✕" : "☰"}</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {navItems.map(n => <span key={n.id} className="hm-nav-link" onClick={() => scrollTo(n.id)} style={{ color: scrolled ? "var(--clr-muted)" : "rgba(255,255,255,0.8)" }}>{n.l}</span>)}
            <a href={`tel:${SITE.phone}`} className="hm-btn" style={{ padding: "10px 24px", fontSize: 14, borderRadius: 980, fontWeight: 600, textDecoration: "none", background: scrolled ? "var(--clr-red)" : "#fff", color: scrolled ? "#fff" : "var(--clr-black)" }}>{SITE.phone}</a>
          </div>
        )}
      </nav>
      {menuOpen && isMobile && (
        <div style={{ position: "fixed", inset: 0, top: 48, background: "rgba(250,250,250,0.97)", backdropFilter: "blur(40px)", zIndex: 99, padding: "60px 32px", display: "flex", flexDirection: "column", gap: 32 }}>
          {navItems.map(n => <span key={n.id} onClick={() => scrollTo(n.id)} style={{ fontSize: 32, fontWeight: 700, color: "var(--clr-black)", cursor: "pointer", letterSpacing: "-0.03em" }}>{n.l}</span>)}
          <a href={`tel:${SITE.phone}`} className="hm-btn hm-btn-filled" style={{ marginTop: 16, justifyContent: "center", fontSize: 20, padding: "18px" }}>{SITE.phone}</a>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", height: isMobile ? "60vh" : "100vh", overflow: "hidden" }}>
        {/* 배경 이미지 — 크로스페이드 + 줌 */}
        {["/hero1.jpg", "/hero2.jpg"].map((img, i) => (
          <div key={i} className={`hm-hero-slide ${heroIdx === i ? "active" : "inactive"}`}
            style={{ backgroundImage: `url(${img})` }} />
        ))}
        {/* 그라데이션 오버레이 */}
        <div className="hm-hero-overlay" />

        {/* 콘텐츠 */}
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: isMobile ? "flex-end" : "center", padding: isMobile ? "0 24px 100px" : "0 80px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 600 }}>
            <Reveal delay={0.2}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 16, letterSpacing: "0.04em" }}>15년 경험 · 서울 100여 건물 관리</p>
            </Reveal>
            <Reveal delay={0.35}>
              <h1 style={{ fontSize: isMobile ? 36 : 60, fontWeight: 700, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
                건물 운영의 격을<br/>다르게 합니다
              </h1>
            </Reveal>
            <Reveal delay={0.5}>
              <p style={{ fontSize: isMobile ? 15 : 18, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: isMobile ? 48 : 32, maxWidth: 460, letterSpacing: "-0.01em" }}>
                현실을 아는 운영, 숫자로 증명되는 결과.
              </p>
            </Reveal>
            <Reveal delay={0.6}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={`tel:${SITE.phone}`} className="hm-btn hm-btn-filled" style={{ fontSize: isMobile ? 15 : 17 }}>관리 문의</a>
                <span onClick={() => scrollTo("vacancy")} className="hm-btn hm-btn-outline" style={{ fontSize: isMobile ? 15 : 17, cursor: "pointer", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>공실 확인하기</span>
              </div>
            </Reveal>
          </div>
        </div>

        {/* 히어로 인디케이터 */}
        <div style={{ position: "absolute", bottom: isMobile ? 32 : 48, right: isMobile ? 24 : 80, zIndex: 2, display: "flex", gap: 8 }}>
          {[0, 1].map(i => (
            <div key={i} onClick={() => setHeroIdx(i)}
              className={`hm-hero-indicator${heroIdx === i ? " active" : ""}`} />
          ))}
        </div>
      </section>

      {/* ═══ STATS STRIP ═══ */}
      <section style={{ padding: isMobile ? "48px 24px" : "72px 48px", borderBottom: "1px solid var(--clr-border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 32 : 48, textAlign: "center" }}>
          {[{ n: 15, s: "년+", l: "운영 경험" }, { n: 100, s: "+", l: "관리 건물" }, { n: 800, s: "+", l: "중개 네트워크" }, { n: 98, s: "%", l: "입주율" }].map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="hm-stat-num" style={{ fontSize: isMobile ? 36 : 52 }}><CountUp end={s.n} suffix={s.s} /></div>
              <div className="hm-stat-label">{s.l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ ABOUT — 분할 레이아웃 ═══ */}
      <section id="about" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "1fr 1fr", minHeight: isMobile ? "auto" : "80vh" }}>
          {/* 좌측: 흰색 텍스트 영역 */}
          <div style={{ padding: isMobile ? "64px 24px" : "80px 60px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fff" }}>
            <Reveal>
              <p className="hm-eyebrow" style={{ marginBottom: 20 }}>About Houseman</p>
              <div style={{ position: "relative", display: "inline-block", margin: "0 0 28px" }}>
                <EditableText field="aboutTitle" defaultVal="실전에서 증명된 운영 전문 기업, HOUSEMAN" tag="h2" style={{ fontSize: isMobile ? 26 : 34, fontWeight: 700, lineHeight: 1.25, margin: 0, letterSpacing: "-0.03em", color: "var(--clr-black)", paddingLeft: isMobile ? 16 : 20, borderLeft: "3px solid var(--clr-red)" }} />
                <div className="hm-title-line" />
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <EditableText field="aboutBody1" defaultVal="HOUSEMAN은 단순히 스타트업이 아니라, 14년간 현장을 누비며 건물 운영의 본질을 지켜온 실전형 전문가 조직입니다. 건물 관리는 단순히 시스템을 도입하거나 IT 기술을 흉내낸다고 해서 운영이 되는 일이 아닙니다." tag="p" style={{ fontSize: 15, color: "var(--clr-muted)", lineHeight: 1.8, marginBottom: 16, letterSpacing: "-0.01em" }} />
              <EditableText field="aboutBody2" defaultVal="HOUSEMAN은 2012년 설립 이후 수많은 건물을 직접 관리하며 축적한 현장 중심의 노하우를 바탕으로, 운영 프로세스 개선, 기술 도입, 문제 해결력 강화를 멈추지 않고 이어가고 있습니다. 기술도 경험도 함께 갖춘, 가장 현실적이고 신뢰할 수 있는 운영 파트너, 그 이름이 바로 HOUSEMAN입니다." tag="p" style={{ fontSize: 15, color: "var(--clr-muted)", lineHeight: 1.8, letterSpacing: "-0.01em" }} />
            </Reveal>
          </div>
          {/* 우측: 빨간 배경 + 사진 겹침 */}
          <div style={{ position: "relative", background: "#c41230", minHeight: isMobile ? 300 : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Reveal className="hm-reveal-scale" delay={0.2}>
              <div style={{ position: "relative", margin: isMobile ? "40px 24px" : "40px", marginLeft: isMobile ? 24 : -40, borderRadius: 0, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", aspectRatio: isMobile ? "4/3" : "3/4", maxHeight: isMobile ? 300 : 500 }}>
                <img src="/about-img.jpg" alt="하우스맨" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="hm-section-gray" style={{ padding: isMobile ? "80px 24px" : "120px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 20 }}>
          {[
            { icon: "📊", t: "투명한 정산", d: "실시간 보고 체계와 월간 리포트" },
            { icon: "🔧", t: "원스톱 관리", d: "민원·시설·행정 모든 것을 일괄 처리" },
            { icon: "🤝", t: "중개 네트워크", d: "800여 부동산과 연계한 공실 해소" },
            { icon: "⚡", t: "15년 현장 경험", d: "실전에서 검증된 운영 노하우" },
          ].map((item, i) => (
            <Reveal key={i} className="hm-reveal-scale" delay={i * 0.08}>
              <div className="hm-svc-card" style={{ padding: isMobile ? 24 : 32 }}>
                <div className="hm-svc-icon" style={{ marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--clr-black)", marginBottom: 6, letterSpacing: "-0.02em" }}>{item.t}</div>
                <div className="hm-body" style={{ fontSize: 14 }}>{item.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ HIGHLIGHT BANNER ═══ */}
      <section style={{ position: "relative", padding: isMobile ? "80px 24px" : "120px 48px", overflow: "hidden" }}>
        <div className="hm-hero-bg" /><div className="hm-hero-grid" />
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <Reveal>
            <h2 className="hm-headline" style={{ fontSize: isMobile ? 26 : 40, margin: "0 0 16px" }}>하우스맨은 중개보수를<br/>쉐어하지 않습니다.</h2>
            <p className="hm-body" style={{ fontSize: isMobile ? 16 : 20 }}>그래서 더 많은 중개사가 움직이고,<br/>공실은 더 빨리 사라집니다.</p>
          </Reveal>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section id="services" style={{ padding: isMobile ? "80px 24px" : "140px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <p className="hm-eyebrow" style={{ marginBottom: 16 }}>Services</p>
            <h2 className="hm-headline" style={{ fontSize: isMobile ? 30 : 44, margin: "0 0 56px" }}>맞춤형 관리 서비스</h2>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 40 }}>
            {SERVICES.map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div onClick={() => setServiceDetail(s)} style={{
                  display: isMobile ? "block" : "grid",
                  gridTemplateColumns: i % 2 === 0 ? "1fr 1fr" : "1fr 1fr",
                  gap: isMobile ? 20 : 48, alignItems: "center",
                  background: "var(--clr-bg)", borderRadius: 28, overflow: "hidden",
                  transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)", cursor: "pointer",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ order: isMobile ? 0 : (i % 2 === 0 ? 0 : 1), aspectRatio: isMobile ? "16/9" : "4/3", overflow: "hidden" }}>
                    <img src={s.img} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "none"} />
                  </div>
                  <div style={{ padding: isMobile ? "28px 24px" : "48px 40px", order: isMobile ? 1 : (i % 2 === 0 ? 1 : 0) }}>
                    <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
                    <h3 className="hm-headline" style={{ fontSize: isMobile ? 22 : 28, margin: "0 0 12px" }}>{s.title}</h3>
                    <p className="hm-body" style={{ fontSize: isMobile ? 14 : 16 }}>{s.desc}</p>
                    <span style={{ display: "inline-block", marginTop: 16, fontSize: 14, fontWeight: 500, color: "var(--clr-red)" }}>자세히 보기 →</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VACANCY ═══ */}
      <section id="vacancy" className="hm-section-gray" style={{ padding: isMobile ? "80px 24px" : "140px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <p className="hm-eyebrow" style={{ marginBottom: 16 }}>Vacancy</p>
            <h2 className="hm-headline" style={{ fontSize: isMobile ? 30 : 44, margin: "0 0 8px" }}>공실 현황</h2>
            <p className="hm-body" style={{ fontSize: 17, marginBottom: 36 }}>현재 입주 가능한 <span style={{ color: "var(--clr-red)", fontWeight: 600 }}>{pub.length}개</span> 매물</p>
          </Reveal>
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            {["전체", "단기", "일반임대", "근생"].map(t => {
              const cnt = t === "전체" ? pub.length : pub.filter(v => v.type === t).length;
              if (t !== "전체" && cnt === 0) return null;
              return <button key={t} onClick={() => setVacancyFilter(t)} style={{
                padding: "10px 24px", borderRadius: 980, border: "none", cursor: "pointer", fontFamily: "inherit",
                fontWeight: 500, fontSize: 14, letterSpacing: "-0.01em",
                background: vacancyFilter === t ? "var(--clr-black)" : "#fff", color: vacancyFilter === t ? "#fff" : "var(--clr-muted)",
                transition: "all 0.3s", boxShadow: vacancyFilter !== t ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
              }}>{t} ({cnt})</button>;
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
            {filtered.slice(0, 6).map((v, i) => {
              const photos = getPhotos(v.building, v.room);
              return (
                <Reveal key={i} className="hm-reveal-scale" delay={i * 0.05}>
                  <div className="hm-vacancy-card" onClick={() => { setPhotoIdx(0); setDetailRoom(v); }}>
                    <div style={{ aspectRatio: "16/9", background: "var(--clr-bg)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                      {photos.length > 0 ? <img src={photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s" }} /> :
                        <span style={{ fontSize: 36, opacity: 0.3 }}>🏢</span>}
                      <span style={{ position: "absolute", top: 14, left: 14, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 980, background: badgeColor(v.type), color: "#fff" }}>{v.type}</span>
                    </div>
                    <div style={{ padding: "18px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--clr-black)", letterSpacing: "-0.02em" }}>{v.building} {v.room}호</span>
                        {v.linkedTenant && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>임차인연결</span>}
                      </div>
                      <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
                        <span><span style={{ color: "var(--clr-light)", fontSize: 12 }}>보증금 </span><span style={{ fontWeight: 700 }}>{fmt(v.deposit)}만</span></span>
                        <span><span style={{ color: "var(--clr-light)", fontSize: 12 }}>월세 </span><span style={{ fontWeight: 700, color: "var(--clr-red)" }}>{fmt(v.rent)}만</span></span>
                        {v.mgmt > 0 && <span><span style={{ color: "var(--clr-light)", fontSize: 12 }}>관리비 </span><span style={{ fontWeight: 600 }}>{v.mgmt}만</span></span>}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CASES ═══ */}
      <section id="cases" style={{ padding: isMobile ? "80px 24px" : "140px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <p className="hm-eyebrow" style={{ marginBottom: 16 }}>Case Studies</p>
            <h2 className="hm-headline" style={{ fontSize: isMobile ? 30 : 44, margin: "0 0 48px" }}>관리 사례</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
            {[
              { title: "신축 원룸 공실률 0% 달성", excerpt: "관악구 12세대 건물을 3개월 만에 만실로 전환한 운영 전략", date: "2026.03", tag: "공실 관리", img: "/sub-vs-0.jpg" },
              { title: "상가 임대료 15% 인상 성공", excerpt: "을지로 상가 건물의 체계적 관리로 임차인 만족과 임대료 인상 동시 달성", date: "2026.02", tag: "빌딩 관리", img: "/sub-vs-1.jpg" },
              { title: "단기임대 전환 수익 40%↑", excerpt: "장기→단기 전환으로 월 수익을 40% 이상 끌어올린 실전 사례", date: "2026.02", tag: "단기임대", img: "/sub-vs-2.jpg" },
            ].map((post, i) => (
              <Reveal key={i} className="hm-reveal-scale" delay={i * 0.1}>
                <div className="hm-blog-card">
                  <div className="hm-blog-thumb" style={{ aspectRatio: "16/10" }}>
                    <img src={post.img} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 980, background: "rgba(0,113,227,0.08)", color: "var(--clr-red)" }}>{post.tag}</span>
                      <span style={{ fontSize: 12, color: "var(--clr-light)" }}>{post.date}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, marginBottom: 10, color: "var(--clr-black)", letterSpacing: "-0.02em" }}>{post.title}</div>
                    <div className="hm-body" style={{ fontSize: 14 }}>{post.excerpt}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <a href={SITE.blog} target="_blank" rel="noopener noreferrer" className="hm-btn hm-btn-outline" style={{ fontSize: 15 }}>더 많은 사례 보기</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="contact" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src="/contact-bg.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "80px 24px" : "120px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            <Reveal>
              <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 700, color: "#fff", lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.04em" }}>당신의 건물,<br/>하우스맨이 책임집니다.</h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p style={{ fontSize: isMobile ? 15 : 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 40, letterSpacing: "-0.01em" }}>
                표준화된 매뉴얼과 AI 기반 시스템으로<br/>공실 없는 건물, 수익 중심의 운영을 실현합니다.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={`tel:${SITE.phone}`} className="hm-btn" style={{ padding: "14px 32px", borderRadius: 980, background: "#fff", color: "var(--clr-black)", textDecoration: "none", fontWeight: 600, fontSize: 18 }}>📞 {SITE.phone}</a>
                <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-btn" style={{ padding: "14px 32px", borderRadius: 980, background: "#fee500", color: "#1d1d1f", textDecoration: "none", fontWeight: 600, fontSize: 18 }}>💬 카카오톡</a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: isMobile ? "48px 24px" : "64px 48px", background: "var(--clr-bg)", borderTop: "1px solid var(--clr-border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: isMobile ? "block" : "flex", justifyContent: "space-between", marginBottom: 32, gap: 40 }}>
            <div style={{ marginBottom: isMobile ? 24 : 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--clr-black)", marginBottom: 12, letterSpacing: "-0.03em" }}>HOUSEMAN</div>
              <div style={{ fontSize: 13, color: "var(--clr-light)", lineHeight: 2 }}>
                대표: {SITE.ceo} · 사업자번호: {SITE.bizNo}<br/>{SITE.address}<br/>Email: {SITE.email}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-sns-btn"><img src="/sns-kakao.svg" alt="카카오톡" /></a>
              <a href={SITE.blog} target="_blank" rel="noopener noreferrer" className="hm-sns-btn"><img src="/sns-blog.svg" alt="블로그" /></a>
            </div>
          </div>
          <hr className="hm-divider" style={{ marginBottom: 20 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--clr-light)" }}>© HOUSEMAN. All rights reserved.</div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--clr-light)" }}>
              <span style={{ cursor: "pointer" }}>개인정보처리방침</span>
              <span style={{ cursor: "pointer" }}>이용약관</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ 모바일 하단 고정 바 ═══ */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, display: "flex", gap: 8, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--clr-border)", padding: "10px 16px", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
          <a href={`tel:${SITE.phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12, background: "var(--clr-black)", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 15 }}>📞 전화하기</a>
          <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12, background: "#fee500", color: "#1d1d1f", textDecoration: "none", fontWeight: 600, fontSize: 15 }}>💬 카카오톡</a>
        </div>
      )}

      {/* ═══ 플로팅 버튼 (카카오/전화/스크롤탑) ═══ */}
      <div className={`hm-float-wrap ${scrolled ? "visible" : "hidden"}`} style={{ bottom: isMobile ? 80 : 28 }}>
        <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-float-btn" style={{ background: "#3C3C3C", color: "#fff" }}>
          <img src="/kakao-side.svg" alt="카카오톡" style={{ width: 26, height: 26, filter: "brightness(0) invert(1)" }} />
        </a>
        <a href={`tel:${SITE.phone}`} className="hm-float-btn" style={{ background: "#fff", border: "1px solid var(--clr-border)" }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>📞</span>
        </a>
        <div onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hm-float-btn" style={{ background: "var(--clr-red)", cursor: "pointer" }}>
          <span style={{ fontSize: 20, lineHeight: 1, color: "#fff" }}>▲</span>
        </div>
      </div>

      {/* ═══ 관리자 편집 버튼 ═══ */}
      {isAdmin && (
        <div onClick={() => setEditMode(!editMode)} style={{
          position: "fixed", bottom: isMobile ? 70 : 24, right: 24, zIndex: 101,
          width: 52, height: 52, borderRadius: 16,
          background: editMode ? "var(--clr-red)" : "var(--clr-black)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          transition: "all 0.3s",
        }}>{editMode ? "✓" : "✏️"}</div>
      )}
    </div>
  );
};
