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
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
      background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
      zIndex: 9998, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid #E5E5E5',
    }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>청구 설정</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {buildingName} {roomNumber}호 {tenantName && `· ${tenantName}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer' }}>✕</button>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* 전기/가스 청구수수료 (단기만) */}
        {isShortTerm && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 12 }}>청구수수료</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>전기 수수료 (원)</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number" value={settings.elec_billing_fee}
                    onChange={e => update('elec_billing_fee', Number(e.target.value) || 0)}
                    style={inputStyle}
                  />
                  <button
                    onClick={() => update('elec_billing_fee', settings.elec_billing_fee > 0 ? 0 : 2500)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: '1px solid #E5E5E5',
                      background: settings.elec_billing_fee === 0 ? '#FEF2F2' : '#fff',
                      color: settings.elec_billing_fee === 0 ? '#E52528' : '#666',
                    }}
                  >
                    {settings.elec_billing_fee === 0 ? '면제중' : '면제'}
                  </button>
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>가스 수수료 (원)</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number" value={settings.gas_billing_fee}
                    onChange={e => update('gas_billing_fee', Number(e.target.value) || 0)}
                    style={inputStyle}
                  />
                  <button
                    onClick={() => update('gas_billing_fee', settings.gas_billing_fee > 0 ? 0 : 1370)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: '1px solid #E5E5E5',
                      background: settings.gas_billing_fee === 0 ? '#FEF2F2' : '#fff',
                      color: settings.gas_billing_fee === 0 ? '#E52528' : '#666',
                    }}
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
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 12 }}>납부방식</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { field: 'elec_payment_method', label: '전기' },
                { field: 'gas_payment_method', label: '가스' },
              ].map(({ field, label }) => (
                <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#333', width: 40 }}>{label}</span>
                  {(['proxy', 'direct'] as const).map(val => (
                    <button
                      key={val}
                      onClick={() => update(field, val)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: settings[field] === val ? '1.5px solid #346aff' : '1px solid #E5E5E5',
                        background: settings[field] === val ? '#EBF0FF' : '#fff',
                        color: settings[field] === val ? '#346aff' : '#666',
                      }}
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
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 12 }}>
            연체수수료 (임차인 개별)
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
            비워두면 건물 기본 설정을 따릅니다. 0으로 설정하면 면제.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>수수료율 (%)</span>
              <input
                type="number" value={settings.late_fee_rate ?? ''}
                onChange={e => update('late_fee_rate', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="건물 기본"
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>적용 시점</span>
              <input
                type="number" value={settings.late_fee_apply_value ?? ''}
                onChange={e => update('late_fee_apply_value', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="건물 기본"
                style={inputStyle}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E5E5', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="billing-btn ghost" onClick={onClose}>취소</button>
        <button className="billing-btn primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#888', letterSpacing: '0.02em' };
const inputStyle: React.CSSProperties = {
  flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #CCCCCC',
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  fontVariantNumeric: 'tabular-nums',
};
