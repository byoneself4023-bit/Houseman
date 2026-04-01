/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { getBillingSettings, saveBillingSettings } from '@/lib/billingEngine';
import { toast } from 'sonner';

interface RoomBillingSettingsPanelProps {
  roomId: any;
  buildingId: any;
  tenantId?: any;
  tenantName?: string;
  roomNumber?: string;
  buildingName?: string;
  isShortTerm?: boolean;
  onClose: () => void;
  onSaved?: (result: any) => void;
}

const inputCls = 'flex-1 px-2.5 py-2 rounded-md border border-[#CCCCCC] text-sm font-[inherit] outline-none tabular-nums focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors';

/**
 * RoomBillingSettingsPanel -- 호실별 청구 설정 패널
 * 수수료 변경/면제, 전기가스 납부방식, 연체수수료 오버라이드
 */
export default function RoomBillingSettingsPanel({
  roomId, buildingId, tenantId,
  tenantName, roomNumber, buildingName,
  isShortTerm,
  onClose, onSaved,
}: RoomBillingSettingsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    elec_billing_fee: 2500,
    gas_billing_fee: 1370,
    elec_payment_method: 'proxy',
    gas_payment_method: 'proxy',
    billing_case: null,
    late_fee_rate: null,
    late_fee_apply_type: null,
    late_fee_apply_value: null,
  });

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    getBillingSettings(roomId).then(data => {
      if (data) setSettings((prev: any) => ({ ...prev, ...data }));
      setLoading(false);
    });
  }, [roomId]);

  const update = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    const result = await saveBillingSettings({
      building_id: buildingId,
      room_id: roomId,
      tenant_id: tenantId || null,
      ...settings,
    });
    setSaving(false);
    if (result) {
      if (onSaved) onSaved(result);
      onClose();
    } else {
      toast.error('저장 실패');
    }
  }, [buildingId, roomId, tenantId, settings, onSaved, onClose]);

  if (loading) return null;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[360px] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.1)] z-[9998] flex flex-col border-l border-[#E5E5E5]">
      {/* 헤더 */}
      <div className="px-6 py-5 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-hm-text">청구 설정</div>
            <div className="text-xs text-hm-text-muted mt-0.5">
              {buildingName} {roomNumber}호 {tenantName && `· ${tenantName}`}
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-lg text-hm-text-muted cursor-pointer hover:text-hm-text transition-colors">✕</button>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* 전기/가스 청구수수료 (단기만) */}
        {isShortTerm && (
          <div className="mb-6">
            <div className="text-sm font-bold text-hm-text mb-3">청구수수료</div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">전기 수수료 (원)</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="number" value={settings.elec_billing_fee}
                    onChange={e => update('elec_billing_fee', Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                  <button
                    onClick={() => update('elec_billing_fee', settings.elec_billing_fee > 0 ? 0 : 2500)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer border transition-colors ${
                      settings.elec_billing_fee === 0
                        ? 'border-[#E5E5E5] bg-hm-danger-bg text-hm-danger'
                        : 'border-[#E5E5E5] bg-white text-[#666] hover:bg-hm-bg-hover'
                    }`}
                  >
                    {settings.elec_billing_fee === 0 ? '면제중' : '면제'}
                  </button>
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-hm-text-muted tracking-wide">가스 수수료 (원)</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="number" value={settings.gas_billing_fee}
                    onChange={e => update('gas_billing_fee', Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                  <button
                    onClick={() => update('gas_billing_fee', settings.gas_billing_fee > 0 ? 0 : 1370)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer border transition-colors ${
                      settings.gas_billing_fee === 0
                        ? 'border-[#E5E5E5] bg-hm-danger-bg text-hm-danger'
                        : 'border-[#E5E5E5] bg-white text-[#666] hover:bg-hm-bg-hover'
                    }`}
                  >
                    {settings.gas_billing_fee === 0 ? '면제중' : '면제'}
                  </button>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 전기/가스 납부방식 (단기만) */}
        {isShortTerm && (
          <div className="mb-6">
            <div className="text-sm font-bold text-hm-text mb-3">납부방식</div>
            <div className="flex flex-col gap-3">
              {[
                { field: 'elec_payment_method', label: '전기' },
                { field: 'gas_payment_method', label: '가스' },
              ].map(({ field, label }) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#333] w-10">{label}</span>
                  {(['proxy', 'direct'] as const).map(val => (
                    <button
                      key={val}
                      onClick={() => update(field, val)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-150 ${
                        settings[field] === val
                          ? 'border-[1.5px] border-[#346aff] bg-[#EBF0FF] text-[#346aff]'
                          : 'border border-[#E5E5E5] bg-white text-[#666] hover:border-[#346aff]/40'
                      }`}
                    >
                      {val === 'proxy' ? '대납 후 청구' : '직접 납부'}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 연체수수료 오버라이드 */}
        <div className="mb-6">
          <div className="text-sm font-bold text-hm-text mb-3">
            연체수수료 (임차인 개별)
          </div>
          <div className="text-xs text-hm-text-muted mb-2.5">
            비워두면 건물 기본 설정을 따릅니다. 0으로 설정하면 면제.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-hm-text-muted tracking-wide">수수료율 (%)</span>
              <input
                type="number" value={settings.late_fee_rate ?? ''}
                onChange={e => update('late_fee_rate', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="건물 기본"
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-hm-text-muted tracking-wide">적용 시점</span>
              <input
                type="number" value={settings.late_fee_apply_value ?? ''}
                onChange={e => update('late_fee_apply_value', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="건물 기본"
                className={inputCls}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 py-4 border-t border-[#E5E5E5] flex gap-3 justify-end">
        <button className="billing-btn ghost" onClick={onClose}>취소</button>
        <button className="billing-btn primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
