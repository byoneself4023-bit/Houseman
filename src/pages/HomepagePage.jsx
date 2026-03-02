import { useState } from 'react';
import { vacancies, buildingInfo } from '../data';
import { useIsMobile, fmt } from '../utils';
import { Card, SectionTitle } from '../components';

// 제이앤제이 101호 샘플 사진 생성 (색상 placeholder) — lazy-init
let _samplePhotos101 = null;
const getSamplePhotos101 = () => {
  if (_samplePhotos101) return _samplePhotos101;
  _samplePhotos101 = Array.from({ length: 20 }, (_, i) => {
    const colors = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1"];
    const labels = ["거실","침실","욕실","주방","현관","베란다","수납장","에어컨","세탁기","냉장고","전자레인지","TV","책상","침대","옷장","신발장","조명","창문뷰","인터폰","도어락"];
    const c = document.createElement("canvas");
    c.width = 400; c.height = 400;
    const ctx = c.getContext("2d");
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i] || `사진 ${i + 1}`, 200, 190);
    ctx.font = "14px sans-serif";
    ctx.fillText(`제이앤제이 101호`, 200, 220);
    ctx.fillText(`${i + 1} / 20`, 200, 250);
    return c.toDataURL("image/png");
  });
  return _samplePhotos101;
};

