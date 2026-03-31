import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { vacancies } from '@/data';
import { roomMasterData } from '@/data/roomMasterData';
import { useIsMobile, fmt } from '@/utils';
import '@/styles/homepage.css';

/* ─── Scroll reveal hook ─── */
const useReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, []); return ref;
};
interface RevealProps {
  children: React.ReactNode;
  cls?: string;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
  [key: string]: any;
}

const Reveal = ({ children, cls, className, delay = 0, style = {}, ...rest }: RevealProps) => {
  const ref = useReveal();
  return <div ref={ref} className={cls || className || "hm-reveal"} style={{ transitionDelay: `${delay}s`, ...style }}>{children}</div>;
};

/* ─── CountUp ─── */
const CountUp = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
  const [v, setV] = useState(0); const ref = useRef<HTMLSpanElement>(null); const started = useRef(false);
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
const loadContent = (): Record<string, any> => { try { return JSON.parse(localStorage.getItem(LS_HP) || '{}') || {}; } catch { return {}; } };
const saveContent = (c: Record<string, any>) => localStorage.setItem(LS_HP, JSON.stringify(c));

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

interface HomepagePageProps {
  buildingData?: Record<string, any>;
  activeVacancies?: Record<string, any>[];
  calendarEvts?: Record<string, any>[];
  setCalendarEvts?: React.Dispatch<React.SetStateAction<Record<string, any>[]>>;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export const HomepagePage = ({ buildingData = {}, activeVacancies = [], calendarEvts = [], setCalendarEvts, isAdmin = false, isLoading }: HomepagePageProps) => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [vacancyFilter, setVacancyFilter] = useState("전체");
  const [detailRoom, setDetailRoom] = useState<Record<string, any> | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [serviceDetail, setServiceDetail] = useState<Record<string, any> | null>(null); // 서비스 상세 페이지
  const [editMode, setEditMode] = useState(false); // 관리자 편집 모드
  const [vacancyPage, setVacancyPage] = useState(0);
  const VACANCY_PER_PAGE = isMobile ? 6 : 12;
  const [vacancyOrder, setVacancyOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hm_vacancyOrder") || "null"); } catch { return null; }
  });
  // 계약하기 플로우
  const [contractStep, setContractStep] = useState<string | null>(null); // null | "verify" | "form"
  const [contractPhone, setContractPhone] = useState("");
  const [contractBroker, setContractBroker] = useState<Record<string, any> | null>(null); // matched broker
  const [contractForm, setContractForm] = useState<Record<string, any>>({});
  const [contractError, setContractError] = useState("");
  const [editContent, setEditContent] = useState(loadContent);
  const SERVICES = DEFAULT_SERVICES.map(s => ({ ...s, ...((editContent.services || {})[s.id] || {}) }));

  // 공실 데이터: props → localStorage → 정적데이터 순으로 읽기
  const [realVacancies] = useState(() => {
    if (activeVacancies && activeVacancies.length > 0) return activeVacancies;
    try {
      const raw = localStorage.getItem("hm_activeVacancies");
      if (raw) { const parsed = JSON.parse(raw); if (parsed && parsed.length > 0) return parsed; }
    } catch {}
    return vacancies;
  });
  const src = activeVacancies.length > 0 ? activeVacancies : realVacancies;

  // 계약현황에 있는 공실 체크 (캘린더 이벤트 type="계약")
  const contractSet = useMemo(() => {
    const set = new Set();
    const evts = calendarEvts.length > 0 ? calendarEvts : (() => {
      try {
        // App.jsx는 "appData" 키에 저장
        const appData = JSON.parse(localStorage.getItem("appData") || "{}");
        return appData["hm_calendarEvts"] || [];
      } catch { return []; }
    })();
    for (const ev of evts) {
      if (ev.type === "계약" && ev.building && ev.room) {
        set.add(`${ev.building}_${ev.room}`);
      }
    }
    return set;
  }, [calendarEvts]);

  const pub = useMemo(() => {
    const visible = src.filter((v: any) => v.status !== "점검/청소중");
    const sorted = [...visible].sort((a, b) => {
      const ka = `${a.building}_${a.room}`;
      const kb = `${b.building}_${b.room}`;
      // 1순위: 계약중 → 맨 위
      const ca = contractSet.has(ka) ? 0 : 1;
      const cb = contractSet.has(kb) ? 0 : 1;
      if (ca !== cb) return ca - cb;
      // 2순위: 일반임대 → 앞으로
      const typeOrder: Record<string, number> = { "일반임대": 0, "근생": 1, "단기": 2 };
      const ta = typeOrder[a.type] ?? 3;
      const tb = typeOrder[b.type] ?? 3;
      if (ta !== tb) return ta - tb;
      // 3순위: 수동 순서
      if (vacancyOrder) {
        const orderMap: Record<string, number> = {};
        vacancyOrder.forEach((key: any, idx: any) => { orderMap[key] = idx; });
        const ia = orderMap[ka] ?? 9999;
        const ib = orderMap[kb] ?? 9999;
        return ia - ib;
      }
      return 0;
    });
    return sorted;
  }, [src, vacancyOrder, contractSet]);
  const filtered = vacancyFilter === "전체" ? pub
    : vacancyFilter === "계약중" ? pub.filter(v => contractSet.has(`${v.building}_${v.room}`))
    : pub.filter(v => v.type === vacancyFilter);
  const totalPages = Math.ceil(filtered.length / VACANCY_PER_PAGE);
  const pagedVacancies = filtered.slice(vacancyPage * VACANCY_PER_PAGE, (vacancyPage + 1) * VACANCY_PER_PAGE);

  // 순서 저장
  const saveVacancyOrder = (newList: any[]) => {
    const order = newList.map((v: any) => `${v.building}_${v.room}`);
    setVacancyOrder(order);
    localStorage.setItem("hm_vacancyOrder", JSON.stringify(order));
  };
  const moveVacancy = (idx: number, dir: number) => {
    const list = [...pub];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    saveVacancyOrder(list);
  };

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

  const scrollTo = useCallback((id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }, []);
  const getPhotos = (b: string, r: string) => (buildingData[b] || {})[`roomPhotos_${r}`] || [];
  const badgeColor = (t: string) => t === "단기" ? "#d4a853" : t === "근생" ? "#34c759" : "#0071e3";
  const navItems = [{ l: "소개", id: "about" }, { l: "서비스", id: "services" }, { l: "공실", id: "vacancy" }, { l: "사례", id: "cases" }, { l: "문의", id: "contact" }];

  // 관리자 편집 저장
  const saveEdit = (key: string, val: any) => {
    const next = { ...editContent, [key]: val };
    setEditContent(next); saveContent(next);
  };
  const EditableText = ({ field, defaultVal, tag: Tag = "p" as any, style = {} }: { field: string; defaultVal: any; tag?: any; style?: React.CSSProperties }) => {
    const val = editContent[field] ?? defaultVal;
    if (!editMode) return <Tag style={style}>{val}</Tag>;
    return <textarea value={val} onChange={e => saveEdit(field, e.target.value)}
      style={{ ...style, background: "rgba(0,113,227,0.05)", border: "2px dashed var(--clr-red)", borderRadius: 8, padding: 12, width: "100%", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", color: "inherit", resize: "vertical", minHeight: 60 }} />;
  };

  // ─── SERVICE DETAIL VIEW ───
  if (serviceDetail) {
    const s = serviceDetail;
    return (
      <div className="hm-page min-h-screen" style={{ background: "var(--clr-white)" }}>
        {/* 히어로 이미지 */}
        <div className={`relative ${isMobile ? 'h-[50vh]' : 'h-[60vh]'} overflow-hidden`}>
          <img src={s.heroImg} alt={s.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)" }} />
          <div className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'px-6 py-8' : 'px-20 py-[60px]'}`}>
            <div onClick={() => setServiceDetail(null)} className="inline-flex items-center gap-1.5 mb-4 cursor-pointer text-sm font-medium text-white/80 hover:text-white transition-colors">← 돌아가기</div>
            <p className="text-sm font-medium text-white/60 mb-2 tracking-[0.04em]">서비스안내</p>
            <h1 className={`${isMobile ? 'text-[32px]' : 'text-[52px]'} font-bold text-white tracking-tight m-0 leading-[1.1]`}>{s.title}</h1>
          </div>
        </div>
        {/* 본문 */}
        <div className={`max-w-[800px] mx-auto ${isMobile ? 'px-6 py-12' : 'px-6 py-20'}`}>
          <Reveal>
            <p className={`hm-body ${isMobile ? 'text-base' : 'text-[19px]'} leading-[1.8] mb-14`}>{s.detail}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className={`hm-headline ${isMobile ? 'text-2xl' : 'text-[32px]'} mb-8`} style={{ margin: "0 0 32px" }}>HOUSEMAN이 제공하는 관리</h2>
          </Reveal>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-5 mb-14`}>
            {s.features.map((f: any, i: number) => (
              <Reveal key={i} className="hm-reveal-scale" delay={i * 0.08}>
                <div className={`hm-svc-card ${isMobile ? 'p-6' : 'p-8'}`}>
                  <div className="text-sm font-bold mb-2 tracking-tight" style={{ color: "var(--clr-black)" }}>{f.t}</div>
                  <div className="hm-body text-sm">{f.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
          {/* CTA */}
          <Reveal>
            <div className={`rounded-3xl text-center ${isMobile ? 'px-6 py-8' : 'px-10 py-12'}`} style={{ background: "var(--clr-bg)" }}>
              <h3 className={`hm-headline ${isMobile ? 'text-[22px]' : 'text-[28px]'} mb-3`} style={{ margin: "0 0 12px" }}>당신의 건물, 하우스맨이 책임집니다.</h3>
              <p className="hm-body text-[15px] mb-7">표준화된 매뉴얼과 AI 기반 시스템으로 공실 없는 건물, 수익 중심의 운영을 실현합니다.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href={`tel:${SITE.phone}`} className="hm-btn hm-btn-filled">📞 {SITE.phone}</a>
                <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-btn px-8 py-3.5 rounded-full bg-[#fee500] text-[#1d1d1f] no-underline font-medium text-[17px]">💬 카카오톡 문의</a>
              </div>
            </div>
          </Reveal>
        </div>
        {/* 하단 고정 바 (모바일) */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-[100] flex gap-0 bg-white border-t px-4 py-2.5" style={{ borderColor: "var(--clr-border)", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
            <a href={`tel:${SITE.phone}`} className="flex-1 flex items-center justify-center gap-1.5 p-3.5 rounded-xl no-underline font-semibold text-[15px] text-white" style={{ background: "var(--clr-black)" }}>📞 전화</a>
            <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 p-3.5 rounded-xl bg-[#fee500] text-[#1d1d1f] no-underline font-semibold text-[15px] ml-2">💬 카카오톡</a>
          </div>
        )}
      </div>
    );
  }

  // ─── VACANCY DETAIL VIEW ───
  // 공실 카드 클릭 → 새 탭으로 상세 페이지 열기
  const openVacancyDetail = (v: any) => {
    if (editMode) return;
    const key = encodeURIComponent(`${v.building}_${v.room}`);
    window.open(`${window.location.pathname}?vacancy=${key}`, '_blank');
  };

  // URL 파라미터로 접근한 상세 페이지
  const urlVacancy = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('vacancy');
    if (!key) return null;
    const decoded = decodeURIComponent(key);
    const [building, room] = decoded.split('_');
    return pub.find((v: any) => v.building === building && String(v.room) === String(room))
      || src.find((v: any) => v.building === building && String(v.room) === String(room));
  }, [pub, src]);

  if (urlVacancy || detailRoom) {
    const v = urlVacancy || detailRoom;
    // 호실 기본정보 연동: roomMasterData + buildingData 병합
    const rmKey = `${v.building}_${v.room}`;
    const savedRoom = (buildingData[v.building] || {})[`room_${v.room}`] || {};
    const roomInfo = { ...(roomMasterData[rmKey] || {}), ...savedRoom };
    // 사진: buildingData 동적 사진 → roomMasterData 사진 → 빈 배열
    const photos = getPhotos(v.building, v.room).length > 0
      ? getPhotos(v.building, v.room)
      : roomInfo.photos || [];
    const idx = photoIdx < photos.length ? photoIdx : 0;
    const isContract = contractSet.has(`${v.building}_${v.room}`);
    const depositLabel = v.type === "단기" ? "예치금" : "보증금";
    // 금액: 공실 데이터 → roomInfo 기준금액 fallback
    const parseNum = (s: any) => { if (!s) return 0; const n = parseFloat(String(s).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
    const vDeposit = v.deposit || parseNum(roomInfo.deposit) / 10000;
    const vRent = v.rent || parseNum(roomInfo.rent) / 10000;
    const vMgmt = v.mgmt || parseNum(roomInfo.mgmt) / 10000;
    const vWater = parseNum(roomInfo.water);
    const vInternet = parseNum(roomInfo.internet);
    const vCleanFee = parseNum(roomInfo.cleanFee);
    const goBack = () => {
      if (urlVacancy) {
        window.close();
        // 새 탭에서 열린 경우 close 안 되면 홈으로
        setTimeout(() => { window.location.href = window.location.pathname; }, 100);
      } else {
        setDetailRoom(null);
      }
    };
    return (
      <div className="hm-page min-h-screen" style={{ background: "var(--clr-white)" }}>
        {/* 독립 헤더 */}
        <div className={`sticky top-0 z-10 backdrop-blur-[20px] border-b border-[#f0f0f0] ${isMobile ? 'px-5 py-3' : 'px-12 py-3.5'} flex items-center justify-between`} style={{ background: "rgba(255,255,255,0.95)" }}>
          <div className="flex items-center gap-2.5">
            <img src="/logo-c.svg" alt="HOUSEMAN" className="h-9 w-auto" />
            <span className="text-base font-extrabold tracking-tight" style={{ color: "var(--clr-black)" }}>HOUSEMAN</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={`tel:${SITE.phone}`} className="text-[13px] font-semibold no-underline" style={{ color: "var(--clr-red)" }}>{SITE.phone}</a>
            <div onClick={goBack} className="px-4 py-2 rounded-full cursor-pointer text-[13px] font-semibold" style={{ background: "var(--clr-bg)", color: "var(--clr-muted)" }}>
              {urlVacancy ? "전체 매물 보기" : "← 목록"}
            </div>
          </div>
        </div>

        <div className={`max-w-[800px] mx-auto ${isMobile ? 'px-5 pt-6 pb-[60px]' : 'px-5 pt-12 pb-20'}`}>
          {/* 사진 갤러리 */}
          <div className={`${isMobile ? 'aspect-[4/3]' : 'aspect-video'} overflow-hidden relative bg-[#f5f5f7] flex items-center justify-center mb-3`}>
            {photos.length ? <img src={photos[idx]} alt="" className="w-full h-full object-contain" /> :
              <div className="text-center" style={{ color: "var(--clr-light)" }}><div className="text-[64px]">🏢</div><div className="text-base mt-3">사진 준비중</div></div>}
            {photos.length > 1 && <>
              <div onClick={() => setPhotoIdx(idx > 0 ? idx - 1 : photos.length - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/85 flex items-center justify-center cursor-pointer text-lg text-[#1d1d1f] hover:bg-white transition-colors">‹</div>
              <div onClick={() => setPhotoIdx(idx < photos.length - 1 ? idx + 1 : 0)} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/85 flex items-center justify-center cursor-pointer text-lg text-[#1d1d1f] hover:bg-white transition-colors">›</div>
            </>}
            {photos.length > 1 && <div className="absolute bottom-3 right-3 text-xs font-semibold px-3 py-1 bg-black/60 text-white">{idx + 1} / {photos.length}</div>}
          </div>

          {/* 썸네일 */}
          {photos.length > 1 && (
            <div className="flex gap-1 mb-7 overflow-x-auto pb-1">
              {photos.map((p: any, pi: number) => (
                <div key={pi} onClick={() => setPhotoIdx(pi)} className="w-16 h-12 overflow-hidden cursor-pointer shrink-0 transition-all duration-200" style={{
                  border: pi === idx ? "2px solid #c41230" : "2px solid transparent",
                  opacity: pi === idx ? 1 : 0.5,
                }}>
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* 제목 + 배지 */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <h2 className={`${isMobile ? 'text-2xl' : 'text-[32px]'} font-extrabold m-0 text-[#111] tracking-tight`}>{v.building} {v.room}호</h2>
              <span className="text-xs font-bold px-3 py-1 text-white" style={{ background: badgeColor(v.type) }}>{v.type}</span>
              {isContract && <span className="text-xs font-bold px-3 py-1 bg-[#DC2626] text-white">계약중</span>}
            </div>
            {(roomInfo.roomType || roomInfo.area) && (
              <div className="text-sm text-gray-500">
                {roomInfo.roomType}{roomInfo.area ? ` · ${roomInfo.area}㎡` : ""}
              </div>
            )}
          </div>

          {/* 금액 테이블 */}
          <div className="mb-7 border border-gray-200">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-500 w-[30%]">{depositLabel}</td>
                  <td className="px-4 py-3 font-bold text-base">{fmt(vDeposit)}만원</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-500">월세</td>
                  <td className="px-4 py-3 font-bold text-base text-[#c41230]">{fmt(vRent)}만원</td>
                </tr>
                {vMgmt > 0 && <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-500">관리비</td>
                  <td className="px-4 py-3 font-semibold">{vMgmt}만원</td>
                </tr>}
                {vWater > 0 && <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-500">수도</td>
                  <td className="px-4 py-3 font-semibold">{vWater.toLocaleString()}원</td>
                </tr>}
                {vInternet > 0 && <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-500">인터넷</td>
                  <td className="px-4 py-3 font-semibold">{vInternet.toLocaleString()}원</td>
                </tr>}
                {vCleanFee > 0 && <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-500">퇴실청소비</td>
                  <td className="px-4 py-3 font-semibold">{vCleanFee.toLocaleString()}원</td>
                </tr>}
                {roomInfo.commFee && <tr>
                  <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-500">중개수수료</td>
                  <td className="px-4 py-3 font-semibold">{roomInfo.commFee}원</td>
                </tr>}
              </tbody>
            </table>
          </div>

          {/* 매물 상세 정보 */}
          {(roomInfo.roomType || roomInfo.area) && (
            <div className="mb-7">
              <h3 className="text-base font-bold text-[#111] mb-3 pb-2 border-b-2 border-[#111]">매물 정보</h3>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {roomInfo.roomType && <tr className="border-b border-gray-100">
                    <td className="py-2.5 text-gray-500 w-[30%]">방 형태</td>
                    <td className="py-2.5 font-semibold">{roomInfo.roomType}</td>
                  </tr>}
                  {roomInfo.area && <tr className="border-b border-gray-100">
                    <td className="py-2.5 text-gray-500">전용면적</td>
                    <td className="py-2.5 font-semibold">{roomInfo.area}㎡</td>
                  </tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* 특약사항 상단 */}
          {roomInfo.specialTerms && (
            <div className="mb-7">
              <h3 className="text-base font-bold text-[#111] mb-3 pb-2 border-b-2 border-[#111]">계약 안내사항</h3>
              <div className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">
                {roomInfo.specialTerms}
              </div>
            </div>
          )}

          {/* 특약사항 하단 */}
          {roomInfo.specialTermsBottom && (
            <div className="mb-7">
              <h3 className="text-base font-bold text-[#111] mb-3 pb-2 border-b-2 border-[#111]">추가 안내</h3>
              <div className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">
                {roomInfo.specialTermsBottom}
              </div>
            </div>
          )}

          {/* 문의 버튼 */}
          <div className="flex gap-3 mb-10">
            <a href={`tel:${SITE.phone}`} className="hm-btn hm-btn-dark flex-1 justify-center px-8 py-4 text-[17px]">📞 전화 문의</a>
            {isContract
              ? <div className="flex-1 flex items-center justify-center px-8 py-4 text-[17px] font-bold bg-gray-200 text-gray-400">계약 진행중</div>
              : <button onClick={() => { setContractStep("verify"); setContractPhone(""); setContractError(""); setContractBroker(null); }}
                className="flex-1 flex items-center justify-center px-8 py-4 text-[17px] font-bold font-[inherit] bg-[#c41230] text-white border-none cursor-pointer hover:bg-[#a80f28] transition-colors">계약하기</button>
            }

          {/* ── 부동산 인증 팝업 ── */}
          {contractStep === "verify" && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
              onClick={() => setContractStep(null)}>
              <div onClick={e => e.stopPropagation()} className={`bg-white p-8 ${isMobile ? 'w-[90%]' : 'w-[400px]'} max-w-[95%]`}>
                <div className="text-lg font-extrabold mb-2">등록부동산 확인</div>
                <div className="text-[13px] text-gray-500 mb-5">등록된 부동산만 계약을 진행할 수 있습니다.</div>
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-700 mb-1">부동산 연락처</div>
                  <input value={contractPhone} onChange={e => { setContractPhone(e.target.value); setContractError(""); }}
                    placeholder="02-0000-0000 또는 010-0000-0000"
                    className={`w-full px-4 py-3 text-[15px] font-[inherit] box-border ${contractError ? 'border-2 border-[#DC2626]' : 'border border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`} />
                  {contractError && <div className="text-xs text-[#DC2626] mt-1.5">{contractError}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const phone = contractPhone.trim();
                    if (!phone) { setContractError("연락처를 입력하세요"); return; }
                    // brokerList에서 확인 (useLocalStorage는 "pageData" 키 안에 저장)
                    let brokers = [];
                    try {
                      const pageData = JSON.parse(localStorage.getItem("pageData") || "{}");
                      brokers = pageData["hm_brokerList"] || [];
                    } catch {}
                    const normalize = (p: any) => (p || "").replace(/[-\s()]/g, "");
                    const matched = brokers.find((b: any) => normalize(b.phone) === normalize(phone));
                    if (!matched) { setContractError("등록되지 않은 부동산입니다. HOUSEMAN에 문의하세요."); return; }
                    setContractBroker(matched);
                    // 폼 초기값 설정
                    const now = new Date();
                    const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
                    const fmtD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    const isDangi = v.type === "단기";
                    const defaultMoveIn = isDangi ? fmtD(addDays(now, 5)) : fmtD(addDays(now, 14));
                    const calcContractDeposit = Math.ceil(vRent * 7 / 30 / 10) * 10; // 월세 7일치, 10만원 단위 올림
                    setContractForm({
                      broker: matched.name, brokerPhone: matched.phone,
                      deposit: vDeposit, rent: vRent, mgmt: vMgmt,
                      nego: vRent, moveIn: defaultMoveIn, expiry: "",
                      water: roomInfo.water || "", cable: roomInfo.internet || "",
                      exitFee: roomInfo.cleanFee || "",
                      contractDeposit: calcContractDeposit, depositor: "",
                    });
                    setContractStep("form");
                  }} className="flex-1 p-3 bg-[#111] text-white border-none text-[15px] font-bold cursor-pointer font-[inherit] hover:bg-[#333] transition-colors">확인</button>
                  <button onClick={() => setContractStep(null)} className="px-6 py-3 bg-gray-100 border-none text-[15px] font-semibold cursor-pointer font-[inherit] text-gray-500 hover:bg-gray-200 transition-colors">취소</button>
                </div>
              </div>
            </div>
          )}

          {/* ── 계약 등록 폼 ── */}
          {contractStep === "form" && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center overflow-y-auto"
              onClick={() => setContractStep(null)}>
              <div onClick={e => e.stopPropagation()} className={`bg-white ${isMobile ? 'p-6 w-[95%]' : 'p-8 w-[520px]'} max-w-[95%] max-h-[90vh] overflow-y-auto my-5`}>
                <div className="text-lg font-extrabold mb-1">계약 등록</div>
                <div className="text-[13px] text-gray-500 mb-5">{v.building} {v.room}호 · {v.type}</div>

                {/* 부동산 정보 (수정 가능) */}
                <div className="p-3.5 bg-sky-50 border border-sky-200 mb-4">
                  <div className="text-xs font-bold text-sky-700 mb-1">부동산 정보</div>
                  <div className="text-[11px] text-gray-500 mb-2">부동산명과 처리담당자가 다른 경우 수정해주세요.</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="text-[10px] text-sky-700 mb-0.5">부동산명</div>
                      <input value={contractForm.broker || ""} onChange={e => setContractForm(p => ({ ...p, broker: e.target.value }))}
                        className="w-full px-2.5 py-[7px] border border-sky-200 text-[13px] font-[inherit] box-border bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors" />
                    </div>
                    <div>
                      <div className="text-[10px] text-sky-700 mb-0.5">연락처</div>
                      <input value={contractForm.brokerPhone || ""} onChange={e => setContractForm(p => ({ ...p, brokerPhone: e.target.value }))}
                        className="w-full px-2.5 py-[7px] border border-sky-200 text-[13px] font-[inherit] box-border bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* 금액 */}
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">{depositLabel} (만원)</div>
                    <input type="number" value={contractForm.deposit ?? ""} onChange={e => setContractForm(p => ({ ...p, deposit: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">월세 (만원)</div>
                    <input type="number" value={contractForm.rent ?? ""} onChange={e => setContractForm(p => ({ ...p, rent: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">관리비 (만원)</div>
                    <input type="number" value={contractForm.mgmt ?? ""} onChange={e => setContractForm(p => ({ ...p, mgmt: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                </div>

                {/* 입주일/만기일 */}
                <div className={`grid ${v.type === "단기" ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-2'} gap-2.5 mb-1 items-start`}>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">입주일 *</div>
                    <input type="date" value={contractForm.moveIn || ""}
                      max={v.type === "단기" ? (() => { const d = new Date(); d.setDate(d.getDate() + 5); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })() : undefined}
                      min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })()}
                      onChange={e => setContractForm(p => ({ ...p, moveIn: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  {v.type === "단기" && (
                    <button onClick={() => {
                      if (!contractForm.moveIn) return;
                      const d = new Date(contractForm.moveIn);
                      d.setMonth(d.getMonth() + 3);
                      d.setDate(d.getDate() - 1);
                      const exp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                      setContractForm(p => ({ ...p, expiry: exp }));
                    }} className="px-3.5 py-2 border border-blue-500 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap mt-[18px] hover:bg-blue-100 transition-colors">3개월</button>
                  )}
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">만기일</div>
                    <input type="date" value={contractForm.expiry || ""} onChange={e => setContractForm(p => ({ ...p, expiry: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                </div>
                {v.type === "단기" && <div className="text-[10px] text-amber-500 mb-3">단기: 오늘로부터 5일 이내 입주</div>}

                {/* 단기 전용 */}
                {v.type === "단기" && (
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">수도</div>
                      <input value={contractForm.water ?? ""} onChange={e => setContractForm(p => ({ ...p, water: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">인터넷</div>
                      <input value={contractForm.cable ?? ""} onChange={e => setContractForm(p => ({ ...p, cable: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">퇴실청소비</div>
                      <input value={contractForm.exitFee ?? ""} onChange={e => setContractForm(p => ({ ...p, exitFee: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                  </div>
                )}

                {/* 계약금 + 입금자명 */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">계약금 (만원)</div>
                    <input type="number" value={contractForm.contractDeposit ?? ""} onChange={e => setContractForm(p => ({ ...p, contractDeposit: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-[3px]">입금자명</div>
                    <input value={contractForm.depositor || ""} onChange={e => setContractForm(p => ({ ...p, depositor: e.target.value }))}
                      placeholder="입금자명"
                      className="w-full px-2.5 py-2 border border-gray-300 text-[13px] font-[inherit] box-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                </div>

                {/* 입주금 계산 + 계좌 */}
                {(() => {
                  const defaultHmAcct = "하나은행 225-910048-15704 박종호(하우스맨)";
                  let acctMode = "houseman";
                  let hmAcct = defaultHmAcct;
                  let ownerAcct = "";
                  try {
                    const appData = JSON.parse(localStorage.getItem("appData") || "{}");
                    const accts = appData["hm_buildingAccounts"] || {};
                    const roomKey = `${v.building}_${v.room}`;
                    const bldgRaw = accts[v.building] || {};
                    const roomOverride = accts[roomKey];
                    const eff = roomOverride || { mode: bldgRaw.mode1 || "", housemanAccount: bldgRaw.housemanAccount1 || defaultHmAcct, ownerAccounts: bldgRaw.ownerAccounts1 || {} };
                    if (eff.mode) acctMode = eff.mode;
                    if (eff.housemanAccount) hmAcct = eff.housemanAccount;
                    const oa = eff.ownerAccounts || {};
                    if (oa.rent_bank || oa.rent) ownerAcct = `${oa.rent_bank || ""} ${oa.rent || ""}${oa.rent_holder ? ` (${oa.rent_holder})` : ""}`.trim();
                  } catch {}

                  const dep = (Number(contractForm.deposit) || 0) * 10000;
                  const rent = (Number(contractForm.rent) || 0) * 10000;
                  const mgmt = (Number(contractForm.mgmt) || 0) * 10000;
                  const water = parseNum(contractForm.water);
                  const cable = parseNum(contractForm.cable);
                  const isDangi = v.type === "단기";

                  if (!isDangi) {
                    // 근생/일반임대: 계좌만 표시
                    return (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 mb-4">
                        <div className="text-xs font-bold text-amber-800 mb-1">입금 계좌</div>
                        <div className="text-sm font-bold text-[#111] font-mono">{ownerAcct || hmAcct}</div>
                      </div>
                    );
                  }

                  // 단기: 모드별 입주금 계산
                  const fmtA = (n: number) => n >= 10000 ? `${(n/10000)}만` : n > 0 ? `${n.toLocaleString()}원` : "-";
                  const allItems = [
                    { l: "예치금", v: dep }, { l: "임대료", v: rent }, { l: "관리비", v: mgmt },
                    { l: "수도", v: water }, { l: "인터넷", v: cable },
                  ].filter(x => x.v > 0);
                  const total = allItems.reduce((a, x) => a + x.v, 0);

                  // 계좌별 항목 분배
                  let rows: { l: string; v: number; acct: string }[] = []; // { l, v, acct: "owner"|"hm"|"deferred" }
                  let desc = "";
                  if (acctMode === "houseman" || !acctMode) {
                    desc = "전체 → 하우스맨계좌";
                    rows = allItems.map(x => ({ ...x, acct: "hm" }));
                  } else if (acctMode === "hm_owner1") {
                    desc = "전체 → 건물주계좌";
                    rows = allItems.map(x => ({ ...x, acct: "owner" }));
                  } else if (acctMode === "owner1") {
                    desc = "예치금+임대료→건물주 / 관리비+공과금→하우스맨";
                    const ownerSet = new Set(["예치금", "임대료"]);
                    rows = allItems.map(x => ({ ...x, acct: ownerSet.has(x.l) ? "owner" : "hm" }));
                  } else if (acctMode === "owner2") {
                    desc = "예치금+임대료+관리비→건물주 / 수도+인터넷→하우스맨";
                    const ownerSet = new Set(["예치금", "임대료", "관리비"]);
                    rows = allItems.map(x => ({ ...x, acct: ownerSet.has(x.l) ? "owner" : "hm" }));
                  } else if (acctMode === "owner3") {
                    desc = "예치금+임대료+관리비→건물주 / 수도+인터넷 후불";
                    const ownerSet = new Set(["예치금", "임대료", "관리비"]);
                    rows = allItems.map(x => ({ ...x, acct: ownerSet.has(x.l) ? "owner" : "deferred" }));
                  }

                  const ownerRows = rows.filter(r => r.acct === "owner");
                  const hmRows = rows.filter(r => r.acct === "hm");
                  const defRows = rows.filter(r => r.acct === "deferred");
                  const ownerTotal = ownerRows.reduce((a, x) => a + x.v, 0);
                  const hmTotal = hmRows.reduce((a, x) => a + x.v, 0);
                  const payTotal = acctMode === "owner3" ? ownerTotal : total;

                  const acctColor: Record<string, string> = { owner: "#EA580C", hm: "#2563EB", deferred: "#92400E" };

                  return (
                    <div className="mb-4 border border-gray-300 overflow-hidden">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#111]">
                            <th colSpan={3} className="px-3 py-2 text-white text-xs font-bold text-left">입주금 안내 <span className="font-normal text-[10px] text-gray-400 ml-2">{desc}</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, i) => (
                            <tr key={i} className="border-b border-gray-200">
                              <td className="px-3 py-1.5 w-2"><div className="w-2 h-2 rounded-full" style={{ background: acctColor[r.acct] }} /></td>
                              <td className="px-1 py-1.5 text-gray-700">{r.l}</td>
                              <td className="px-3 py-1.5 text-right font-bold font-mono">{fmtA(r.v)}</td>
                            </tr>
                          ))}
                          {/* 계좌별 소계 */}
                          {ownerRows.length > 0 && (
                            <tr className="bg-orange-50 border-b border-gray-200">
                              <td className="px-3 py-1.5"><div className="w-2 h-2 rounded-full bg-[#EA580C]" /></td>
                              <td className="px-1 py-1.5 text-[11px]"><span className="font-bold text-[#EA580C]">건물주</span> <span className="text-gray-400 text-[10px]">{ownerAcct || "미설정"}</span></td>
                              <td className="px-3 py-1.5 text-right font-bold text-[#EA580C] font-mono">{fmtA(ownerTotal)}</td>
                            </tr>
                          )}
                          {hmRows.length > 0 && (
                            <tr className="bg-blue-50 border-b border-gray-200">
                              <td className="px-3 py-1.5"><div className="w-2 h-2 rounded-full bg-[#2563EB]" /></td>
                              <td className="px-1 py-1.5 text-[11px]"><span className="font-bold text-[#2563EB]">하우스맨</span> <span className="text-gray-400 text-[10px]">{hmAcct}</span></td>
                              <td className="px-3 py-1.5 text-right font-bold text-[#2563EB] font-mono">{fmtA(hmTotal)}</td>
                            </tr>
                          )}
                          {defRows.length > 0 && (
                            <tr className="bg-amber-50 border-b border-gray-200">
                              <td className="px-3 py-1.5"><div className="w-2 h-2 rounded-full bg-[#92400E]" /></td>
                              <td className="px-1 py-1.5 text-[11px] text-[#92400E] font-semibold">후불 (퇴실정산)</td>
                              <td className="px-3 py-1.5 text-right font-semibold text-[#92400E] font-mono">{fmtA(defRows.reduce((a, x) => a + x.v, 0))}</td>
                            </tr>
                          )}
                          {/* 합계 */}
                          <tr className="bg-gray-100">
                            <td colSpan={2} className="px-3 py-2 font-extrabold text-[13px] text-[#111]">입주금 합계</td>
                            <td className="px-3 py-2 text-right font-extrabold text-sm text-[#111] font-mono">{fmtA(payTotal)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* 등록 버튼 */}
                <div className="flex gap-2 mt-5">
                  <button onClick={() => {
                    if (!contractForm.moveIn) { alert("입주일을 선택하세요"); return; }
                    // 중복 계약 방지
                    const existingEvts = calendarEvts.length > 0 ? calendarEvts : (() => {
                      try { const ad = JSON.parse(localStorage.getItem("appData") || "{}"); return ad["hm_calendarEvts"] || []; } catch { return []; }
                    })();
                    const duplicate = existingEvts.find((e: any) => e.type === "계약" && e.building === v.building && String(e.room) === String(v.room));
                    if (duplicate) { alert(`${v.building} ${v.room}호는 이미 계약이 등록되어 있습니다.`); return; }
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
                    const registeredAt = `${todayStr} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
                    const newEvt = {
                      date: contractForm.moveIn, type: "계약",
                      building: v.building, room: v.room, name: "",
                      color: "#3B82F6", registeredAt, registeredBy: contractForm.broker,
                      registeredSource: "broker", // 부동산 등록 구분
                      contractDate: todayStr,
                      deposit: Number(contractForm.deposit) || 0,
                      rent: Number(contractForm.rent) || 0,
                      nego: Number(contractForm.rent) || 0,
                      mgmt: Number(contractForm.mgmt) || 0,
                      broker: contractForm.broker, brokerPhone: contractForm.brokerPhone,
                      moveIn: contractForm.moveIn, expiry: contractForm.expiry || "",
                      contractDeposit: Number(contractForm.contractDeposit) || 0,
                      depositor: contractForm.depositor || "",
                      ...(v.type === "단기" ? {
                        water: contractForm.water, cable: contractForm.cable,
                        exitFee: Number(contractForm.exitFee) || 0,
                      } : {}),
                    };
                    // React state로 저장 (같은 앱 내) 또는 localStorage (새 탭)
                    if (setCalendarEvts) {
                      setCalendarEvts(prev => [...prev, newEvt]);
                    } else {
                      try {
                        const appData = JSON.parse(localStorage.getItem("appData") || "{}");
                        const evts = appData["hm_calendarEvts"] || [];
                        evts.push(newEvt);
                        appData["hm_calendarEvts"] = evts;
                        localStorage.setItem("appData", JSON.stringify(appData));
                      } catch {}
                    }
                    setContractStep(null);
                    alert("계약이 등록되었습니다. HOUSEMAN에서 확인 후 연락드리겠습니다.");
                  }} className="flex-1 p-3.5 bg-[#c41230] text-white border-none text-base font-extrabold cursor-pointer font-[inherit] hover:bg-[#a80f28] transition-colors">계약 등록</button>
                  <button onClick={() => setContractStep(null)} className="px-6 py-3.5 bg-gray-100 border-none text-[15px] font-semibold cursor-pointer font-[inherit] text-gray-500 hover:bg-gray-200 transition-colors">취소</button>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* 회사 정보 */}
          <div className="px-6 py-5 bg-gray-50 border border-gray-200 text-[13px] text-gray-500 leading-[1.8]">
            <div className="font-bold text-[#111] mb-1 text-sm">HOUSEMAN 하우스맨</div>
            <div>{SITE.phone} | {SITE.address}</div>
            <div>사업자등록번호: {SITE.bizNo}</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN PAGE ───
  return (
    <div className="hm-page overflow-x-hidden" style={{ background: "var(--clr-white)" }}>

      {/* ═══ NAV ═══ */}
      <nav className={`hm-nav${scrolled ? " scrolled" : ""} ${isMobile ? 'px-5 py-3.5' : 'px-12 py-3.5'} flex items-center justify-between`}>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo-c.svg" alt="HOUSEMAN" className={`${isMobile ? 'h-11' : 'h-[54px]'} w-auto transition-[filter] duration-[0.4s]`} style={{ filter: scrolled ? "none" : "brightness(0) invert(1)" }} />
          {isMobile && (
            <div className="transition-colors duration-[0.4s]">
              <div className="text-[13px] font-extrabold tracking-tight leading-tight" style={{ color: scrolled ? "var(--clr-black)" : "#fff" }}>HOUSEMAN</div>
              <div className="text-[9px] leading-[1.3]" style={{ color: scrolled ? "var(--clr-muted)" : "rgba(255,255,255,0.7)" }}>중소형 빌딩 관리<br/>임대 주택 관리</div>
            </div>
          )}
        </div>
        {isMobile ? (
          <div onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 flex items-center justify-center cursor-pointer text-2xl transition-colors duration-[0.4s]" style={{ color: scrolled ? "var(--clr-black)" : "#fff" }}>{menuOpen ? "✕" : "☰"}</div>
        ) : (
          <div className="flex items-center gap-8">
            {navItems.map(n => <span key={n.id} className="hm-nav-link" onClick={() => scrollTo(n.id)} style={{ color: scrolled ? "var(--clr-muted)" : "rgba(255,255,255,0.8)" }}>{n.l}</span>)}
            <a href={`tel:${SITE.phone}`} className="hm-btn px-6 py-2.5 text-sm rounded-full font-semibold no-underline" style={{ background: scrolled ? "var(--clr-red)" : "#fff", color: scrolled ? "#fff" : "var(--clr-black)" }}>{SITE.phone}</a>
          </div>
        )}
      </nav>
      {menuOpen && isMobile && (
        <div className="fixed inset-0 top-12 bg-[rgba(250,250,250,0.97)] backdrop-blur-[40px] z-[99] px-8 pt-[60px] flex flex-col gap-8">
          {navItems.map(n => <span key={n.id} onClick={() => scrollTo(n.id)} className="text-[32px] font-bold cursor-pointer tracking-tight" style={{ color: "var(--clr-black)" }}>{n.l}</span>)}
          <a href={`tel:${SITE.phone}`} className="hm-btn hm-btn-filled mt-4 justify-center text-xl p-[18px]">{SITE.phone}</a>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className={`relative ${isMobile ? 'h-[60vh]' : 'h-screen'} overflow-hidden`}>
        {/* 배경 이미지 — 크로스페이드 + 줌 */}
        {["/hero1.jpg", "/hero2.jpg"].map((img, i) => (
          <div key={i} className={`hm-hero-slide ${heroIdx === i ? "active" : "inactive"}`}
            style={{ backgroundImage: `url(${img})` }} />
        ))}
        {/* 그라데이션 오버레이 */}
        <div className="hm-hero-overlay" />

        {/* 콘텐츠 */}
        <div className={`relative z-[1] h-full flex ${isMobile ? 'items-end px-6 pb-[100px]' : 'items-center px-20'} max-w-[1200px] mx-auto`}>
          <div className="max-w-[600px]">
            <Reveal delay={0.2}>
              <p className="text-sm font-medium text-white/70 mb-4 tracking-[0.04em]">15년 경험 · 서울 100여 건물 관리</p>
            </Reveal>
            <Reveal delay={0.35}>
              <h1 className={`${isMobile ? 'text-4xl' : 'text-[60px]'} font-bold text-white leading-[1.1] tracking-tight mb-5`} style={{ margin: "0 0 20px" }}>
                건물 운영의 격을<br/>다르게 합니다
              </h1>
            </Reveal>
            <Reveal delay={0.5}>
              <p className={`${isMobile ? 'text-[15px] mb-12' : 'text-lg mb-8'} text-white/75 leading-relaxed max-w-[460px] tracking-tight`}>
                현실을 아는 운영, 숫자로 증명되는 결과.
              </p>
            </Reveal>
            <Reveal delay={0.6}>
              <div className="flex gap-3 flex-wrap">
                <a href={`tel:${SITE.phone}`} className={`hm-btn hm-btn-filled ${isMobile ? 'text-[15px]' : 'text-[17px]'}`}>관리 문의</a>
                <span onClick={() => scrollTo("vacancy")} className={`hm-btn hm-btn-outline ${isMobile ? 'text-[15px]' : 'text-[17px]'} cursor-pointer text-white`} style={{ borderColor: "rgba(255,255,255,0.4)" }}>공실 확인하기</span>
              </div>
            </Reveal>
          </div>
        </div>

        {/* 히어로 인디케이터 */}
        <div className={`absolute ${isMobile ? 'bottom-8 right-6' : 'bottom-12 right-20'} z-[2] flex gap-2`}>
          {[0, 1].map(i => (
            <div key={i} onClick={() => setHeroIdx(i)}
              className={`hm-hero-indicator${heroIdx === i ? " active" : ""}`} />
          ))}
        </div>
      </section>

      {/* ═══ STATS STRIP ═══ */}
      <section className={`${isMobile ? 'px-6 py-12' : 'px-12 py-[72px]'} border-b`} style={{ borderColor: "var(--clr-border)" }}>
        <div className={`max-w-[1000px] mx-auto grid ${isMobile ? 'grid-cols-2 gap-8' : 'grid-cols-4 gap-12'} text-center`}>
          {[{ n: 15, s: "년+", l: "운영 경험" }, { n: 100, s: "+", l: "관리 건물" }, { n: 800, s: "+", l: "중개 네트워크" }, { n: 98, s: "%", l: "입주율" }].map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className={`hm-stat-num ${isMobile ? 'text-4xl' : 'text-[52px]'}`}><CountUp end={s.n} suffix={s.s} /></div>
              <div className="hm-stat-label">{s.l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ ABOUT — 분할 레이아웃 ═══ */}
      <section id="about" className="relative overflow-hidden">
        <div className={`${isMobile ? 'block' : 'grid grid-cols-2'} ${isMobile ? 'min-h-0' : 'min-h-[80vh]'}`}>
          {/* 좌측: 흰색 텍스트 영역 */}
          <div className={`${isMobile ? 'px-6 py-16' : 'px-[60px] py-20'} flex flex-col justify-center bg-white`}>
            <Reveal>
              <p className="hm-eyebrow mb-5">About Houseman</p>
              <div className="relative inline-block mb-7">
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
          <div className={`relative bg-[#c41230] ${isMobile ? 'min-h-[300px]' : 'min-h-0'} flex items-center justify-center`}>
            <Reveal className="hm-reveal-scale" delay={0.2}>
              <div className={`relative ${isMobile ? 'm-10 mx-6' : 'm-10'} overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]`} style={{ marginLeft: isMobile ? 24 : -40, aspectRatio: isMobile ? "4/3" : "3/4", maxHeight: isMobile ? 300 : 500 }}>
                <img src="/about-img.jpg" alt="하우스맨" className="w-full h-full object-cover block" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className={`hm-section-gray ${isMobile ? 'px-6 py-20' : 'px-12 py-[120px]'}`}>
        <div className={`max-w-[1000px] mx-auto grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} gap-5`}>
          {[
            { icon: "📊", t: "투명한 정산", d: "실시간 보고 체계와 월간 리포트" },
            { icon: "🔧", t: "원스톱 관리", d: "민원·시설·행정 모든 것을 일괄 처리" },
            { icon: "🤝", t: "중개 네트워크", d: "800여 부동산과 연계한 공실 해소" },
            { icon: "⚡", t: "15년 현장 경험", d: "실전에서 검증된 운영 노하우" },
          ].map((item, i) => (
            <Reveal key={i} className="hm-reveal-scale" delay={i * 0.08}>
              <div className={`hm-svc-card ${isMobile ? 'p-6' : 'p-8'}`}>
                <div className="hm-svc-icon mb-4">{item.icon}</div>
                <div className="text-[17px] font-bold mb-1.5 tracking-tight" style={{ color: "var(--clr-black)" }}>{item.t}</div>
                <div className="hm-body text-sm">{item.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ HIGHLIGHT BANNER ═══ */}
      <section className={`relative ${isMobile ? 'px-6 py-20' : 'px-12 py-[120px]'} overflow-hidden`}>
        <div className="hm-hero-bg" /><div className="hm-hero-grid" />
        <div className="max-w-[700px] mx-auto text-center relative z-[1]">
          <Reveal>
            <h2 className={`hm-headline ${isMobile ? 'text-[26px]' : 'text-[40px]'} mb-4`} style={{ margin: "0 0 16px" }}>하우스맨은 중개보수를<br/>쉐어하지 않습니다.</h2>
            <p className={`hm-body ${isMobile ? 'text-base' : 'text-xl'}`}>그래서 더 많은 중개사가 움직이고,<br/>공실은 더 빨리 사라집니다.</p>
          </Reveal>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section id="services" className={`${isMobile ? 'px-6 py-20' : 'px-12 py-[140px]'}`}>
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <p className="hm-eyebrow mb-4">Services</p>
            <h2 className={`hm-headline ${isMobile ? 'text-[30px]' : 'text-[44px]'} mb-14`} style={{ margin: "0 0 56px" }}>맞춤형 관리 서비스</h2>
          </Reveal>
          <div className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-10'}`}>
            {SERVICES.map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div onClick={() => setServiceDetail(s)} className={`${isMobile ? 'block' : 'grid grid-cols-2'} items-center rounded-[28px] overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`} style={{
                  gap: isMobile ? 20 : 48,
                  background: "var(--clr-bg)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
                  <div className="overflow-hidden" style={{ order: isMobile ? 0 : (i % 2 === 0 ? 0 : 1), aspectRatio: isMobile ? "16/9" : "4/3" }}>
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover block transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "none"} />
                  </div>
                  <div className={`${isMobile ? 'px-6 py-7' : 'px-10 py-12'}`} style={{ order: isMobile ? 1 : (i % 2 === 0 ? 1 : 0) }}>
                    <div className="text-[32px] mb-4">{s.icon}</div>
                    <h3 className={`hm-headline ${isMobile ? 'text-[22px]' : 'text-[28px]'} mb-3`} style={{ margin: "0 0 12px" }}>{s.title}</h3>
                    <p className={`hm-body ${isMobile ? 'text-sm' : 'text-base'}`}>{s.desc}</p>
                    <span className="inline-block mt-4 text-sm font-medium" style={{ color: "var(--clr-red)" }}>자세히 보기 →</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VACANCY ═══ */}
      <section id="vacancy" className={`hm-section-gray ${isMobile ? 'px-6 py-20' : 'px-12 py-[140px]'}`}>
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <p className="hm-eyebrow mb-4">Vacancy</p>
            <h2 className={`hm-headline ${isMobile ? 'text-[30px]' : 'text-[44px]'} mb-2`} style={{ margin: "0 0 8px" }}>공실 현황</h2>
            <p className="hm-body text-[17px] mb-9">현재 입주 가능한 <span className="font-semibold" style={{ color: "var(--clr-red)" }}>{pub.length}개</span> 매물</p>
          </Reveal>
          <div className="flex gap-2 mb-8 flex-wrap">
            {["전체", "단기", "일반임대", "근생", "계약중"].map(t => {
              const cnt = t === "전체" ? pub.length
                : t === "계약중" ? pub.filter(v => contractSet.has(`${v.building}_${v.room}`)).length
                : pub.filter(v => v.type === t).length;
              if (t !== "전체" && cnt === 0) return null;
              const isContract = t === "계약중";
              return <button key={t} onClick={() => { setVacancyFilter(t); setVacancyPage(0); }} className="rounded-full border-none cursor-pointer font-[inherit] font-medium text-sm tracking-tight transition-all duration-300" style={{
                padding: "10px 24px",
                background: vacancyFilter === t ? (isContract ? "#DC2626" : "var(--clr-black)") : "#fff",
                color: vacancyFilter === t ? "#fff" : isContract ? "#DC2626" : "var(--clr-muted)",
                boxShadow: vacancyFilter !== t ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
              }}>{t} ({cnt})</button>;
            })}
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
            {pagedVacancies.map((v, i) => {
              const photos = getPhotos(v.building, v.room);
              const globalIdx = pub.findIndex(p => p.building === v.building && p.room === v.room);
              const _rmKey = `${v.building}_${v.room}`;
              const _savedRoom = (buildingData[v.building] || {})[`room_${v.room}`] || {};
              const _roomInfo = { ...(roomMasterData[_rmKey] || {}), ..._savedRoom };
              const _pn = (s: any) => { if (!s) return 0; const n = parseFloat(String(s).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
              const _dep = v.deposit || _pn(_roomInfo.deposit) / 10000;
              const _rent = v.rent || _pn(_roomInfo.rent) / 10000;
              const _mgmt = v.mgmt || _pn(_roomInfo.mgmt) / 10000;
              const _water = _pn(_roomInfo.water) / 10000;
              const _internet = _pn(_roomInfo.internet) / 10000;
              const isContracted = contractSet.has(`${v.building}_${v.room}`);
              return (
                <Reveal key={`${v.building}_${v.room}`} className="hm-reveal-scale" delay={i * 0.04}>
                  <div onClick={() => openVacancyDetail(v)} className="relative cursor-pointer overflow-hidden bg-white border border-gray-200 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <div className="aspect-[4/3] bg-[#f5f5f7] flex items-center justify-center relative overflow-hidden">
                      {photos.length > 0 ? <img src={photos[0]} alt="" className="w-full h-full object-cover" /> :
                        <span className="text-[40px] opacity-25">🏢</span>}
                      {/* 상단 배지 */}
                      <div className="absolute top-0 left-0 right-0 px-3 py-2.5 flex gap-1.5" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)" }}>
                        <span className="text-[11px] font-bold px-2.5 py-[3px] text-white" style={{ background: badgeColor(v.type) }}>{v.type}</span>
                        {isContracted && <span className="text-[11px] font-bold px-2.5 py-[3px] bg-[#DC2626] text-white">계약중</span>}
                      </div>
                      {photos.length > 1 && <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-[3px] bg-black/60 text-white">{photos.length}</span>}
                    </div>
                    <div className="px-4 py-3.5">
                      <div className="text-[15px] font-bold text-[#111] tracking-tight mb-1.5">
                        {v.building} {v.room}호
                        {_roomInfo.roomType && <span className="text-[11px] font-medium text-gray-400 ml-1.5">{_roomInfo.roomType}{_roomInfo.area ? ` ${_roomInfo.area}㎡` : ""}</span>}
                      </div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-[11px] text-gray-400">{v.type === "단기" ? "예치금" : "보증금"}</span>
                        <span className="text-[15px] font-extrabold text-[#111]">{fmt(_dep)}</span>
                        <span className="text-[11px] text-gray-400 mx-0.5">/</span>
                        <span className="text-[11px] text-gray-400">월세</span>
                        <span className="text-[15px] font-extrabold text-[#c41230]">{fmt(_rent)}</span>
                        <span className="text-[11px] text-gray-400">만</span>
                      </div>
                      {(_mgmt > 0 || _water > 0 || _internet > 0) && (
                        <div className="text-[11px] text-gray-400 flex gap-2">
                          {_mgmt > 0 && <span>관리비 {_mgmt}만</span>}
                          {_water > 0 && <span>수도 {_water > 1 ? _water + "만" : (_water * 10000).toLocaleString() + "원"}</span>}
                          {_internet > 0 && <span>인터넷 {_internet > 1 ? _internet + "만" : (_internet * 10000).toLocaleString() + "원"}</span>}
                        </div>
                      )}
                    </div>
                    {editMode && (
                      <div className="absolute top-2 right-2 flex gap-1 z-[5]" onClick={e => e.stopPropagation()}>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 bg-black/70 text-white">{globalIdx + 1}</span>
                        <button onClick={() => moveVacancy(globalIdx, -1)} className="w-[26px] h-[26px] border-none bg-black/70 text-white cursor-pointer text-[13px] font-extrabold hover:bg-black/90 transition-colors">↑</button>
                        <button onClick={() => moveVacancy(globalIdx, 1)} className="w-[26px] h-[26px] border-none bg-black/70 text-white cursor-pointer text-[13px] font-extrabold hover:bg-black/90 transition-colors">↓</button>
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button onClick={() => setVacancyPage(p => Math.max(0, p - 1))} disabled={vacancyPage === 0}
                className={`px-5 py-2.5 rounded-full border-none text-sm font-semibold ${vacancyPage === 0 ? 'bg-gray-200 text-gray-400 cursor-default' : 'cursor-pointer text-white'}`} style={{ background: vacancyPage === 0 ? undefined : "var(--clr-black)" }}>이전</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setVacancyPage(i)}
                  className={`w-9 h-9 rounded-full border-none cursor-pointer text-sm font-bold ${vacancyPage === i ? 'text-white' : ''}`} style={{ background: vacancyPage === i ? "var(--clr-red)" : "transparent", color: vacancyPage === i ? "#fff" : "var(--clr-muted)" }}>{i + 1}</button>
              ))}
              <button onClick={() => setVacancyPage(p => Math.min(totalPages - 1, p + 1))} disabled={vacancyPage === totalPages - 1}
                className={`px-5 py-2.5 rounded-full border-none text-sm font-semibold ${vacancyPage === totalPages - 1 ? 'bg-gray-200 text-gray-400 cursor-default' : 'cursor-pointer text-white'}`} style={{ background: vacancyPage === totalPages - 1 ? undefined : "var(--clr-black)" }}>다음</button>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="text-center mt-4 text-[13px]" style={{ color: "var(--clr-light)" }}>
              {vacancyPage * VACANCY_PER_PAGE + 1}~{Math.min((vacancyPage + 1) * VACANCY_PER_PAGE, filtered.length)} / 총 {filtered.length}개
            </div>
          )}
        </div>
      </section>

      {/* ═══ CASES ═══ */}
      <section id="cases" className={`${isMobile ? 'px-6 py-20' : 'px-12 py-[140px]'}`}>
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <p className="hm-eyebrow mb-4">Case Studies</p>
            <h2 className={`hm-headline ${isMobile ? 'text-[30px]' : 'text-[44px]'} mb-12`} style={{ margin: "0 0 48px" }}>관리 사례</h2>
          </Reveal>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-5`}>
            {[
              { title: "신축 원룸 공실률 0% 달성", excerpt: "관악구 12세대 건물을 3개월 만에 만실로 전환한 운영 전략", date: "2026.03", tag: "공실 관리", img: "/sub-vs-0.jpg" },
              { title: "상가 임대료 15% 인상 성공", excerpt: "을지로 상가 건물의 체계적 관리로 임차인 만족과 임대료 인상 동시 달성", date: "2026.02", tag: "빌딩 관리", img: "/sub-vs-1.jpg" },
              { title: "단기임대 전환 수익 40%↑", excerpt: "장기→단기 전환으로 월 수익을 40% 이상 끌어올린 실전 사례", date: "2026.02", tag: "단기임대", img: "/sub-vs-2.jpg" },
            ].map((post, i) => (
              <Reveal key={i} className="hm-reveal-scale" delay={i * 0.1}>
                <div className="hm-blog-card">
                  <div className="hm-blog-thumb aspect-[16/10]">
                    <img src={post.img} alt={post.title} className="w-full h-full object-cover block" />
                  </div>
                  <div className="px-6 py-[22px]">
                    <div className="flex items-center gap-2.5 mb-3.5">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[rgba(0,113,227,0.08)]" style={{ color: "var(--clr-red)" }}>{post.tag}</span>
                      <span className="text-xs" style={{ color: "var(--clr-light)" }}>{post.date}</span>
                    </div>
                    <div className="text-lg font-bold leading-[1.35] mb-2.5 tracking-tight" style={{ color: "var(--clr-black)" }}>{post.title}</div>
                    <div className="hm-body text-sm">{post.excerpt}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <div className="text-center mt-12">
              <a href={SITE.blog} target="_blank" rel="noopener noreferrer" className="hm-btn hm-btn-outline text-[15px]">더 많은 사례 보기</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="contact" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/contact-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className={`relative z-[1] ${isMobile ? 'px-6 py-20' : 'px-12 py-[120px]'} text-center`}>
          <div className="max-w-[650px] mx-auto">
            <Reveal>
              <h2 className={`${isMobile ? 'text-[28px]' : 'text-5xl'} font-bold text-white leading-[1.15] mb-5 tracking-tight`} style={{ margin: "0 0 20px" }}>당신의 건물,<br/>하우스맨이 책임집니다.</h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className={`${isMobile ? 'text-[15px]' : 'text-lg'} text-white/70 leading-relaxed mb-10 tracking-tight`}>
                표준화된 매뉴얼과 AI 기반 시스템으로<br/>공실 없는 건물, 수익 중심의 운영을 실현합니다.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex gap-3.5 justify-center flex-wrap">
                <a href={`tel:${SITE.phone}`} className="hm-btn px-8 py-3.5 rounded-full bg-white no-underline font-semibold text-lg" style={{ color: "var(--clr-black)" }}>📞 {SITE.phone}</a>
                <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-btn px-8 py-3.5 rounded-full bg-[#fee500] text-[#1d1d1f] no-underline font-semibold text-lg">💬 카카오톡</a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={`${isMobile ? 'px-6 py-12' : 'px-12 py-16'} border-t`} style={{ background: "var(--clr-bg)", borderColor: "var(--clr-border)" }}>
        <div className="max-w-[1000px] mx-auto">
          <div className={`${isMobile ? 'block' : 'flex justify-between'} mb-8 gap-10`}>
            <div className={`${isMobile ? 'mb-6' : 'mb-0'}`}>
              <div className="text-lg font-bold mb-3 tracking-tight" style={{ color: "var(--clr-black)" }}>HOUSEMAN</div>
              <div className="text-[13px] leading-[2]" style={{ color: "var(--clr-light)" }}>
                대표: {SITE.ceo} · 사업자번호: {SITE.bizNo}<br/>{SITE.address}<br/>Email: {SITE.email}
              </div>
            </div>
            <div className="flex gap-2.5">
              <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-sns-btn"><img src="/sns-kakao.svg" alt="카카오톡" /></a>
              <a href={SITE.blog} target="_blank" rel="noopener noreferrer" className="hm-sns-btn"><img src="/sns-blog.svg" alt="블로그" /></a>
            </div>
          </div>
          <hr className="hm-divider mb-5" />
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs" style={{ color: "var(--clr-light)" }}>© HOUSEMAN. All rights reserved.</div>
            <div className="flex gap-5 text-xs" style={{ color: "var(--clr-light)" }}>
              <span className="cursor-pointer hover:underline">개인정보처리방침</span>
              <span className="cursor-pointer hover:underline">이용약관</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ 모바일 하단 고정 바 ═══ */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] flex gap-2 bg-white/95 backdrop-blur-[20px] border-t px-4 py-2.5" style={{ borderColor: "var(--clr-border)", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
          <a href={`tel:${SITE.phone}`} className="flex-1 flex items-center justify-center gap-1.5 p-3.5 rounded-xl no-underline font-semibold text-[15px] text-white" style={{ background: "var(--clr-black)" }}>📞 전화하기</a>
          <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 p-3.5 rounded-xl bg-[#fee500] text-[#1d1d1f] no-underline font-semibold text-[15px]">💬 카카오톡</a>
        </div>
      )}

      {/* ═══ 플로팅 버튼 (카카오/전화/스크롤탑) ═══ */}
      <div className={`hm-float-wrap ${scrolled ? "visible" : "hidden"}`} style={{ bottom: isMobile ? 80 : 28 }}>
        <a href={SITE.kakao} target="_blank" rel="noopener noreferrer" className="hm-float-btn bg-[#3C3C3C] text-white">
          <img src="/kakao-side.svg" alt="카카오톡" className="w-[26px] h-[26px] brightness-0 invert" />
        </a>
        <a href={`tel:${SITE.phone}`} className="hm-float-btn bg-white border" style={{ borderColor: "var(--clr-border)" }}>
          <span className="text-2xl leading-none">📞</span>
        </a>
        <div onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hm-float-btn cursor-pointer" style={{ background: "var(--clr-red)" }}>
          <span className="text-xl leading-none text-white">▲</span>
        </div>
      </div>

      {/* ═══ 홈페이지 관리 버튼 ═══ */}
      {isAdmin && (
        <div onClick={() => setEditMode(!editMode)} className="fixed z-[101] flex items-center justify-center rounded-2xl text-white cursor-pointer font-bold shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300" style={{
          bottom: isMobile ? 70 : 24, right: 24,
          gap: 8,
          padding: editMode ? "12px 20px" : "0", width: editMode ? "auto" : 52, height: 52,
          background: editMode ? "var(--clr-red)" : "var(--clr-black)",
          fontSize: editMode ? 14 : 20,
        }}>{editMode ? "관리 완료 ✓" : "✏️"}</div>
      )}
    </div>
  );
};
