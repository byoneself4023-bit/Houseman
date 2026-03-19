import React from 'react';
import '../styles/settlement-print.css';

const fmt = (n) => n?.toLocaleString("ko-KR") ?? "0";

const toKoreanAmount = (n) => {
  if (!n || n === 0) return "영원";
  const abs = Math.abs(n);
  const parts = [];
  const 억 = Math.floor(abs / 100000000);
  const 만 = Math.floor((abs % 100000000) / 10000);
  const 원 = abs % 10000;
  if (억) parts.push(`${억}억`);
  if (만) parts.push(`${fmt(만)}만`);
  if (원) parts.push(`${fmt(원)}`);
  return (n < 0 ? "마이너스 " : "") + parts.join(" ") + "원";
};

// ============================================================
// 갑지 항목 생성
// ============================================================
const buildCoverItems = (bs) => {
  const { cfg } = bs;
  const items = [];
  const isSalary = cfg.feeType === "salary";

  if (isSalary) {
    items.push({ label: "관리 수수료", amount: cfg.feeAmount || 0 });
    if (cfg.subItems) {
      cfg.subItems.forEach(si => {
        items.push({ label: si.name + (si.vendor ? ` / ${si.vendor}` : ""), amount: si.amount });
      });
    }
    if (bs.totalDeduction > 0) {
      items.push({ label: "지출(A/S) / 기타 비용", amount: bs.totalDeduction });
    }
    if (cfg.vat && bs.vatInfo.tax) {
      items.push({ label: "부가가치세", amount: bs.vatInfo.tax });
    }
  } else {
    // 퍼센트형 갑지 항목 (실제 정산서 순서)
    const rentTotal = bs.totalRentSettlement + (bs.totalMgmtSettlement || 0);
    items.push({ label: "월세 정산금(a)", amount: rentTotal });

    if (bs.moveOutSettlements.length > 0) {
      items.push({ label: "퇴실시 날짜 계산", amount: bs.totalMoveOutRent || 0 });
    }

    if (bs.totalBrokerage > 0) {
      items.push({ label: "입주시 중개 수수료", amount: -(bs.totalBrokerage) });
    }

    if (cfg.feeRate !== 0 && bs.totalPenalty > 0) {
      items.push({ label: "퇴실시 위약금", amount: bs.totalPenalty });
    }

    if (cfg.feeRate !== 0 && bs.totalDepositReturn > 0) {
      items.push({ label: "예치금(b)", amount: -(bs.totalDepositReturn) });
    }

    if (cfg.feeRate !== 0 && bs.totalDeduction > 0) {
      items.push({ label: "공제 내역(d)", amount: -(bs.totalDeduction) });
    }

    if (cfg.vat && bs.vatInfo.tax) {
      items.push({ label: "부가가치세", amount: bs.vatInfo.tax });
    }
  }

  return items;
};

