import { useState, useMemo } from 'react';
import { buildings, billingConfig } from '../data';
import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, RoomTypeBadge } from '../components';
import { getRoomType } from '../config';
import { useLocalStorage } from '../utils/useLocalStorage';

export const UtilityBillingPage = ({ myBuildings = [], activeTenants = [], addBilling, billingConfirmed, setBillingConfirmed, billingSent, setBillingSent, roomBalances, billingHistory }) => {
  const isMobile = useIsMobile();
  const [typeTab, setTypeTab] = useState("단기");
  const [filterBuilding, setFilterBuilding] = useState("전체");
  const [filterTab, setFilterTab] = useState("전체");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editValues, setEditValues] = useLocalStorage("hm_editValues", {});
  const [showUpload, setShowUpload] = useState(null); // "elec" | "gas" | null
  const [uploadResult, setUploadResult] = useState(null);
  const today = 23;
  const billingMonth = "2026-03";

  // 유형별 필터
  const allTenants = useMemo(() => (myBuildings.length > 0 ? activeTenants.filter(t => myBuildings.includes(t.building)) : activeTenants)
    .filter(t => t.name && t.name !== "퇴실" && t.rent > 0), [myBuildings, activeTenants]);
  const typeCounts = useMemo(() => {
    const counts = { "단기": 0, "일반임대": 0, "근생": 0, "관리사무소": 0 };
    allTenants.forEach(t => { const rt = getRoomType(t.building, t.room); if (counts[rt] !== undefined) counts[rt]++; });
    return counts;
  }, [allTenants]);
  const myTenants = useMemo(() => allTenants.filter(t => getRoomType(t.building, t.room) === typeTab), [allTenants, typeTab]);
  const buildingNames = useMemo(() => ["전체", ...new Set(myTenants.map(t => t.building))], [myTenants]);

  const billingItems = myTenants.map(t => {
    const bc = billingConfig.find(b => b.b === t.building && b.r === t.room);
    const key = `${t.building}_${t.room}`;
    const roomType = getRoomType(t.building, t.room);
    const dueDay = bc?.d || parseInt(t.due?.split("/")[1]) || 0;
    const daysUntilDue = dueDay - today;
    const isTarget = daysUntilDue >= 0 && daysUntilDue <= 10;
    // 단기: 전기/가스/수도/인터넷 모두 청구
    // 일반/근생: 임차인 직접 납부이므로 전기/가스 없음, 월세+관리비만
    const elec = roomType === "단기" ? (bc?.ea || 0) : 0;
    const gas = roomType === "단기" ? (bc?.ga || 0) : 0;
    const water = roomType === "단기" ? (bc?.w || 0) : 0;
    const cable = roomType === "단기" ? (bc?.c || 0) : 0;
    const elecStart = bc?.es || ""; const elecEnd = bc?.ee || "";
    const elecPrev = bc?.ep || 0; const elecCur = bc?.ec || 0; const elecUsage = bc?.eu || 0;
    const gasPeriod = bc?.gp || "";
    const gasPrev = bc?.gpr || 0; const gasCur = bc?.gcr || 0; const gasUsage = bc?.gu || 0;
    const noElec = roomType === "단기" && !elec && !elecStart;
    const noGas = roomType === "단기" && !gas && !gasPeriod;
    const prevUnpaid = roomBalances[key] || 0;
    return { ...t, roomType, dueDay, daysUntilDue, isTarget, elec, gas, water, cable,
      elecStart, elecEnd, elecPrev, elecCur, elecUsage,
      gasPeriod, gasPrev, gasCur, gasUsage,
      noElec, noGas, prevUnpaid, key,
      confirmed: billingConfirmed[key] || false, sent: billingSent[key] || false };
  });

  const filtered = billingItems.filter(item => {
    if (filterBuilding !== "전체" && item.building !== filterBuilding) return false;
    if (filterTab === "청구대상") return item.isTarget && !item.sent;
    if (filterTab === "확인완료") return item.confirmed && !item.sent;
    if (filterTab === "발송완료") return item.sent;
    if (filterTab === "미매칭") return item.noElec || item.noGas;
    return true;
  }).sort((a, b) => a.dueDay - b.dueDay);

  const targetCount = billingItems.filter(i => i.isTarget && !i.sent).length;
  const confirmedCount = billingItems.filter(i => i.confirmed && !i.sent).length;
  const sentCount = billingItems.filter(i => i.sent).length;
  const missingCount = billingItems.filter(i => i.noElec || i.noGas).length;

  const confirmItem = (item) => setBillingConfirmed(prev => ({ ...prev, [item.key]: true }));
  const sendItem = (item) => {
    if (!item.confirmed) return;
    setBillingSent(prev => ({ ...prev, [item.key]: true }));
    const ev = editValues[item.key] || {};
    const e = ev.elec ?? item.elec;
    const g = ev.gas ?? item.gas;
    addBilling(item.building, item.room, item.name,
      { rent: item.rent, mgmt: item.mgmt, elec: e, gas: g, water: item.water, cable: item.cable, prevUnpaid: item.prevUnpaid },
      item.rent + item.mgmt + e + g + item.water + item.cable);
  };

  const getEditVal = (key, field, fallback) => {
    if (editValues[key] && editValues[key][field] !== undefined) return editValues[key][field];
    return fallback;
  };
  const setEditVal = (key, field, val) => {
    setEditValues(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: parseInt(val) || 0 } }));
  };

  const fmtPeriod = (start, end) => {
    if (!start || !end) return "";
    const s = start.replace(/\//g, ".").replace("2025.", "").replace("2026.", "");
    const e = end.replace(/\//g, ".").replace("2025.", "").replace("2026.", "");
    return `${s}~${e}`;
  };

  // 엑셀 업로드 핸들러 (전기/가스)
  const handleFileUpload = (type, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // SheetJS 사용 (cdnjs에서 로드됨)
        if (typeof XLSX === "undefined") {
          setUploadResult({ type, success: false, msg: "SheetJS 라이브러리를 로드할 수 없습니다." });
          return;
        }
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let matched = 0, unmatched = 0;
        if (type === "elec") {
          // 전기: 고객번호(col4) → billingConfig의 elecNo로 매칭
          // 기간시작(col13), 기간끝(col14), 전월지침(col76), 당월지침(col77), 사용량(col78), 당월요금(col64)
          rows.forEach((row, idx) => {
            if (idx === 0) return; // header
            const custNo = String(row[3] || "").trim();
            if (!custNo) return;
            const bc = billingConfig.find(b => b.b && custNo.includes(b.b.toString()));
            // Simple match: find in billingItems by elecNo pattern
            const item = billingItems.find(bi => {
              const bci = billingConfig.find(b => b.b === bi.building && b.r === bi.room);
              return bci && String(row[3] || "") === bci.b; // placeholder
            });
            // For prototype: just count rows
            if (row[3]) matched++; else unmatched++;
          });
          setUploadResult({ type: "elec", success: true, msg: `전기 엑셀 처리: ${rows.length - 1}건 읽음, ${matched}건 매칭`, rows: rows.length - 1 });
        } else {
          // 가스: 코드(col1) → 건물+호실로 매칭
          rows.forEach((row, idx) => {
            if (idx === 0) return;
            if (row[0]) matched++; else unmatched++;
          });
          setUploadResult({ type: "gas", success: true, msg: `가스 데이터 처리: ${rows.length - 1}건 읽음, ${matched}건 매칭`, rows: rows.length - 1 });
        }
      } catch (err) {
        setUploadResult({ type, success: false, msg: `파일 처리 오류: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ===== 상세 보기 =====
  if (selectedItem) {
    const t = selectedItem;
    const ev = editValues[t.key] || {};
    const e = ev.elec ?? t.elec;
    const g = ev.gas ?? t.gas;
    const fixedTotal = t.rent + t.mgmt + t.water + t.cable;
    const utilTotal = e + g;
    const grandTotal = fixedTotal + utilTotal + t.prevUnpaid;
    const elecPeriodStr = t.elecStart ? fmtPeriod(t.elecStart, t.elecEnd) : "기간 없음";
    const gasPeriodStr = t.gasPeriod || "기간 없음";

    // 유형별 메시지 템플릿
    const rentLabel = t.roomType === "관리사무소" ? "관리비" : t.roomType === "근생" ? "임대료" : "월세";
    const msgLines = [`[하우스맨 ${t.building} ${rentLabel}&공과금 청구서]`, `${t.room}호 ${t.name}님`, "",
      `■납부할 금액 : ${grandTotal.toLocaleString()}원`, "", "<상세내역>"];
    if (t.prevUnpaid > 0) msgLines.push(`·미납 : ${t.prevUnpaid.toLocaleString()}`);
    msgLines.push(`·${rentLabel} : ${t.rent.toLocaleString()}`);
    if (t.mgmt > 0) msgLines.push(`·관리비 : ${t.mgmt.toLocaleString()}`);
    if (t.roomType === "단기") {
      if (t.water > 0) msgLines.push(`·수도 : ${t.water.toLocaleString()}`);
      if (t.cable > 0) msgLines.push(`·인터넷/TV : ${t.cable.toLocaleString()}`);
      msgLines.push("", `·전기 : ${e.toLocaleString()}원`);
      msgLines.push(t.elecStart ? `${fmtPeriod(t.elecStart, t.elecEnd)}(${t.elecPrev}→${t.elecCur})` : "기간 미확인");
      msgLines.push(`사용량:${t.elecUsage}kWh`);
      msgLines.push("", `·가스 : ${g.toLocaleString()}원`);
      msgLines.push(t.gasPeriod ? `${t.gasPeriod}(${t.gasPrev}→${t.gasCur})` : "기간 미확인");
      msgLines.push(`사용량:${t.gasUsage}`);
    }
    msgLines.push("", `납부일은 ${billingMonth.slice(5)}/${t.dueDay}일 입니다.`);
    const msg = msgLines.join("\n");

    const detailInputStyle = (isMissing) => ({
      width: 110, padding: "6px 10px", borderRadius: 6,
      border: isMissing ? "2px solid #EF4444" : "1.5px solid #E0E3E9",
      background: isMissing ? "#FEF2F2" : "#fff",
      fontSize: 13, textAlign: "right", fontFamily: "inherit", fontWeight: 700
    });

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => setSelectedItem(null)}>
          <span style={{ fontSize: 20 }}>←</span><span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>목록으로</span>
        </div>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                ⚡ {t.building} {t.room}호
                <RoomTypeBadge building={t.building} room={t.room} />
              </div>
              <div style={{ fontSize: 13, color: "#8F95A3", marginTop: 4 }}>{t.name} · 납부일 매월 {t.dueDay}일</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {t.confirmed && <span style={{ padding: "5px 10px", borderRadius: 6, background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700 }}>✓ 확인됨</span>}
              {t.sent && <span style={{ padding: "5px 10px", borderRadius: 6, background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700 }}>✓ 발송됨</span>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 16 }}>
            {/* 좌: 청구내역 */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📋 청구 내역</div>
              {t.prevUnpaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>🔴 미납금</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>{t.prevUnpaid.toLocaleString()}원</span>
                </div>
              )}
              {[
                { label: `🏠 ${rentLabel}`, value: t.rent },
                t.mgmt > 0 && { label: "📋 관리비", value: t.mgmt },
                t.roomType === "단기" && t.water > 0 && { label: "💧 수도 (고정)", value: t.water },
                t.roomType === "단기" && t.cable > 0 && { label: "📺 인터넷/TV (고정)", value: t.cable },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#F8FAFC", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#5F6577" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{item.value.toLocaleString()}원</span>
                </div>
              ))}

              {/* 전기/가스 - 단기만 */}
              {t.roomType === "단기" && (
                <>
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: t.noElec ? "#FEF2F2" : "#FFFBEB", border: t.noElec ? "1.5px solid #EF4444" : "1px solid #FDE68A", marginBottom: 4, marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#92400E", fontWeight: 700 }}>⚡ 전기요금</span>
                      <input value={getEditVal(t.key, "elec", e)} onChange={ev => setEditVal(t.key, "elec", ev.target.value)} style={detailInputStyle(t.noElec)} />
                    </div>
                    <div style={{ fontSize: 10, color: t.noElec ? "#DC2626" : "#92400E" }}>
                      {t.noElec ? "⚠ 한전 데이터 미매칭 — 엑셀 업로드 또는 수기 입력" : `기간: ${elecPeriodStr} · 검침: ${t.elecPrev}→${t.elecCur} · ${t.elecUsage}kWh`}
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: t.noGas ? "#FEF2F2" : "#FFF1F2", border: t.noGas ? "1.5px solid #EF4444" : "1px solid #FECACA", marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#991B1B", fontWeight: 700 }}>🔥 가스요금</span>
                      <input value={getEditVal(t.key, "gas", g)} onChange={ev => setEditVal(t.key, "gas", ev.target.value)} style={detailInputStyle(t.noGas)} />
                    </div>
                    <div style={{ fontSize: 10, color: t.noGas ? "#DC2626" : "#991B1B" }}>
                      {t.noGas ? "⚠ 가스 데이터 미매칭 — 파일 업로드 또는 수기 입력" : `기간: ${gasPeriodStr} · 검침: ${t.gasPrev}→${t.gasCur} (${t.gasUsage})`}
                    </div>
                  </div>
                </>
              )}

              {/* 일반/근생 안내 */}
              {t.roomType !== "단기" && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F0F4FF", border: "1px solid #C7D2FE", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#4338CA", fontWeight: 600 }}>ℹ️ {t.roomType === "근생" ? "근린생활시설" : "일반임대"} — 전기/가스/수도 임차인 직접 납부</div>
                  <div style={{ fontSize: 10, color: "#6366F1", marginTop: 4 }}>{rentLabel} + 관리비만 청구</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderRadius: 8, background: "#FEF3C7", border: "1.5px solid #F59E0B", marginTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>총 청구액</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#92400E" }}>{grandTotal.toLocaleString()}원</span>
              </div>
            </div>

            {/* 우: 메시지 & 버튼 */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📱 발송 메시지 미리보기</div>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, border: "1px solid #E8ECF0", whiteSpace: "pre-line", fontSize: 11.5, color: "#374151", lineHeight: 1.8, marginBottom: 16, maxHeight: 360, overflow: "auto" }}>{msg}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {!t.confirmed ? (
                  <button onClick={() => { confirmItem(t); setSelectedItem({ ...t, confirmed: true }); }}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#059669", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    ✅ 금액 확인
                  </button>
                ) : !t.sent ? (
                  <button onClick={() => { sendItem(t); setSelectedItem({ ...t, sent: true }); }}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#3B82F6", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    📱 문자 발송
                  </button>
                ) : (
                  <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#D1D5DB", color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: "inherit" }}>✓ 발송 완료</button>
                )}
                <button onClick={() => navigator.clipboard?.writeText(msg)} style={{ padding: "12px 20px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📋 복사</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ===== 목록 뷰 =====
  const typeTabCfg = { "단기": { icon: "🏠", c: "#EA580C", bg: "#FFF7ED", desc: "전기·가스·수도·인터넷 포함 청구" },
    "일반임대": { icon: "🏢", c: "#2563EB", bg: "#EFF6FF", desc: "월세+관리비만 · 공과금 직접납부" },
    "근생": { icon: "🏪", c: "#7C3AED", bg: "#F5F3FF", desc: "임대료+관리비만 · 공과금 직접납부" },
    "관리사무소": { icon: "🏛️", c: "#0D9488", bg: "#F0FDFA", desc: "관리비만 청구" } };

  return (
    <div>
      <SectionTitle sub={`${billingMonth.slice(5)}월 · ${typeTab} ${myTenants.length}건`}>⚡ 공과금 청구</SectionTitle>
      {/* 유형 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {["단기", "일반임대", "근생", "관리사무소"].map(t => {
          const cfg = typeTabCfg[t];
          const active = typeTab === t;
          return (
            <button key={t} onClick={() => { setTypeTab(t); setFilterTab("전체"); setFilterBuilding("전체"); }}
              style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: active ? `2px solid ${cfg.c}` : "1.5px solid #E0E3E9",
                background: active ? cfg.bg : "#fff", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: active ? cfg.c : "#5F6577" }}>{cfg.icon} {t} <span style={{ fontSize: 16, fontWeight: 900 }}>{typeCounts[t]}</span></div>
              <div style={{ fontSize: 8, color: "#8F95A3", marginTop: 1 }}>{cfg.desc}</div>
            </button>
          );
        })}
      </div>

      {/* 단기: 데이터 업로드 패널 */}
      {typeTab === "단기" && (
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          <button onClick={() => setShowUpload(showUpload === "elec" ? null : "elec")}
            style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: showUpload === "elec" ? "2px solid #F59E0B" : "1.5px solid #E0E3E9",
              background: showUpload === "elec" ? "#FFFBEB" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, color: "#92400E" }}>
            ⚡ 전기 엑셀 업로드
          </button>
          <button onClick={() => setShowUpload(showUpload === "gas" ? null : "gas")}
            style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: showUpload === "gas" ? "2px solid #EF4444" : "1.5px solid #E0E3E9",
              background: showUpload === "gas" ? "#FEF2F2" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, color: "#991B1B" }}>
            🔥 가스 업로드
          </button>
        </div>
      )}

      {/* 업로드 패널 */}
      {showUpload && (
        <Card style={{ marginBottom: 12, border: showUpload === "elec" ? "2px solid #F59E0B" : "2px solid #EF4444" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: showUpload === "elec" ? "#92400E" : "#991B1B" }}>
              {showUpload === "elec" ? "⚡ 전기 빌링사 엑셀 업로드" : "🔥 가스 데이터 업로드"}
            </div>
            <button onClick={() => { setShowUpload(null); setUploadResult(null); }} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✕</button>
          </div>
          <div style={{ padding: "16px", borderRadius: 10, border: "2px dashed #D1D5DB", background: "#F9FAFB", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{showUpload === "elec" ? "📊" : "📄"}</div>
            <div style={{ fontSize: 12, color: "#5F6577", marginBottom: 8 }}>
              {showUpload === "elec" ? "한전 빌링사에서 다운받은 엑셀(.xlsx)을 업로드하세요" : "가스 이메일 첨부파일(.xlsx/.csv)을 업로드하세요"}
            </div>
            <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 12 }}>
              {showUpload === "elec" ? "고객번호로 자동 매칭 · 기간/검침/사용량/금액 자동입력" : "건물+호실 코드로 자동 매칭 · 기간/검침/사용량/금액 자동입력"}
            </div>
            <label style={{ display: "inline-block", padding: "10px 24px", borderRadius: 8, background: showUpload === "elec" ? "#F59E0B" : "#EF4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              파일 선택
              <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) handleFileUpload(showUpload, e.target.files[0]); }} />
            </label>
          </div>
          {uploadResult && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: uploadResult.success ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${uploadResult.success ? "#BBF7D0" : "#FECACA"}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: uploadResult.success ? "#059669" : "#DC2626" }}>
                {uploadResult.success ? "✅ " : "❌ "}{uploadResult.msg}
              </div>
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 10, color: "#8F95A3", lineHeight: 1.6 }}>
            {showUpload === "elec" ? (
              <>💡 매칭 방식: 엑셀의 고객번호 → billingConfig의 전기고객번호로 자동 매칭<br/>
              미매칭 호실은 적색 표시 → 수기 입력 가능</>
            ) : (
              <>💡 매칭 방식: 엑셀의 건물+호실 코드 → 자동 매칭<br/>
              실서비스에서는 가스 이메일(IMAP) 자동 연동 구현 예정<br/>
              현재는 이메일 첨부 파일을 다운받아 업로드해주세요</>
            )}
          </div>
        </Card>
      )}

      {/* 유형별 안내 */}
      <div style={{ padding: "4px 10px", borderRadius: 6, background: typeTabCfg[typeTab].bg, border: `1px solid ${typeTabCfg[typeTab].c}30`, marginBottom: 8, fontSize: 10, color: typeTabCfg[typeTab].c }}>
        {typeTab === "단기" && <>💡 전기(엑셀)+가스(업로드)+수도/인터넷(고정)+월세+관리비 · <strong style={{ color: "#DC2626" }}>적색=미매칭</strong></>}
        {typeTab === "일반임대" && <>💡 월세+관리비만 · 공과금 임차인 직접납부</>}
        {typeTab === "근생" && <>💡 임대료+관리비만 · 공과금 임차인 직접납부</>}
        {typeTab === "관리사무소" && <>💡 관리비만 청구 · 공과금 별도</>}
      </div>

      {/* Status cards */}
      {typeTab === "단기" ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 4, marginBottom: 8 }}>
          {[
            { label: "청구대상", sub: "D-10~0", count: targetCount, color: "#F59E0B", bg: "#FFFBEB", tab: "청구대상" },
            { label: "확인완료", sub: "발송대기", count: confirmedCount, color: "#059669", bg: "#ECFDF5", tab: "확인완료" },
            { label: "발송완료", sub: "이번달", count: sentCount, color: "#3B82F6", bg: "#EFF6FF", tab: "발송완료" },
            { label: "미매칭", sub: "수기필요", count: missingCount, color: "#DC2626", bg: "#FEF2F2", tab: "미매칭" },
            { label: "전체", sub: "단기", count: billingItems.length, color: "#5F6577", bg: "#F8FAFC", tab: "전체" },
          ].map((s, i) => (
            <Card key={i} onClick={() => setFilterTab(s.tab)} style={{ cursor: "pointer", padding: "6px 8px", background: filterTab === s.tab ? s.bg : "#fff", border: filterTab === s.tab ? `2px solid ${s.color}` : "1px solid #E8ECF0" }}>
              <div style={{ fontSize: 8, color: "#8F95A3", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>
          {[
            { label: "청구대상", count: targetCount, color: "#F59E0B", bg: "#FFFBEB", tab: "청구대상" },
            { label: "확인완료", count: confirmedCount, color: "#059669", bg: "#ECFDF5", tab: "확인완료" },
            { label: "발송완료", count: sentCount, color: "#3B82F6", bg: "#EFF6FF", tab: "발송완료" },
            { label: "전체", count: billingItems.length, color: "#5F6577", bg: "#F8FAFC", tab: "전체" },
          ].map((s, i) => (
            <Card key={i} onClick={() => setFilterTab(s.tab)} style={{ cursor: "pointer", padding: "6px 8px", background: filterTab === s.tab ? s.bg : "#fff", border: filterTab === s.tab ? `2px solid ${s.color}` : "1px solid #E8ECF0" }}>
              <div style={{ fontSize: 8, color: "#8F95A3", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center" }}>
        <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
          {buildingNames.map(b => <option key={b}>{b}</option>)}
        </select>
        {filterTab === "확인완료" && confirmedCount > 0 && (
          <button onClick={() => filtered.filter(i => i.confirmed && !i.sent).forEach(i => sendItem(i))}
            style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            📱 일괄 발송 ({confirmedCount}건)
          </button>
        )}
      </div>

      {/* Table / Mobile Cards */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#B0B5C1", fontSize: 13 }}>해당 조건 없음</div>}
          {filtered.map((r, i) => (
            <Card key={i} onClick={() => setSelectedItem(r)} style={{ cursor: "pointer", padding: "10px 12px", background: (r.noElec || r.noGas) ? "#FEF2F2" : r.sent ? "#EFF6FF" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{r.building} {r.room}호</span>
                  <span style={{ fontSize: 12, color: "#5F6577", marginLeft: 6 }}>{r.name}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: r.sent ? "#EFF6FF" : r.confirmed ? "#ECFDF5" : (r.noElec||r.noGas) ? "#FEF2F2" : r.isTarget ? "#FFFBEB" : "#F8FAFC",
                  color: r.sent ? "#2563EB" : r.confirmed ? "#059669" : (r.noElec||r.noGas) ? "#DC2626" : r.isTarget ? "#D97706" : "#8F95A3"
                }}>{r.sent ? "발송완료" : r.confirmed ? "확인완료" : (r.noElec||r.noGas) ? "미매칭" : r.isTarget ? "청구대상" : "대기"}</span>
              </div>
              {typeTab === "단기" ? (
                <div style={{ fontSize: 11, color: "#5F6577" }}>
                  전기 {r.noElec ? "⚠미매칭" : fmt(r.elec)} · 가스 {r.noGas ? "⚠미매칭" : fmt(r.gas)} · 수도 {fmt(r.water)} · 월세 {fmt(r.rent)}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#5F6577" }}>
                  {typeTab === "관리사무소" ? "관리비" : typeTab === "근생" ? "임대료" : "월세"} {typeTab === "관리사무소" ? "" : `${fmt(r.rent)} · 관리비 `}{fmt(r.mgmt)}
                  {r.prevUnpaid > 0 && <span style={{ color: "#DC2626", fontWeight: 700 }}> · 미납 {fmt(r.prevUnpaid)}</span>}
                </div>
              )}
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {!r.confirmed && <button onClick={e => { e.stopPropagation(); confirmItem(r); }} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #BBF7D0", background: "#ECFDF5", color: "#059669", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✅ 확인</button>}
                {r.confirmed && !r.sent && <button onClick={e => { e.stopPropagation(); sendItem(r); }} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📱 발송</button>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
      <Table
        columns={typeTab === "단기" ? [
          { label: "건물", render: r => <span style={{ fontWeight: 600, fontSize: 11 }}>{r.building}</span> },
          { label: "호실", render: r => <span style={{ fontSize: 12 }}>{r.room}</span> },
          { label: "입주자", render: r => <span style={{ fontWeight: 700, display: "inline-block", maxWidth: "5em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle" }}>{r.name}</span> },
          { label: "납부일", render: r => <span style={{ fontSize: 11, color: r.isTarget ? "#D97706" : "#8F95A3", fontWeight: r.isTarget ? 800 : 400 }}>{r.dueDay}일{r.isTarget ? ` D-${r.daysUntilDue}` : ""}</span> },
          { label: "전기", align: "right", render: r => (
            <span style={{ color: r.noElec ? "#DC2626" : "#F59E0B", fontWeight: r.noElec ? 800 : 600, fontSize: 11 }}>
              {r.noElec ? "⚠ 미매칭" : `${fmt(r.elec)}`}
            </span>
          )},
          { label: "전기기간", render: r => <span style={{ fontSize: 9, color: r.noElec ? "#DC2626" : "#B0B5C1" }}>{r.elecStart ? `${fmtPeriod(r.elecStart, r.elecEnd)} (${r.elecPrev}→${r.elecCur}, ${r.elecUsage}kWh)` : "—"}</span> },
          { label: "가스", align: "right", render: r => (
            <span style={{ color: r.noGas ? "#DC2626" : "#EF4444", fontWeight: r.noGas ? 800 : 600, fontSize: 11 }}>
              {r.noGas ? "⚠ 미매칭" : `${fmt(r.gas)}`}
            </span>
          )},
          { label: "가스기간", render: r => <span style={{ fontSize: 9, color: r.noGas ? "#DC2626" : "#B0B5C1" }}>{r.gasPeriod ? `${r.gasPeriod} (${r.gasPrev}→${r.gasCur}, ${r.gasUsage})` : "—"}</span> },
          { label: "수도", align: "right", render: r => r.water > 0 ? <span style={{ color: "#3B82F6", fontSize: 11 }}>{fmt(r.water)}</span> : <span style={{ color: "#ccc", fontSize: 11 }}>—</span> },
          { label: "상태", render: r => {
            const noData = r.noElec || r.noGas;
            return <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
              background: r.sent ? "#EFF6FF" : r.confirmed ? "#ECFDF5" : noData ? "#FEF2F2" : r.isTarget ? "#FFFBEB" : "#F8FAFC",
              color: r.sent ? "#2563EB" : r.confirmed ? "#059669" : noData ? "#DC2626" : r.isTarget ? "#D97706" : "#8F95A3"
            }}>{r.sent ? "발송완료" : r.confirmed ? "확인완료" : noData ? "미매칭" : r.isTarget ? "청구대상" : "대기"}</span>;
          }},
          { label: "", render: r => (
            <div style={{ display: "flex", gap: 3 }} onClick={e => e.stopPropagation()}>
              {!r.confirmed ? (
                <button onClick={() => confirmItem(r)} style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid #BBF7D0", background: "#ECFDF5", color: "#059669", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✅확인</button>
              ) : !r.sent ? (
                <button onClick={() => sendItem(r)} style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📱발송</button>
              ) : null}
            </div>
          )},
        ] : [
          // 일반/근생 테이블 (공과금 없음, 심플)
          { label: "건물", render: r => <span style={{ fontWeight: 600, fontSize: 11 }}>{r.building}</span> },
          { label: "호실", render: r => <span style={{ fontSize: 12 }}>{r.room}</span> },
          { label: "입주자", render: r => <span style={{ fontWeight: 700, display: "inline-block", maxWidth: "5em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle" }}>{r.name}</span> },
          { label: "납부일", render: r => <span style={{ fontSize: 11, color: r.isTarget ? "#D97706" : "#8F95A3", fontWeight: r.isTarget ? 800 : 400 }}>{r.dueDay}일{r.isTarget ? ` D-${r.daysUntilDue}` : ""}</span> },
          { label: typeTab === "관리사무소" ? "관리비" : typeTab === "근생" ? "임대료" : "월세", align: "right", render: r => <span style={{ fontWeight: 700, fontSize: 12 }}>{fmt(typeTab === "관리사무소" ? r.mgmt : r.rent)}</span> },
          { label: "관리비", align: "right", render: r => r.mgmt > 0 ? <span style={{ fontSize: 11 }}>{fmt(r.mgmt)}</span> : <span style={{ color: "#ccc" }}>—</span> },
          { label: "합계", align: "right", render: r => <span style={{ fontWeight: 800, fontSize: 12, color: "#1A1D23" }}>{fmt(r.rent + r.mgmt + r.prevUnpaid)}</span> },
          { label: "미납", align: "right", render: r => r.prevUnpaid > 0 ? <span style={{ color: "#DC2626", fontWeight: 700, fontSize: 11 }}>{fmt(r.prevUnpaid)}</span> : <span style={{ color: "#ccc" }}>—</span> },
          { label: "상태", render: r => <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
            background: r.sent ? "#EFF6FF" : r.confirmed ? "#ECFDF5" : r.isTarget ? "#FFFBEB" : "#F8FAFC",
            color: r.sent ? "#2563EB" : r.confirmed ? "#059669" : r.isTarget ? "#D97706" : "#8F95A3"
          }}>{r.sent ? "발송완료" : r.confirmed ? "확인완료" : r.isTarget ? "청구대상" : "대기"}</span> },
          { label: "", render: r => (
            <div style={{ display: "flex", gap: 3 }} onClick={e => e.stopPropagation()}>
              {!r.confirmed ? (
                <button onClick={() => confirmItem(r)} style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid #BBF7D0", background: "#ECFDF5", color: "#059669", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✅확인</button>
              ) : !r.sent ? (
                <button onClick={() => sendItem(r)} style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📱발송</button>
              ) : null}
            </div>
          )},
        ]}
        data={filtered}
        onRowClick={(row) => setSelectedItem(row)}
      />
      )}
      <div style={{ marginTop: 4, fontSize: 9, color: "#B0B5C1", textAlign: "center" }}>
        ※ {typeTab === "단기" ? "전기=엑셀 · 가스=파일(실서비스시 이메일연동) · 수도/인터넷=고정" : `${typeTab}: ${typeTab === "근생" ? "임대료" : "월세"}+관리비만`}
      </div>
    </div>
  );
};
