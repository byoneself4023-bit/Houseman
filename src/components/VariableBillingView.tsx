/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from 'react';
import { truncate10 } from '@/data';
import { calculateApportion, saveBillingRecord, updateBillingStatus, saveReading } from '@/lib/billingEngine';
import { toast } from 'sonner';

// ── 금액 포맷 ──
const fmtAmt = (n: number) => n ? n.toLocaleString() : '0';

interface VariableBillingViewProps {
  buildingName: string;
  buildingData?: any;
  tenants?: any[];
  onBack: () => void;
  billingMonth: string;
}

/**
 * 변동관리비 청구 뷰
 * - 좌측: 건물 검침 현황 (한전/수도 청구서 매칭)
 * - 우측: 호실별 안분 결과 테이블
 * - 하단: 관리자 조절 + 승인
 */
export default function VariableBillingView({
  buildingName,
  buildingData = {},
  tenants = [],
  onBack,
  billingMonth,
}: VariableBillingViewProps) {
  // ── 검침 입력 상태 ──
  const [utilityBill, setUtilityBill] = useState({
    elec: { totalAmount: 0, totalUsage: 0, periodStart: '', periodEnd: '' },
    water: { totalAmount: 0, totalUsage: 0, periodStart: '', periodEnd: '' },
  });

  const [roomReadings, setRoomReadings] = useState<Record<string, number>>({});
  const [memoText, setMemoText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // ── 호실별 검침값 입력 ──
  const updateReading = (roomId: string, type: string, value: string) => {
    setRoomReadings(prev => ({
      ...prev,
      [`${roomId}_${type}`]: Number(value) || 0,
    }));
  };

  // ── 유틸리티 청구서 정보 입력 ──
  const updateBill = (type: 'elec' | 'water', field: string, value: string) => {
    setUtilityBill(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: field.includes('Amount') || field.includes('Usage') ? (Number(value) || 0) : value },
    }));
  };

  // ── 안분 계산 ──
  const elecApportion = useMemo(() => {
    if (utilityBill.elec.totalAmount === 0) return null;
    const rooms = tenants.map(t => ({
      roomId: t.id || t.room_id,
      roomNumber: t.room,
      usage: roomReadings[`${t.id || t.room_id}_elec`] || 0,
      isOccupied: t.isActive !== false,
      moveInDate: t.moveInDate || t.move_in_date,
      isDirectPay: false, // TODO: billing_settings에서 확인
    }));
    return calculateApportion({
      totalBillAmount: utilityBill.elec.totalAmount,
      totalBillUsage: utilityBill.elec.totalUsage,
      rooms,
      periodStart: utilityBill.elec.periodStart,
      periodEnd: utilityBill.elec.periodEnd,
    });
  }, [utilityBill.elec, roomReadings, tenants]);

  const waterApportion = useMemo(() => {
    if (utilityBill.water.totalAmount === 0) return null;
    const rooms = tenants.map(t => ({
      roomId: t.id || t.room_id,
      roomNumber: t.room,
      usage: roomReadings[`${t.id || t.room_id}_water`] || 0,
      isOccupied: t.isActive !== false,
      moveInDate: t.moveInDate || t.move_in_date,
      isDirectPay: false,
    }));
    return calculateApportion({
      totalBillAmount: utilityBill.water.totalAmount,
      totalBillUsage: utilityBill.water.totalUsage,
      rooms,
      periodStart: utilityBill.water.periodStart,
      periodEnd: utilityBill.water.periodEnd,
    });
  }, [utilityBill.water, roomReadings, tenants]);

  // ── 총합 검증 ──
  const elecVerified = elecApportion?.totalVerified ?? false;
  const waterVerified = waterApportion?.totalVerified ?? false;

  const [saving, setSaving] = useState(false);
  const [savedRecordIds, setSavedRecordIds] = useState<any[]>([]);

  // ── 확인 완료: meter_readings + billing_records 저장 ──
  const handleConfirm = useCallback(async () => {
    setSaving(true);
    const ids: any[] = [];
    try {
      // 1. 호실별 검침값을 meter_readings에 저장
      for (const t of tenants) {
        const roomId = t.id || t.room_id;
        const elecUsage = roomReadings[`${roomId}_elec`] || 0;
        const waterUsage = roomReadings[`${roomId}_water`] || 0;
        const elecRoom = elecApportion?.rooms?.find((r: any) => r.roomId === roomId);
        const waterRoom = waterApportion?.rooms?.find((r: any) => r.roomId === roomId);

        if (elecUsage > 0 && elecRoom) {
          await saveReading({
            building_id: buildingData._supabaseId,
            room_id: roomId,
            type: 'elec',
            reading_date: utilityBill.elec.periodEnd || new Date().toISOString().slice(0, 10),
            reading_value: elecUsage,
            usage: elecRoom.usage,
            amount: elecRoom.total,
            period_start: utilityBill.elec.periodStart || null,
            period_end: utilityBill.elec.periodEnd || null,
            billing_month: billingMonth,
            customer_number: buildingData.electricCommonCustomerNumber || null,
            source: 'manual',
          });
        }
        if (waterUsage > 0 && waterRoom) {
          await saveReading({
            building_id: buildingData._supabaseId,
            room_id: roomId,
            type: 'water',
            reading_date: utilityBill.water.periodEnd || new Date().toISOString().slice(0, 10),
            reading_value: waterUsage,
            usage: waterRoom.usage,
            amount: waterRoom.total,
            period_start: utilityBill.water.periodStart || null,
            period_end: utilityBill.water.periodEnd || null,
            billing_month: billingMonth,
            customer_number: buildingData.waterCommonCustomerNumber || null,
            source: 'manual',
          });
        }

        // 2. billing_records 생성 (변동관리비 = 월세 + 고정관리비 + 전기안분 + 수도안분)
        const rent = truncate10(t.rent || 0);
        const mgmt = truncate10(t.managementFee || t.management_fee || 0);
        const elecFee = elecRoom?.total || 0;
        const waterFee = waterRoom?.total || 0;
        const total = rent + mgmt + elecFee + waterFee;

        const dueDay = t.paymentDueDay || t.payment_due_day || new Date(t.moveInDate || t.move_in_date || '2026-01-01').getDate();
        const dueDate = new Date();
        dueDate.setDate(dueDay);
        if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);

        const record = {
          building_id: buildingData._supabaseId,
          room_id: roomId,
          tenant_id: t.supabaseId || t.id,
          billing_month: billingMonth,
          rent,
          management_fee: mgmt,
          electric_fee: elecFee,
          water_fee: waterFee,
          total,
          total_within_due: total,
          total_after_due: total, // 연체수수료는 별도 계산
          due_date: dueDate.toISOString().slice(0, 10),
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        };

        const saved = await saveBillingRecord(record);
        if (saved) ids.push(saved.id);
      }

      setSavedRecordIds(ids);
      setIsConfirmed(true);
      toast.success(`${ids.length}건 확인 완료 (meter_readings + billing_records 저장)`);
    } catch (err: any) {
      console.error('확인 실패:', err);
      toast.error('저장 중 오류 발생: ' + err.message);
    }
    setSaving(false);
  }, [tenants, roomReadings, elecApportion, waterApportion, buildingData, billingMonth, utilityBill]);

  // ── 발송 ──
  const handleSend = useCallback(async () => {
    if (savedRecordIds.length === 0) { toast.warning('확인 완료 후 발송 가능합니다'); return; }
    setSaving(true);
    let ok = 0;
    for (const id of savedRecordIds) {
      const success = await updateBillingStatus(id, 'sent');
      if (success) ok++;
    }
    setSaving(false);
    toast.success(`${ok}건 발송 완료`);
  }, [savedRecordIds]);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button className="billing-btn ghost px-3 py-1.5" onClick={onBack}>
          ← 목록
        </button>
        <h2 className="text-lg font-bold text-hm-text m-0">
          {buildingName}
        </h2>
        <span className="billing-type-badge variable">변동관리비</span>
        <span className="text-xs text-hm-text-muted ml-auto">
          {tenants.length}호실 · {billingMonth}
        </span>
      </div>

      {/* 2열 레이아웃: 청구서 입력 + 안분 결과 */}
      <div className="grid grid-cols-[360px_1fr] gap-5 items-start">

        {/* ── 좌측: 청구서 정보 입력 ── */}
        <div className="flex flex-col gap-4">

          {/* 전기 청구서 */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
            <div className="text-sm font-bold text-hm-text mb-3.5 flex items-center gap-1.5">
              <span className="text-base">⚡</span> 전기 청구서
              {elecVerified && <span className="text-xs text-hm-success font-bold bg-hm-success-bg px-1.5 py-0.5 rounded">✓ 일치</span>}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">총 금액 (원)</span>
                <input
                  type="number" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.elec.totalAmount || ''}
                  onChange={e => updateBill('elec', 'totalAmount', e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">총 사용량 (kWh)</span>
                <input
                  type="number" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.elec.totalUsage || ''}
                  onChange={e => updateBill('elec', 'totalUsage', e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">사용기간 시작</span>
                <input
                  type="date" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.elec.periodStart}
                  onChange={e => updateBill('elec', 'periodStart', e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">사용기간 종료</span>
                <input
                  type="date" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.elec.periodEnd}
                  onChange={e => updateBill('elec', 'periodEnd', e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* 수도 청구서 */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
            <div className="text-sm font-bold text-hm-text mb-3.5 flex items-center gap-1.5">
              <span className="text-base">💧</span> 수도 청구서
              {waterVerified && <span className="text-xs text-hm-success font-bold bg-hm-success-bg px-1.5 py-0.5 rounded">✓ 일치</span>}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">총 금액 (원)</span>
                <input
                  type="number" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.water.totalAmount || ''}
                  onChange={e => updateBill('water', 'totalAmount', e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">총 사용량 (㎥)</span>
                <input
                  type="number" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.water.totalUsage || ''}
                  onChange={e => updateBill('water', 'totalUsage', e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">사용기간 시작</span>
                <input
                  type="date" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.water.periodStart}
                  onChange={e => updateBill('water', 'periodStart', e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">사용기간 종료</span>
                <input
                  type="date" className="w-full px-2.5 py-2 rounded-md border border-[#CCCCCC] text-xs font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  value={utilityBill.water.periodEnd}
                  onChange={e => updateBill('water', 'periodEnd', e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* 관리자 메모 */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
            <div className="text-sm font-bold text-hm-text mb-2.5">관리자 메모</div>
            <textarea
              value={memoText}
              onChange={e => setMemoText(e.target.value)}
              placeholder="검침일 오차, 특이사항 등..."
              className="w-full h-20 p-2.5 rounded-lg border border-[#CCCCCC] text-xs font-[inherit] resize-y outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
            />
          </div>
        </div>

        {/* ── 우측: 안분 결과 테이블 ── */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
            <span className="text-sm font-bold text-hm-text">호실별 검침 & 안분 결과</span>
            <div className="flex gap-2">
              {elecApportion && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  elecVerified ? 'bg-hm-success-bg text-hm-success' : 'bg-hm-danger-bg text-hm-danger'
                }`}>
                  전기 {elecVerified ? '✓' : '✗'} {fmtAmt(utilityBill.elec.totalAmount)}원
                </span>
              )}
              {waterApportion && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  waterVerified ? 'bg-hm-success-bg text-hm-success' : 'bg-hm-danger-bg text-hm-danger'
                }`}>
                  수도 {waterVerified ? '✓' : '✗'} {fmtAmt(utilityBill.water.totalAmount)}원
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>호실</th>
                  <th>임차인</th>
                  <th className="amount">전기 검침</th>
                  <th className="amount">전기 사용량</th>
                  <th className="amount">전기 금액</th>
                  <th className="amount">공용전기</th>
                  <th className="amount">수도 검침</th>
                  <th className="amount">수도 사용량</th>
                  <th className="amount">수도 금액</th>
                  <th className="amount">공용수도</th>
                  <th className="amount font-bold">합계</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => {
                  const roomId = t.id || t.room_id;
                  const elecRoom = elecApportion?.rooms?.find((r: any) => r.roomId === roomId);
                  const waterRoom = waterApportion?.rooms?.find((r: any) => r.roomId === roomId);
                  const total = (elecRoom?.total || 0) + (waterRoom?.total || 0);

                  return (
                    <tr key={roomId}>
                      <td className="font-bold">{t.room}</td>
                      <td className="text-xs text-[#333]">{t.name}</td>
                      {/* 전기 검침 입력 */}
                      <td className="amount">
                        <input
                          className="billing-inline-input"
                          type="number"
                          value={roomReadings[`${roomId}_elec`] || ''}
                          onChange={e => updateReading(roomId, 'elec', e.target.value)}
                          placeholder="kWh"
                          style={{ width: 70 }}
                        />
                      </td>
                      <td className="amount text-[#666]">{elecRoom?.usage || '-'}</td>
                      <td className="amount">{elecRoom ? fmtAmt(elecRoom.amount) : '-'}</td>
                      <td className="amount text-[#346aff] text-xs">
                        {elecRoom ? fmtAmt(elecRoom.commonAmount) : '-'}
                      </td>
                      {/* 수도 검침 입력 */}
                      <td className="amount">
                        <input
                          className="billing-inline-input"
                          type="number"
                          value={roomReadings[`${roomId}_water`] || ''}
                          onChange={e => updateReading(roomId, 'water', e.target.value)}
                          placeholder="㎥"
                          style={{ width: 70 }}
                        />
                      </td>
                      <td className="amount text-[#666]">{waterRoom?.usage || '-'}</td>
                      <td className="amount">{waterRoom ? fmtAmt(waterRoom.amount) : '-'}</td>
                      <td className="amount text-[#346aff] text-xs">
                        {waterRoom ? fmtAmt(waterRoom.commonAmount) : '-'}
                      </td>
                      <td className="amount font-bold text-hm-text">
                        {total > 0 ? fmtAmt(total) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {/* 합계 행 */}
                {(elecApportion || waterApportion) && (
                  <>
                    <tr className="bg-hm-bg font-bold">
                      <td colSpan={2} className="text-xs font-bold text-hm-text">호실 합계</td>
                      <td className="amount" />
                      <td className="amount">{elecApportion ? elecApportion.rooms.reduce((s: number, r: any) => s + r.usage, 0) : '-'}</td>
                      <td className="amount">{elecApportion ? fmtAmt(elecApportion.rooms.reduce((s: number, r: any) => s + r.amount, 0)) : '-'}</td>
                      <td className="amount text-[#346aff]">
                        {elecApportion ? fmtAmt(elecApportion.rooms.reduce((s: number, r: any) => s + r.commonAmount, 0)) : '-'}
                      </td>
                      <td className="amount" />
                      <td className="amount">{waterApportion ? waterApportion.rooms.reduce((s: number, r: any) => s + r.usage, 0) : '-'}</td>
                      <td className="amount">{waterApportion ? fmtAmt(waterApportion.rooms.reduce((s: number, r: any) => s + r.amount, 0)) : '-'}</td>
                      <td className="amount text-[#346aff]">
                        {waterApportion ? fmtAmt(waterApportion.rooms.reduce((s: number, r: any) => s + r.commonAmount, 0)) : '-'}
                      </td>
                      <td className="amount font-bold">
                        {fmtAmt((elecApportion?.rooms.reduce((s: number, r: any) => s + r.total, 0) || 0) + (waterApportion?.rooms.reduce((s: number, r: any) => s + r.total, 0) || 0))}
                      </td>
                    </tr>
                    {/* 건물주 부담 (공실분) */}
                    {((elecApportion?.ownerBurden || 0) + (waterApportion?.ownerBurden || 0)) > 0 && (
                      <tr className="bg-hm-warning-bg">
                        <td colSpan={2} className="text-xs font-bold text-hm-warning">건물주 부담 (공실분)</td>
                        <td className="amount" colSpan={3} />
                        <td className="amount text-hm-warning">
                          {elecApportion ? fmtAmt(elecApportion.ownerBurden) : '-'}
                        </td>
                        <td className="amount" colSpan={3} />
                        <td className="amount text-hm-warning">
                          {waterApportion ? fmtAmt(waterApportion.ownerBurden) : '-'}
                        </td>
                        <td className="amount text-hm-warning font-bold">
                          {fmtAmt((elecApportion?.ownerBurden || 0) + (waterApportion?.ownerBurden || 0))}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* 승인 영역 */}
          <div className={`px-5 py-4 border-t border-[#E5E5E5] flex items-center justify-between ${
            isConfirmed ? 'bg-hm-success-bg' : 'bg-white'
          }`}>
            <div className="text-xs text-[#666]">
              {isConfirmed
                ? <span className="text-hm-success font-bold">✓ 관리자 확인 완료</span>
                : '변동관리비는 관리자 확인 후 발송됩니다'}
            </div>
            <div className="flex gap-2.5">
              {!isConfirmed ? (
                <button
                  className="billing-btn primary"
                  onClick={handleConfirm}
                  disabled={(!elecApportion && !waterApportion) || saving}
                >
                  {saving ? '저장 중...' : '확인 완료 (DB 저장)'}
                </button>
              ) : (
                <>
                  <button
                    className="billing-btn ghost"
                    onClick={() => setIsConfirmed(false)}
                  >
                    수정
                  </button>
                  <button
                    className="billing-btn success"
                    onClick={handleSend}
                    disabled={saving}
                  >
                    {saving ? '처리 중...' : '발송'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