// ============================================================
// 메인 컴포넌트
// ============================================================
export const SettlementPrintView = ({ data, onClose }) => {
  const bs = data;
  const { cfg, period, acctInfo } = bs;

  const isSalary = cfg.feeType === "salary";
  const direction = isSalary ? "건물주 → 하우스맨" : "하우스맨 → 건물주";

  const coverItems = buildCoverItems(bs);
  const coverTotal = coverItems.reduce((s, item) => s + item.amount, 0);

  const periodStr = `${period.start} ~ ${period.end}`;
  const [py, pm] = period.start.split("-");
  const monthLabel = `${py}년 ${parseInt(pm)}월`;
  const today = new Date().toISOString().slice(0, 10);

  const feeDesc = isSalary
    ? `관리대행 (월 ${fmt(cfg.feeAmount || 0)}원)`
    : cfg.feeRate > 0
      ? `수수료 ${(cfg.feeRate * 100).toFixed(1)}%${cfg.vat ? " + VAT" : ""}`
      : "수수료 없음";

  const refDeposit = bs.roomSettlements.reduce((s, r) => s + (r.deposit || 0), 0);
  const refRent = bs.roomSettlements.reduce((s, r) => s + (r.rent || 0), 0);
  const refMgmt = bs.roomSettlements.reduce((s, r) => s + (r.mgmt || 0), 0);

  return (
    <div className="stl-print-overlay">
      {/* ===== 툴바 ===== */}
      <div className="stl-toolbar">
        <div className="stl-toolbar-left">
          <button className="stl-btn stl-btn-back" onClick={onClose}>← 돌아가기</button>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{bs.building} 정산서 미리보기</span>
        </div>
        <div className="stl-toolbar-right">
          <button className="stl-btn stl-btn-print" onClick={() => window.print()}>인쇄</button>
        </div>
      </div>

      <div className="stl-pages">
        {/* ======================================================
            갑지 (Cover Page)
        ====================================================== */}
        <div className="stl-page">
          <div className="stl-header">
            <div className="stl-logo">
              <img src="/logo-c.svg" alt="" style={{ height: 36 }} />
            </div>
            <div className="stl-title">{bs.building} 정산서</div>
            <div className="stl-subtitle">{monthLabel}</div>
          </div>

          <div className="stl-info">
            <div className="stl-info-item">
              <span className="stl-info-label">정산기간</span>
              <span className="stl-info-value">{periodStr}</span>
            </div>
            <div className="stl-info-item">
              <span className="stl-info-label">유형</span>
              <span className="stl-info-value">{feeDesc}</span>
            </div>
            <div className="stl-info-item">
              <span className="stl-info-label">주소</span>
              <span className="stl-info-value">{cfg.address || "—"}</span>
            </div>
            <div className="stl-info-item">
              <span className="stl-info-label">입주현황</span>
              <span className="stl-info-value">{bs.tenantCount}세대 (신규 {bs.moveInCount}, 퇴실 {bs.moveOutCount})</span>
            </div>
          </div>

          {cfg.notes && <div className="stl-note">* {cfg.notes}</div>}

          {/* 정산 요약 테이블 */}
          <table className="stl-sum-table">
            <thead>
              <tr>
                <th style={{ width: '10mm' }}>No</th>
                <th>항 목</th>
                <th style={{ width: '42mm' }}>금 액</th>
              </tr>
            </thead>
            <tbody>
              {coverItems.map((item, i) => (
                <tr key={i}>
                  <td className="no">{i + 1}</td>
                  <td className="label">{item.label}</td>
                  <td className="amt">{item.amount < 0 ? "-" : ""}{fmt(Math.abs(item.amount))}원</td>
                </tr>
              ))}
              <tr className="total">
                <td className="no"></td>
                <td className="label" style={{ textAlign: 'center' }}>합 계</td>
                <td className="amt">{coverTotal < 0 ? "-" : ""}{fmt(Math.abs(coverTotal))}원</td>
              </tr>
            </tbody>
          </table>

          {/* 최종 정산금 */}
          <div className="stl-final">
            <div className="stl-final-dir">{direction} 정산금</div>
            <div className="stl-final-amt">{bs.finalAmount < 0 ? "-" : ""}{fmt(Math.abs(bs.finalAmount))}원</div>
            <div className="stl-final-kr">({toKoreanAmount(bs.finalAmount)})</div>
          </div>

          {/* 정산계좌 */}
          <div className="stl-acct">
            <div className="stl-acct-title">정산계좌</div>
            <div className="stl-acct-info">
              {acctInfo?.owner
                ? `${acctInfo.owner.bank} ${acctInfo.owner.account} (${acctInfo.owner.holder})`
                : "하우스맨 통합계좌"
              }
            </div>
          </div>

          {/* 참고 합계 */}
          <div className="stl-ref">
            <div style={{ fontWeight: 700, marginBottom: '1.5mm', fontSize: '9pt', color: '#374151' }}>참고 합계</div>
            {cfg.feeRate !== 0 && <div className="stl-ref-row">
              <span className="stl-ref-label">총 예치금/보증금</span>
              <span className="stl-ref-value">{fmt(refDeposit)}원</span>
            </div>}
            <div className="stl-ref-row">
              <span className="stl-ref-label">총 월세/임대료</span>
              <span className="stl-ref-value">{fmt(refRent)}원</span>
            </div>
            {refMgmt > 0 && (
              <div className="stl-ref-row">
                <span className="stl-ref-label">총 관리비</span>
                <span className="stl-ref-value">{fmt(refMgmt)}원</span>
              </div>
            )}
          </div>

          {/* 서명 */}
          <div className="stl-sign">
            <div className="stl-sign-date">작성일: {today}</div>
            <div className="stl-sign-boxes">
              <div className="stl-sign-box">
                <div className="stl-sign-stamp"></div>
                <div className="stl-sign-label">작 성</div>
              </div>
              <div className="stl-sign-box">
                <div className="stl-sign-stamp"></div>
                <div className="stl-sign-label">확 인</div>
              </div>
            </div>
          </div>

          <div className="stl-footer">주식회사 하우스맨</div>
        </div>

        {/* ======================================================
            상세내역 (Detail Pages)
        ====================================================== */}
        <div className="stl-page">
          <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
            <div style={{ fontSize: '15pt', fontWeight: 800, color: '#111', marginBottom: '1.5mm' }}>
              {bs.building} 정산 상세내역
            </div>
            <div style={{ fontSize: '10pt', color: '#666' }}>정산기간: {periodStr}</div>
          </div>

          {/* ── 1. 월세 정산 ── */}
          <div className="stl-sec-title">1. 월세 정산 ({bs.roomSettlements.length}호실)</div>
          <table className="stl-dtl-table">
            <thead>
              <tr>
                <th>호실</th>
                <th>상태</th>
                <th>세입자</th>
                <th>입주일</th>
                {cfg.feeRate !== 0 && <th>예치금</th>}
                {cfg.feeRate === 0 && <th>만기일</th>}
                <th>월세</th>
                <th>월세일</th>
                {cfg.feeRate !== 0 && <th>수수료<br/>({(cfg.feeRate * 100).toFixed(1)}%)</th>}
                <th>정산금(a)</th>
                {cfg.includeMgmt && <th>관리비</th>}
                {cfg.feeRate !== 0 && <th>미납</th>}
              </tr>
            </thead>
            <tbody>
              {bs.roomSettlements.map((r, i) => (
                <tr key={i}>
                  <td className="c b">{r.room}</td>
                  <td className="c">{r.status}</td>
                  <td>{r.name}</td>
                  <td className="c" style={{ fontSize: '7.5pt' }}>{r.moveIn?.slice(2)}</td>
                  {cfg.feeRate !== 0 && <td className="r">{fmt(r.deposit)}</td>}
                  {cfg.feeRate === 0 && <td className="c" style={{ fontSize: '7.5pt' }}>{r.expiry?.slice(2) || "—"}</td>}
                  <td className="r b">{fmt(r.rent)}</td>
                  <td className="c">{r.rentDay}일</td>
                  {cfg.feeRate !== 0 && <td className="r neg">{r.fee > 0 ? `-${fmt(r.fee)}` : "—"}</td>}
                  <td className="r b">{fmt(r.settlementAmt)}</td>
                  {cfg.includeMgmt && <td className="r">{fmt(r.mgmt)}</td>}
                  {cfg.feeRate !== 0 && <td className="r" style={{ color: (r.delinquent || 0) > 0 ? '#dc2626' : '#999' }}>
                    {(r.delinquent || 0) > 0 ? fmt(r.delinquent) : "—"}
                  </td>}
                </tr>
              ))}
              <tr className="sub">
                <td colSpan={5} className="c">합 계</td>
                <td className="r">{fmt(bs.totalRent)}</td>
                <td></td>
                <td className="r neg">{bs.totalFee > 0 ? `-${fmt(bs.totalFee)}` : "—"}</td>
                <td className="r b">{fmt(bs.totalRentSettlement)}</td>
                {cfg.includeMgmt && <td className="r b">{fmt(bs.totalMgmtSettlement)}</td>}
                <td></td>
              </tr>
            </tbody>
          </table>

          {/* ── 2. 입주 정산 ── */}
          {bs.moveInSettlements && bs.moveInSettlements.length > 0 && (
            <>
              <div className="stl-sec-title">2. 입주 정산 ({bs.moveInSettlements.length}건)</div>
              <table className="stl-dtl-table">
                <thead>
                  <tr>
                    <th>호실</th>
                    <th>세입자</th>
                    <th>입주일</th>
                    {cfg.feeRate !== 0 && <th>예치금(b)</th>}
                    <th>중개수수료</th>
                  </tr>
                </thead>
                <tbody>
                  {bs.moveInSettlements.map((mi, i) => (
                    <tr key={i}>
                      <td className="c b">{mi.room}</td>
                      <td>{mi.name}</td>
                      <td className="c">{mi.moveIn}</td>
                      {cfg.feeRate !== 0 && <td className="r">{fmt(mi.deposit)}</td>}
                      <td className="r neg">{mi.brokerageFee ? `-${fmt(mi.brokerageFee)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ── 3. 퇴실 정산 ── */}
          {bs.moveOutSettlements.length > 0 && (
            <>
              <div className="stl-sec-title">
                {bs.moveInSettlements?.length > 0 ? "3" : "2"}. 퇴실 정산 ({bs.moveOutSettlements.length}건)
              </div>
              {bs.moveOutSettlements.map((mt, i) => (
                <div key={i} style={{ marginBottom: '4mm' }}>
                  <div style={{ fontSize: '9.5pt', fontWeight: 700, marginBottom: '1.5mm', color: '#1e40af' }}>
                    {mt.room}호 {mt.name}
                    <span style={{ marginLeft: '3mm', fontSize: '8.5pt', fontWeight: 500, color: mt.reason === "조기퇴실" ? '#dc2626' : '#059669' }}>
                      ({mt.reason || "퇴실"})
                    </span>
                  </div>
                  <table className="stl-dtl-table">
                    <tbody>
                      <tr>
                        <td style={{ width: '20%', background: '#f5f5f5', fontWeight: 600 }}>퇴실일</td>
                        <td style={{ width: '13%' }}>{mt.moveOutDate}</td>
                        <td style={{ width: '20%', background: '#f5f5f5', fontWeight: 600 }}>입주일</td>
                        <td style={{ width: '13%' }}>{mt.moveIn?.slice(2)}</td>
                        <td style={{ width: '20%', background: '#f5f5f5', fontWeight: 600 }}>기간정산</td>
                        <td>{mt.usedDays}일 / {mt.totalDays}일</td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f5f5f5', fontWeight: 600 }}>월세</td>
                        <td className="r">{fmt(mt.rent)}</td>
                        {cfg.feeRate !== 0 && <><td style={{ background: '#f5f5f5', fontWeight: 600 }}>관리비</td>
                        <td className="r">{fmt(mt.mgmt)}</td></>}
                        {cfg.feeRate === 0 && <><td style={{ background: '#f5f5f5', fontWeight: 600 }}>만기일</td>
                        <td>{mt.expiry?.slice(2) || "—"}</td></>}
                        <td style={{ background: '#f5f5f5', fontWeight: 600 }}>월세 일할</td>
                        <td className="r b">{fmt(mt.rentProRata)}</td>
                      </tr>
                      {cfg.feeRate !== 0 && (
                        <>
                          <tr>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>관리비 일할</td>
                            <td className="r">{fmt(mt.mgmtProRata)}</td>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>수수료 공제</td>
                            <td className="r neg">-{fmt(mt.fee)}</td>
                            <td></td><td></td>
                          </tr>
                          <tr style={{ borderTop: '1.5px solid #999' }}>
                            <td colSpan={6} style={{ background: '#fef2f2', fontWeight: 700, color: '#991b1b', fontSize: '9pt' }}>
                              퇴실 공제 항목
                            </td>
                          </tr>
                          <tr>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>퇴실청소비</td>
                            <td className="r">{mt.cleanFee > 0 ? fmt(mt.cleanFee) : "—"}</td>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>전기검침</td>
                            <td className="r">{mt.elecReading > 0 ? fmt(mt.elecReading) : "—"}</td>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>가스검침</td>
                            <td className="r">{mt.gasReading > 0 ? fmt(mt.gasReading) : "—"}</td>
                          </tr>
                          <tr>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>수도검침</td>
                            <td className="r">{mt.waterReading > 0 ? fmt(mt.waterReading) : "—"}</td>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>훼손/파손</td>
                            <td className="r">{mt.damageFee > 0 ? fmt(mt.damageFee) : "—"}</td>
                            <td style={{ background: '#f5f5f5', fontWeight: 600 }}>위약금(7일)</td>
                            <td className="r" style={{ color: mt.penalty7 > 0 ? '#dc2626' : undefined }}>{mt.penalty7 > 0 ? fmt(mt.penalty7) : "—"}</td>
                          </tr>
                          {mt.damageDesc && (
                            <tr>
                              <td style={{ background: '#f5f5f5', fontWeight: 600 }}>훼손사유</td>
                              <td colSpan={5}>{mt.damageDesc}</td>
                            </tr>
                          )}
                          <tr style={{ borderTop: '2px solid #333' }}>
                            <td style={{ background: '#e8f0fe', fontWeight: 700 }}>예치금</td>
                            <td className="r b">{fmt(mt.depositReturn)}</td>
                            <td style={{ background: '#e8f0fe', fontWeight: 700 }}>공제합계</td>
                            <td className="r b neg">-{fmt(mt.totalDeductItems)}</td>
                            <td style={{ background: '#e8f0fe', fontWeight: 800, fontSize: '10pt' }}>최종 환불</td>
                            <td className="r b" style={{ fontSize: '10pt', color: mt.finalRefund >= 0 ? '#059669' : '#dc2626' }}>
                          {fmt(mt.finalRefund)}원
                        </td>
                      </tr>
                        </>
                      )}
                      {/* 수수료 0%: 월세 일할 결과만 */}
                      {cfg.feeRate === 0 && (
                        <tr style={{ borderTop: '2px solid #333' }}>
                          <td colSpan={4} style={{ background: '#e8f0fe', fontWeight: 800, fontSize: '10pt' }}>
                            {mt.alreadyPaid ? "환수 합계" : "지급 합계"}
                          </td>
                          <td colSpan={2} className="r b" style={{ fontSize: '10pt', color: mt.alreadyPaid ? '#dc2626' : '#059669' }}>
                            {fmt(mt.settlementAmt)}원
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* ── 4. 공제 내역 ── */}
          {(() => {
            let secNum = 2;
            if (bs.moveInSettlements?.length > 0) secNum++;
            if (bs.moveOutSettlements.length > 0) secNum++;
            return (
              <>
                <div className="stl-sec-title">{secNum}. 공제 내역</div>
                {bs.deductions.length > 0 ? (
                  <table className="stl-dtl-table">
                    <thead>
                      <tr>
                        <th style={{ width: '8mm' }}>No</th>
                        <th style={{ width: '22mm' }}>날짜</th>
                        <th style={{ width: '14mm' }}>호실</th>
                        <th style={{ width: '28mm' }}>금액</th>
                        <th>내역</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bs.deductions.map((d, i) => (
                        <tr key={i}>
                          <td className="c">{i + 1}</td>
                          <td className="c">{d.date}</td>
                          <td className="c">{d.room || "—"}</td>
                          <td className="r">{fmt(d.amount)}원</td>
                          <td>{d.desc}</td>
                        </tr>
                      ))}
                      <tr className="sub">
                        <td colSpan={3} className="c">합 계</td>
                        <td className="r b">{fmt(bs.totalDeduction)}원</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="stl-empty">해당 기간 공제내역 없음</div>
                )}
              </>
            );
          })()}

          {/* VAT */}
          {cfg.vat && bs.vatInfo.tax > 0 && (
            <>
              <div className="stl-sec-title" style={{ marginTop: '5mm' }}>부가가치세 계산</div>
              <table className="stl-dtl-table" style={{ width: '50%' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }}>공급가액</td>
                    <td className="r">{fmt(bs.vatInfo.supply)}원</td>
                  </tr>
                  <tr>
                    <td>부가세 (10%)</td>
                    <td className="r">{fmt(bs.vatInfo.tax)}원</td>
                  </tr>
                  <tr className="sub">
                    <td>합계</td>
                    <td className="r b">{fmt(bs.vatInfo.total)}원</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* 미납 */}
          {bs.roomSettlements.some(r => (r.delinquent || 0) > 0) && (
            <div className="stl-delinq">
              미납 안내: {bs.roomSettlements.filter(r => (r.delinquent || 0) > 0).map(r =>
                `${r.room}호 ${r.name} ${fmt(r.delinquent)}원`
              ).join(", ")}
            </div>
          )}

          <div className="stl-footer">
            주식회사 하우스맨 · {bs.building} · {monthLabel} 정산 상세내역
          </div>
        </div>
      </div>
    </div>
  );
};
