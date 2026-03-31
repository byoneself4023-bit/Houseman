/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef } from 'react';

const fmtMoney = (n: number) => n ? n.toLocaleString() : '0';
const fmtDate = (d: string | null | undefined) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
};

interface AccountInfo {
  bank?: string;
  account?: string;
  holder?: string;
}

interface BillingInvoiceTemplateProps {
  record?: any;
  tenantName?: string;
  buildingName?: string;
  roomNumber?: string;
  accountInfo?: AccountInfo;
  billingMonth?: string;
}

const BillingInvoiceTemplate = forwardRef<HTMLDivElement, BillingInvoiceTemplateProps>(({
  record = {},
  tenantName = '',
  buildingName = '',
  roomNumber = '',
  accountInfo = {},
  billingMonth = '',
}, ref) => {
  const [y, m] = (billingMonth || record.billing_month || '').split('-');

  const items = [
    record.rent > 0 && { label: '월세', amount: record.rent },
    record.management_fee > 0 && { label: '관리비', amount: record.management_fee },
    record.electric_fee > 0 && { label: '전기요금', amount: record.electric_fee },
    record.elec_billing_surcharge > 0 && { label: '전기 청구수수료', amount: record.elec_billing_surcharge },
    record.gas_fee > 0 && { label: '가스요금', amount: record.gas_fee },
    record.gas_billing_surcharge > 0 && { label: '가스 청구수수료', amount: record.gas_billing_surcharge },
    record.water_fee > 0 && { label: '수도요금', amount: record.water_fee },
    record.internet_fee > 0 && { label: '인터넷', amount: record.internet_fee },
    record.parking_fee > 0 && { label: '주차요금', amount: record.parking_fee },
    record.extra_charge > 0 && { label: record.extra_charge_desc || '추가비용', amount: record.extra_charge },
  ].filter(Boolean) as { label: string; amount: number }[];

  const unpaidItems = [
    record.prev_unpaid_rent > 0 && { label: '월세 미납', amount: record.prev_unpaid_rent },
    record.prev_unpaid_mgmt > 0 && { label: '관리비 미납', amount: record.prev_unpaid_mgmt },
    record.prev_unpaid_elec > 0 && { label: '전기 미납', amount: record.prev_unpaid_elec },
    record.prev_unpaid_gas > 0 && { label: '가스 미납', amount: record.prev_unpaid_gas },
    record.prev_unpaid_water > 0 && { label: '수도 미납', amount: record.prev_unpaid_water },
    record.prev_unpaid_other > 0 && { label: '기타 미납', amount: record.prev_unpaid_other },
  ].filter(Boolean) as { label: string; amount: number }[];

  const currentSubtotal = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div ref={ref} style={{
      width: 420, fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
      background: '#fff', padding: 32, boxSizing: 'border-box',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '3px solid #c8161d', paddingBottom: 16 }}>
        <div>
          <img src="/logo-c.svg" alt="HOUSEMAN" style={{ height: 28 }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            월간 청구서
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {y}년 {Number(m)}월
          </div>
        </div>
      </div>

      {/* 건물/호실 정보 */}
      <div style={{ background: '#F7F8FA', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div>
            <span style={{ color: '#888', fontWeight: 600 }}>건물</span>
            <div style={{ fontWeight: 700, color: '#111', marginTop: 2 }}>{buildingName}</div>
          </div>
          <div>
            <span style={{ color: '#888', fontWeight: 600 }}>호실</span>
            <div style={{ fontWeight: 700, color: '#111', marginTop: 2 }}>{roomNumber}</div>
          </div>
          <div>
            <span style={{ color: '#888', fontWeight: 600 }}>임차인</span>
            <div style={{ fontWeight: 700, color: '#111', marginTop: 2 }}>{tenantName}</div>
          </div>
          <div>
            <span style={{ color: '#888', fontWeight: 600 }}>납부기한</span>
            <div style={{ fontWeight: 700, color: '#111', marginTop: 2 }}>{fmtDate(record.due_date)}</div>
          </div>
        </div>
      </div>

      {/* 청구 항목 테이블 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#111', marginBottom: 8, letterSpacing: '0.02em' }}>
          청구 내역
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 700, color: '#666' }}>항목</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: '#666' }}>금액</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F0F2F5' }}>
                <td style={{ padding: '8px 0', color: '#333' }}>{item.label}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtMoney(item.amount)}원
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #E5E5E5' }}>
              <td style={{ padding: '10px 0', fontWeight: 800, color: '#111' }}>당월 소계</td>
              <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                {fmtMoney(currentSubtotal)}원
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 미납금 */}
      {unpaidItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#E52528', marginBottom: 8 }}>
            전월 미납금
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {unpaidItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #FEE2E2' }}>
                  <td style={{ padding: '6px 0', color: '#991B1B' }}>{item.label}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#E52528', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtMoney(item.amount)}원
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #FECACA' }}>
                <td style={{ padding: '8px 0', fontWeight: 700, color: '#991B1B' }}>미납 소계</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#E52528', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtMoney(record.prev_unpaid_total)}원
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 납기내/납기후 합계 */}
      <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: '#346aff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
            납기내 합계
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {fmtMoney(record.total_within_due)}원
          </span>
        </div>
        {record.total_after_due > record.total_within_due && (
          <div style={{ background: '#FEF2F2', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#991B1B' }}>
              납기후 ({fmtDate(record.late_fee_apply_date)} 이후)
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#E52528', fontVariantNumeric: 'tabular-nums' }}>
              {fmtMoney(record.total_after_due)}원
            </span>
          </div>
        )}
      </div>

      {/* 입금 계좌 */}
      {accountInfo?.account && (
        <div style={{ background: '#F7F8FA', borderRadius: 8, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6 }}>입금 계좌</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
            {accountInfo.bank} {accountInfo.account}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            예금주: {accountInfo.holder}
          </div>
        </div>
      )}

      {/* 푸터 */}
      <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <img src="/logo-icon.svg" alt="" style={{ height: 16, opacity: 0.4 }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: 9, color: '#888', lineHeight: 1.6 }}>
          HOUSEMAN | 대표 박종호 | 사업자 206-16-25497<br />
          서울시 강남구 학동로8길 9, 5층 | 1544-4150
        </div>
      </div>
    </div>
  );
});

BillingInvoiceTemplate.displayName = 'BillingInvoiceTemplate';
export default BillingInvoiceTemplate;