export const HomepagePage = ({ buildingData = {}, activeVacancies = [] }) => {
  const isMobile = useIsMobile();
  const [typeFilter, setTypeFilter] = useState("전체");
  const [detailRoom, setDetailRoom] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  // activeVacancies 우선, 없으면 정적 vacancies 사용
  const sourceVacancies = activeVacancies.length > 0 ? activeVacancies : vacancies;
  const publicVacancies = sourceVacancies;

  const getRoomPhotos = (building, room) => {
    const bd = buildingData[building] || {};
    const photos = bd[`roomPhotos_${room}`] || [];
    // 제이앤제이 101호 샘플
    if (building === "제이앤제이" && room === "101" && photos.length === 0) return getSamplePhotos101();
    return photos;
  };
  const filtered = typeFilter === "전체" ? publicVacancies : publicVacancies.filter(v => v.type === typeFilter);

  const typeBadgeColor = (type) => type === "단기" ? "#F59E0B" : type === "근생" ? "#10B981" : type === "관리사무소" ? "#7C3AED" : "#3B82F6";
  const typeGradient = (type) => type === "단기" ? "linear-gradient(135deg, #DBEAFE, #EFF6FF)" : type === "근생" ? "linear-gradient(135deg, #D1FAE5, #ECFDF5)" : "linear-gradient(135deg, #E0E7FF, #EEF2FF)";

  // 상세보기
  if (detailRoom) {
    const v = detailRoom;
    const bi = buildingInfo[v.building] || {};
    const bd = buildingData[v.building] || {};
    const info = { area: bd.address || bi.area || "", desc: bi.desc || "", floors: bi.floors || "", img: bi.img || "🏢" };
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* 뒤로가기 */}
        <div onClick={() => setDetailRoom(null)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
          <span style={{ fontSize: 20 }}>←</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>매물 목록으로</span>
        </div>

        {/* 사진 갤러리 (인스타그램 스타일) */}
        {(() => {
          const photos = getRoomPhotos(v.building, v.room);
          const hasPhotos = photos.length > 0;
          const idx = photoIdx < photos.length ? photoIdx : 0;
          return (
            <div style={{ marginBottom: 20 }}>
              {/* 메인 사진 */}
              <div style={{ aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", position: "relative", background: hasPhotos ? "#000" : typeGradient(v.type), display: "flex", alignItems: "center", justifyContent: "center" }}>
                {hasPhotos ? (
                  <img src={photos[idx]} alt={`사진 ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                ) : (
                  <span style={{ fontSize: 80 }}>{info.img}</span>
                )}
                {/* 유형 배지 */}
                <span style={{ position: "absolute", top: 12, left: 12, fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 8, background: typeBadgeColor(v.type), color: "#fff" }}>{v.type}</span>
                {v.days === 0 && <span style={{ position: "absolute", top: 12, right: 12, fontSize: 12, fontWeight: 800, padding: "4px 14px", borderRadius: 8, background: "#DC2626", color: "#fff" }}>NEW</span>}
                {/* 좌우 네비게이션 */}
                {hasPhotos && photos.length > 1 && (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); setPhotoIdx(idx > 0 ? idx - 1 : photos.length - 1); }}
                      style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, fontWeight: 700, userSelect: "none" }}>‹</div>
                    <div onClick={(e) => { e.stopPropagation(); setPhotoIdx(idx < photos.length - 1 ? idx + 1 : 0); }}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, fontWeight: 700, userSelect: "none" }}>›</div>
                  </>
                )}
                {/* 사진 카운터 */}
                {hasPhotos && (
                  <div style={{ position: "absolute", bottom: 12, right: 12, padding: "4px 12px", borderRadius: 12, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, fontWeight: 700 }}>{idx + 1} / {photos.length}</div>
                )}
              </div>
              {/* 썸네일 스트립 */}
              {hasPhotos && photos.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {photos.map((src, ti) => (
                    <div key={ti} onClick={() => setPhotoIdx(ti)}
                      style={{ width: 56, height: 56, minWidth: 56, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: ti === idx ? "3px solid #3B82F6" : "2px solid #E8ECF0", opacity: ti === idx ? 1 : 0.6, transition: "all 0.2s" }}>
                      <img src={src} alt={`썸네일 ${ti + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* 건물명/호실 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#1A1D23" }}>{v.building} {v.room}호</span>
            <span style={{ fontSize: 13, color: "#8F95A3", marginLeft: "auto" }}>{info.area}</span>
          </div>
          <div style={{ fontSize: 13, color: "#5F6577", marginTop: 4 }}>{info.desc}</div>
        </div>

        {/* 가격 정보 */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8ECF0", padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23", marginBottom: 14, paddingBottom: 8, borderBottom: "1.5px solid #E8ECF0" }}>💰 가격 정보</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ padding: "14px 12px", background: "#F8FAFC", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>보증금</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1A1D23" }}>{fmt(v.deposit)}<span style={{ fontSize: 12, fontWeight: 500 }}>만</span></div>
            </div>
            <div style={{ padding: "14px 12px", background: "#EFF6FF", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>월세</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#2563EB" }}>{fmt(v.rent)}<span style={{ fontSize: 12, fontWeight: 500 }}>만</span></div>
            </div>
            <div style={{ padding: "14px 12px", background: "#F8FAFC", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>관리비</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#5F6577" }}>{v.mgmt > 0 ? <>{v.mgmt}<span style={{ fontSize: 12, fontWeight: 500 }}>만</span></> : "없음"}</div>
            </div>
          </div>
          {v.nego < v.rent && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>네고 가능! 월세 {fmt(v.nego)}만원까지 협의 가능</span>
            </div>
          )}
        </div>

        {/* 상세 정보 */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8ECF0", padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23", marginBottom: 14, paddingBottom: 8, borderBottom: "1.5px solid #E8ECF0" }}>📋 상세 정보</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ...(v.commEvent ? [{ label: "이벤트수수료", value: v.commEvent }] : []),
              { label: "중개수수료", value: v.commBroker > 0 ? (v.commBroker < 1 ? v.commBroker + "%" : v.commBroker + "만") : "없음" },
              { label: "유형", value: v.type },
              { label: "보증금", value: v.deposit > 0 ? fmt(v.deposit) + "만" : "-" },
              { label: "월세", value: v.rent > 0 ? fmt(v.rent) + "만" : "-" },
              { label: "관리비", value: v.mgmt > 0 ? v.mgmt + "만" : "없음" },
              { label: "수도", value: v.water || "-", color: v.water === "포함" ? "#059669" : v.water === "별도" ? "#DC2626" : "#1A1D23" },
              { label: "케이블/인터넷", value: v.cable || "-", color: v.cable === "포함" ? "#059669" : v.cable === "별도" ? "#DC2626" : "#1A1D23" },
              { label: "퇴실비", value: v.exitFee > 0 ? v.exitFee + "만" : "없음" },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: idx % 2 === 0 ? "#F8FAFC" : "#fff", borderRadius: 6 }}>
                <span style={{ fontSize: 12, color: "#8F95A3" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.color || "#1A1D23" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 문의 버튼 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <a href="tel:010-1234-5678" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px", borderRadius: 12, background: "#3B82F6", color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 14 }}>📞 전화 문의</a>
          <a href="#" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px", borderRadius: 12, background: "#FEE500", color: "#3B1E1E", textDecoration: "none", fontWeight: 800, fontSize: 14 }}>💬 카카오톡</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1B1F2E 0%, #2A3352 100%)", borderRadius: 16, padding: "32px 28px", marginBottom: 24, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏗️</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em" }}>HOUSEMAN</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>하우스맨 부동산 관리</div>
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 16, lineHeight: 1.3 }}>지금 입주 가능한<br />방을 찾아보세요</div>
        <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>현재 <span style={{ color: "#60A5FA", fontWeight: 800 }}>{publicVacancies.length}개</span> 매물이 있습니다</div>
        {/* Contact */}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <a href="tel:010-1234-5678" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#3B82F6", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
            📞 전화 문의
          </a>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#FEE500", color: "#3B1E1E", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
            💬 카카오톡 문의
          </a>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["전체", "단기", "일반임대", "근생", "관리사무소"].map(t => {
          const count = t === "전체" ? publicVacancies.length : publicVacancies.filter(v => v.type === t).length;
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "8px 18px", borderRadius: 20, border: typeFilter === t ? "2px solid #3B82F6" : "1.5px solid #E0E3E9", background: typeFilter === t ? "#EFF6FF" : "#fff", color: typeFilter === t ? "#2563EB" : "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {t} {count}
            </button>
          );
        })}
      </div>

      {/* Room Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(2, 1fr)", gap: 12 }}>
        {filtered.map((v, i) => {
          const _bi = buildingInfo[v.building] || {};
          const _bd = buildingData[v.building] || {};
          const info = { area: _bd.address || _bi.area || "", desc: _bi.desc || "", img: _bi.img || "🏢" };
          return (
            <div key={i} onClick={() => { setPhotoIdx(0); setDetailRoom(v); }}
              style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8ECF0", overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.15)"; e.currentTarget.style.borderColor = "#3B82F6"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#E8ECF0"; }}>
              {/* Photo */}
              <div style={{ aspectRatio: "16/9", background: typeGradient(v.type), display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {getRoomPhotos(v.building, v.room).length > 0 ? (
                  <img src={getRoomPhotos(v.building, v.room)[0]} alt={`${v.building} ${v.room}호`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <span style={{ fontSize: 40 }}>{info.img}</span>
                )}
                <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: typeBadgeColor(v.type), color: "#fff" }}>{v.type}</span>
                {v.days === 0 && <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 6, background: "#DC2626", color: "#fff" }}>NEW</span>}
              </div>
              {/* Info */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#1A1D23" }}>{v.building}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#1A1D23" }}>{v.room}호</span>
                  <span style={{ fontSize: 11, color: "#8F95A3", marginLeft: "auto" }}>{info.area}</span>
                </div>
                <div style={{ fontSize: 11, color: "#5F6577", marginBottom: 10 }}>{info.desc}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, paddingTop: 10, borderTop: "1px solid #F0F2F5", flexWrap: "wrap" }}>
                  {v.commEvent && (
                    <div>
                      <div style={{ fontSize: 9, color: "#8F95A3" }}>이벤트수수료</div>
                      <div style={{ fontWeight: 700, color: "#5F6577", fontSize: 11 }}>{v.commEvent}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3" }}>중개수수료</div>
                    <div style={{ fontWeight: 700, color: "#5F6577", fontSize: 11 }}>{v.commBroker > 0 ? (v.commBroker < 1 ? v.commBroker + "%" : v.commBroker + "만") : "없음"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3" }}>보증금</div>
                    <div style={{ fontWeight: 800, color: "#1A1D23" }}>{fmt(v.deposit)}<span style={{ fontSize: 10, fontWeight: 500 }}>만</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3" }}>월세</div>
                    <div style={{ fontWeight: 800, color: "#3B82F6" }}>{fmt(v.rent)}<span style={{ fontSize: 10, fontWeight: 500 }}>만</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3" }}>관리비</div>
                    <div style={{ fontWeight: 700, color: "#5F6577" }}>{v.mgmt > 0 ? <>{v.mgmt}<span style={{ fontSize: 10, fontWeight: 500 }}>만</span></> : "없음"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3" }}>수도</div>
                    <div style={{ fontWeight: 700, color: v.water === "포함" ? "#059669" : v.water === "별도" ? "#DC2626" : "#5F6577", fontSize: 11 }}>{v.water || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3" }}>케이블</div>
                    <div style={{ fontWeight: 700, color: v.cable === "포함" ? "#059669" : v.cable === "별도" ? "#DC2626" : "#5F6577", fontSize: 11 }}>{v.cable || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3" }}>퇴실비</div>
                    <div style={{ fontWeight: 700, color: "#5F6577", fontSize: 11 }}>{v.exitFee > 0 ? v.exitFee + "만" : "없음"}</div>
                  </div>
                  {v.nego < v.rent && (
                    <div style={{ marginLeft: "auto" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 4 }}>네고가능</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600 }}>상세보기 →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, padding: "20px 0", borderTop: "1px solid #E8ECF0", textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 4 }}>HOUSEMAN 하우스맨</div>
        <div style={{ fontSize: 12, color: "#8F95A3" }}>📞 010-1234-5678 · 💬 카카오톡: houseman</div>
        <div style={{ fontSize: 11, color: "#B0B5C1", marginTop: 4 }}>서울 관악구 봉천동 · 영업시간 09:00~18:00</div>
      </div>
    </div>
  );
};
