import React from 'react';
import { Card, SectionTitle, StatusBadge, ContractDropZone } from '@/components';
import { PhotoDropZone } from '@/components/PhotoDropZone';
import { rtCfg } from '@/components/RoomTypeBadge';
import { inputStyle } from '@/components/Field';
import { getRoomType } from '@/config';
import { flowMap, ownerFieldCfg, defaultHousemanAccount } from '@/config/accountConfig';
import { roomMasterData } from '@/data';
import { fmt } from '@/utils';
import { getBillingStatus } from '../utils/billingStatus';
import { getLateFee } from '../utils/billingStatus';
import { TenantBillingCard } from './TenantBillingCard';
import { TenantContractCard } from './TenantContractCard';
import { persistUpdateTenant } from '../tenantsApi';
import { toast } from 'sonner';

interface TenantDetailProps {
  selectedTenant: Record<string, any>;
  setSelectedTenant: (t: Record<string, any> | null) => void;
  activeTenants: Record<string, any>[];
  setActiveTenants?: (fn: any) => void;
  detailEdit: boolean;
  setDetailEdit: (v: boolean) => void;
  renewEditMode: boolean;
  setRenewEditMode: (v: boolean) => void;
  showContractHistory: boolean;
  setShowContractHistory: (v: boolean) => void;
  setActionMode: (v: string | null) => void;
  parkingInfo: Record<string, any>;
  setParkingInfo?: (fn: any) => void;
  allBuildings: Record<string, any>[];
  buildingAccounts: Record<string, any>;
  roomBalances: Record<string, number>;
  lateFeeOverrides: Record<string, any>;
  billingHistory: Record<string, any>[];
  pastTenantsData: Record<string, any>;
  setPastTenantsData?: (fn: any) => void;
  billingPopup: Record<string, any> | null;
  setBillingPopup: (v: Record<string, any> | null) => void;
  photoModalTenant: Record<string, any> | null;
  setPhotoModalTenant: (v: Record<string, any> | null) => void;
  checkPhotoEdit: Record<string, any> | null;
  setCheckPhotoEdit: (v: Record<string, any> | null) => void;
  checkPhotoView: Record<string, any> | null;
  setCheckPhotoView: (v: Record<string, any> | null) => void;
  photoViewer: Record<string, any> | null;
  setPhotoViewer: (v: Record<string, any> | null) => void;
  buildingData?: Record<string, any>;
  setBuildingData?: (fn: any) => void;
  extraCarCount?: number;
  setExtraCarCount?: (fn: any) => void;
}

export const TenantDetail: React.FC<TenantDetailProps> = ({
  selectedTenant,
  setSelectedTenant,
  activeTenants,
  setActiveTenants,
  detailEdit,
  setDetailEdit,
  renewEditMode,
  setRenewEditMode,
  showContractHistory,
  setShowContractHistory,
  setActionMode,
  parkingInfo,
  setParkingInfo,
  allBuildings,
  buildingAccounts,
  roomBalances,
  lateFeeOverrides,
  billingHistory,
  pastTenantsData,
  setPastTenantsData,
  billingPopup,
  setBillingPopup,
  photoModalTenant,
  setPhotoModalTenant,
  checkPhotoEdit,
  setCheckPhotoEdit,
  checkPhotoView,
  setCheckPhotoView,
  photoViewer,
  setPhotoViewer,
  buildingData = {},
  setBuildingData,
  extraCarCount = 0,
  setExtraCarCount,
}) => {
  const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
  const te = buildingData[`tenant_${t.id}`] || {};
  const updateTE = (patch: Record<string, any>) => setBuildingData?.((prev: any) => ({ ...prev, [`tenant_${t.id}`]: { ...(prev[`tenant_${t.id}`] || {}), ...patch } }));
  const daysToExpiry = t.expiry ? Math.ceil((new Date(t.expiry).getTime() - new Date().getTime()) / 86400000) : 0;
  const roomType = getRoomType(t.building, t.room);
  const depositLabel = roomType === "단기" ? "예치금" : "보증금";
  const hasMoveOutPhotos = (t.moveOutPhotos || []).length > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => setSelectedTenant(null)}>
        <span style={{ fontSize: 20 }}>&larr;</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>임차인 목록으로</span>
      </div>

      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1D23" }}>{t.name}</div>
            <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              {t.building} {t.room}호 &middot;
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: rtCfg(getRoomType(t.building, t.room)).bg,
                  color: rtCfg(getRoomType(t.building, t.room)).c }}>
                {getRoomType(t.building, t.room)}
              </span>
              {t.source === "supabase" && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: "#D1FAE5", color: "#065F46" }}>DB</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* 임차인연결 — 일반임대/근생만 */}
            {(roomType === "일반임대" || roomType === "근생") && setBuildingData && (() => {
              const listingLockKey = `_listingLock_${t.id}`;
              const isLocked = buildingData[listingLockKey] !== false;
              const toggleLock = () => setBuildingData((prev: any) => ({ ...prev, [listingLockKey]: !isLocked }));
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${te.is_listing ? "#FCA5A5" : "#F3E8E8"}`, background: te.is_listing ? "#FEF2F2" : "#FDF8F8", opacity: isLocked ? 0.7 : 1 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: isLocked ? "default" : "pointer" }}>
                      <input type="checkbox" defaultChecked={!!te.is_listing} disabled={isLocked}
                        onChange={e => {
                          updateTE({ is_listing: e.target.checked, listing_available_date: e.target.checked ? (te.listing_available_date || "") : "" });
                          persistUpdateTenant(t.supabaseId, { is_listing: e.target.checked, listing_available_date: e.target.checked ? (te.listing_available_date || null) : null }).catch(() => {});
                        }}
                        style={{ width: 16, height: 16, accentColor: "#DC2626" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: te.is_listing ? "#DC2626" : "#D4A0A0" }}>임차인연결</span>
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: "#8F95A3" }}>입주가능일</span>
                      <input type="date" defaultValue={te.listing_available_date || ""} disabled={isLocked || !te.is_listing}
                        onChange={e => {
                          updateTE({ listing_available_date: e.target.value });
                          persistUpdateTenant(t.supabaseId, { listing_available_date: e.target.value || null }).catch(() => {});
                        }}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1.5px solid #D1D5DB", fontSize: 12, opacity: (!isLocked && te.is_listing) ? 1 : 0.4 }} />
                    </div>
                  </div>
                  <button type="button" onClick={toggleLock}
                    style={{ padding: "6px 8px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: isLocked ? "#F8FAFC" : "#FEF2F2", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                    title={isLocked ? "잠금 해제" : "잠금"}>{isLocked ? "\uD83D\uDD12" : "\uD83D\uDD13"}</button>
                </div>
              );
            })()}
            <StatusBadge status={t.status} />
          </div>
        </div>
      </Card>

      {/* Full Info */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle sub="임차인 전체 정보">📋 임차인 상세</SectionTitle>
          {detailEdit ? (
            <button onClick={() => {
              const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value ?? "";
              const updated = {
                ...t,
                name: g("td-name") || t.name,
                phone: g("td-phone") || t.phone,
                phone2: g("td-phone2") || "",
                phone3: g("td-phone3") || "",
                moveIn: g("td-movein") || t.moveIn || "",
                expiry: g("td-expiry") || t.expiry,
                ssn: g("td-ssn") || "",
                deposit: Number(g("td-deposit").replace(/,/g, "")) || t.deposit,
                rent: Number(g("td-rent").replace(/,/g, "")) || t.rent,
                mgmt: Number(g("td-mgmt").replace(/,/g, "")) || 0,
                rentPayType: (document.getElementById("td-rentPostpaid") as HTMLInputElement)?.checked ? "후불" : "선불",
                mgmtPayType: (document.getElementById("td-mgmtPostpaid") as HTMLInputElement)?.checked ? "후불" : "선불",
                waterPayType: (document.getElementById("td-waterPostpaid") as HTMLInputElement)?.checked ? "후불" : "선불",
                waterAmount: g("td-water") || "",
                cablePayType: (document.getElementById("td-cablePostpaid") as HTMLInputElement)?.checked ? "후불" : "선불",
                cableAmount: g("td-cable") || "",
                pet: g("td-pet") || "",
                rentDay: parseInt(g("td-rentday")) || 0,
                mgmtDay: parseInt(g("td-mgmtday")) || 0,
              };
              setActiveTenants?.((prev: any[]) => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
              setSelectedTenant({ ...t, ...updated });
              // Supabase 동기화
              persistUpdateTenant(t.supabaseId, updated).catch(() => toast.error("DB 저장 실패"));
              setDetailEdit(false);
            }}
              style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              &#10003; 수정완료
            </button>
          ) : (
            <button onClick={() => setDetailEdit(true)}
              style={{ padding: "6px 16px", borderRadius: 8, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ✏️ 수정
            </button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>기본 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주자명</div><input id="td-name" defaultValue={t.name} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", marginBottom: 2, fontWeight: renewEditMode ? 700 : 400 }}>입주일</div><input id="td-movein" type="date" defaultValue={t.moveIn || ""} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} /></div>
              <div><div style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", marginBottom: 2, fontWeight: renewEditMode ? 700 : 400 }}>만기일</div><input id="td-expiry" type="date" defaultValue={t.expiry} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, color: renewEditMode ? "#DC2626" : daysToExpiry < 30 ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode || daysToExpiry < 30 ? 700 : 400, background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>월세일(납부일) <span style={{ fontSize: 8, color: "#B0B5C1" }}>미입력시 입주일</span></div><input id="td-rentday" type="number" min="1" max="31" defaultValue={t.rentDay || ""} placeholder={t.moveIn ? new Date(t.moveIn).getDate() + "일" : "입주일"} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC", textAlign: "center", fontWeight: 700 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리비납부일 <span style={{ fontSize: 8, color: "#B0B5C1" }}>미입력시 월세일</span></div><input id="td-mgmtday" type="number" min="1" max="31" defaultValue={t.mgmtDay || ""} placeholder="월세일과 동일" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC", textAlign: "center", fontWeight: 700 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처1</div><input id="td-phone" defaultValue={t.phone} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처2</div><input id="td-phone2" defaultValue={t.phone2 || ""} placeholder="010-0000-0000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처3</div><input id="td-phone3" defaultValue={t.phone3 || ""} placeholder="010-0000-0000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주민등록번호</div><input id="td-ssn" defaultValue={t.ssn || ""} placeholder="000000-0000000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, fontFamily: "monospace", background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>전입신고</div>
                <select id="td-resident" defaultValue={t.resident || ""} disabled={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, cursor: detailEdit ? "pointer" : "default", background: detailEdit ? "#fff" : "#F8FAFC" }}>
                  <option value="">미확인</option><option value="완료">완료</option><option value="미신고">미신고</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>💰 금액 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", marginBottom: 2, fontWeight: renewEditMode ? 700 : 400 }}>{depositLabel}</div><input id="td-deposit" defaultValue={(t.deposit || 0).toLocaleString()} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} /></div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", fontWeight: renewEditMode ? 700 : 400 }}>임대료</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                    <input id="td-rentPostpaid" type="checkbox" defaultChecked={t.rentPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                    <span style={{ fontSize: 8, color: t.rentPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.rentPayType === "후불" ? 700 : 400 }}>후불</span>
                  </label>
                </div>
                <input id="td-rent" defaultValue={(t.rent || 0).toLocaleString()} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", fontWeight: renewEditMode ? 700 : 400 }}>관리비</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                    <input id="td-mgmtPostpaid" type="checkbox" defaultChecked={t.mgmtPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                    <span style={{ fontSize: 8, color: t.mgmtPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.mgmtPayType === "후불" ? 700 : 400 }}>후불</span>
                  </label>
                </div>
                <input id="td-mgmt" defaultValue={t.mgmt > 0 ? (t.mgmt || 0).toLocaleString() : ""} placeholder="0" readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: "#8F95A3" }}>수도</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                    <input id="td-waterPostpaid" type="checkbox" defaultChecked={t.waterPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                    <span style={{ fontSize: 8, color: t.waterPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.waterPayType === "후불" ? 700 : 400 }}>후불</span>
                  </label>
                </div>
                <input id="td-water" defaultValue={t.waterAmount || ""} placeholder="10,000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: detailEdit ? "#fff" : "#F8FAFC" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: "#8F95A3" }}>케이블</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                    <input id="td-cablePostpaid" type="checkbox" defaultChecked={t.cablePayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                    <span style={{ fontSize: 8, color: t.cablePayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.cablePayType === "후불" ? 700 : 400 }}>후불</span>
                  </label>
                </div>
                <input id="td-cable" defaultValue={t.cableAmount || ""} placeholder="0" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: detailEdit ? "#fff" : "#F8FAFC" }} />
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>🏠 중개 정보</div>
            {(() => { const rm = roomMasterData[`${t.building}_${t.room}`] || {}; return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료 (기본)</div><input id="td-commBase" defaultValue={rm.commFee || ""} placeholder="200,000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료 (이벤트)</div><input id="td-commEvent" defaultValue="" placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
            </div>
            ); })()}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산명</div><input defaultValue="" placeholder="부동산명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 연락처</div><input defaultValue="" placeholder="02-000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 담당자</div><input defaultValue="" placeholder="담당자명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
          </div>

          {/* Right */}
          <div>
            <TenantBillingCard
              t={t}
              allBuildings={allBuildings}
              buildingAccounts={buildingAccounts}
              roomBalances={roomBalances}
              lateFeeOverrides={lateFeeOverrides}
              billingHistory={billingHistory}
              billingPopup={billingPopup}
              setBillingPopup={setBillingPopup}
            />

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>🅿️ 주차</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차번호</div><input value={parkingInfo[t.id]?.carNumber ?? t.carNumber ?? ""} onChange={e => setParkingInfo && setParkingInfo((prev: any) => ({ ...prev, [t.id]: { ...prev[t.id], carNumber: e.target.value, carType: prev[t.id]?.carType ?? t.carType ?? "" } }))} placeholder="12가 3456" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차종</div><input value={parkingInfo[t.id]?.carType ?? t.carType ?? ""} onChange={e => setParkingInfo && setParkingInfo((prev: any) => ({ ...prev, [t.id]: { ...prev[t.id], carType: e.target.value, carNumber: prev[t.id]?.carNumber ?? t.carNumber ?? "" } }))} placeholder="현대 아반떼" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            {/* 근생: 추가 차량 (2~5) */}
            {roomType === "근생" && (() => {
              const extraOptions = [
                { value: "first_come", label: "선착순주차" },
                { value: "designated_free", label: "지정무료" },
                { value: "remote", label: "주차(리모컨)" },
                { value: "paid", label: "주차(주차비)" },
                { value: "remote_paid", label: "주차(리모컨+주차비)" },
              ];
              const visibleCars = [2,3,4,5].slice(0, extraCarCount);
              const totalParkingFee = [1,2,3,4,5].reduce((sum, i) => sum + (parseInt(String(te[`parking_fee_${i}`] || 0).replace(/,/g,'')) || 0), 0);
              const totalRemoteDeposit = [1,2,3,4,5].reduce((sum, i) => sum + (parseInt(String(te[`parking_remote_deposit_${i}`] || 0).replace(/,/g,'')) || 0), 0);
              return (
                <div style={{ marginBottom: 12 }}>
                  {visibleCars.map(i => {
                    const pt = te[`parking_type_${i}`] || "";
                    const showRemote = pt === "remote" || pt === "remote_paid";
                    const showPaid = pt === "paid" || pt === "remote_paid";
                    return (
                      <div key={i} style={{ padding: "8px 0", borderTop: "1px solid #F0F2F5" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3" }}>🚗 차량 {i}</span>
                          {detailEdit && (
                            <button type="button" onClick={() => {
                              const clearPatch: Record<string, any> = {};
                              clearPatch[`parking_type_${i}`] = null;
                              clearPatch[`parking_fee_${i}`] = null;
                              clearPatch[`parking_remote_deposit_${i}`] = null;
                              clearPatch[`car_number_${i}`] = null;
                              clearPatch[`car_type_${i}`] = null;
                              updateTE(clearPatch);
                              setExtraCarCount?.((prev: number) => Math.max(prev - 1, 0));
                            }}
                              style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #FECACA", background: "#FEF2F2", fontSize: 9, fontWeight: 700, color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>
                              ✕ 삭제
                            </button>
                          )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 4 }}>
                          <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주차유형</div>
                            <select id={`te-parkingType${i}`} defaultValue={pt} disabled={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, cursor: detailEdit ? "pointer" : "default" }}>
                              <option value="">선택</option>
                              {extraOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          {showRemote && <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>리모컨 보증금</div><input id={`te-parkingRemoteDeposit${i}`} defaultValue={te[`parking_remote_deposit_${i}`] || ""} readOnly={!detailEdit} placeholder="50,000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>}
                          {showPaid && <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주차비</div><input id={`te-parkingFee${i}`} defaultValue={te[`parking_fee_${i}`] || ""} readOnly={!detailEdit} placeholder="50,000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차번호</div><input id={`te-carNumber${i}`} defaultValue={te[`car_number_${i}`] || ""} readOnly={!detailEdit} placeholder="12가 3456" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                          <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차종</div><input id={`te-carType${i}`} defaultValue={te[`car_type_${i}`] || ""} readOnly={!detailEdit} placeholder="현대 아반떼" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                        </div>
                      </div>
                    );
                  })}
                  {detailEdit && extraCarCount < 4 && (
                    <div style={{ textAlign: "center", padding: "8px 0" }}>
                      <button type="button" onClick={() => setExtraCarCount?.((prev: number) => Math.min(prev + 1, 4))}
                        style={{ padding: "6px 20px", borderRadius: 8, border: "1px dashed #9CA3AF", background: "#F9FAFB", fontSize: 11, fontWeight: 700, color: "#6B7280", cursor: "pointer", fontFamily: "inherit" }}>
                        + 차량 추가 (현재 {extraCarCount + 1}대 / 최대 5대)
                      </button>
                    </div>
                  )}
                  {(totalParkingFee > 0 || totalRemoteDeposit > 0) && (
                    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FDE68A", display: "flex", gap: 16, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: "#92400E" }}>🅿️ 주차 총 비용</span>
                      {totalParkingFee > 0 && <span style={{ color: "#92400E" }}>월 주차비: <b>{totalParkingFee.toLocaleString()}원</b></span>}
                      {totalRemoteDeposit > 0 && <span style={{ color: "#92400E" }}>리모컨 보증금: <b>{totalRemoteDeposit.toLocaleString()}원</b></span>}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📌 기타</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>애완동물 신고</div><input id="td-pet" defaultValue={t.pet || ""} readOnly={!detailEdit} placeholder="애완동물 신고 내용" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기</div>
                <div style={{ padding: "7px 10px", borderRadius: 8, background: daysToExpiry < 30 ? "#FEF2F2" : daysToExpiry < 90 ? "#FFFBEB" : "#F0FDF4", fontSize: 13, fontWeight: 800, color: daysToExpiry < 30 ? "#DC2626" : daysToExpiry < 90 ? "#D97706" : "#059669", textAlign: "center" }}>
                  {daysToExpiry > 0 ? `${daysToExpiry}일 남음` : `${Math.abs(daysToExpiry)}일 경과`}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타1</div><input defaultValue="" placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타2</div><input defaultValue="" placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타3</div><input defaultValue="" placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 6 }}>📎 계약서</div>
              <ContractDropZone
                files={t.contractFiles || []}
                onAdd={(newFiles: any[]) => {
                  const merged = [...(t.contractFiles || []), ...newFiles];
                  setActiveTenants?.((prev: any[]) => prev.map(x => x.id === t.id ? { ...x, contractFiles: merged } : x));
                  setSelectedTenant({ ...selectedTenant, contractFiles: merged });
                }}
                onRemove={(idx: number) => {
                  const updated = (t.contractFiles || []).filter((_: any, i: number) => i !== idx);
                  setActiveTenants?.((prev: any[]) => prev.map(x => x.id === t.id ? { ...x, contractFiles: updated } : x));
                  setSelectedTenant({ ...selectedTenant, contractFiles: updated });
                }}
              />
            </div>
            {/* 입주사진 갤러리 */}
            {(t.moveInPhotos || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 6 }}>📷 입주사진 ({(t.moveInPhotos || []).length}장) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{t.moveIn || ""}</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                {(t.moveInPhotos || []).map((src: any, pi: number) => {
                  const imgSrc = src instanceof File ? URL.createObjectURL(src) : src;
                  const isReal = imgSrc && typeof imgSrc === "string" && (imgSrc.startsWith("data:image/") || imgSrc.startsWith("blob:") || imgSrc.startsWith("http"));
                  return (
                    <div key={pi}
                      onClick={(e) => { e.stopPropagation(); setPhotoViewer({ photos: t.moveInPhotos, index: pi }); }}
                      style={{ aspectRatio: "1", borderRadius: 8, border: "2px solid #BBF7D0", overflow: "hidden", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                      {isReal ? (
                        <img src={imgSrc} alt={`입주 ${pi+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                      ) : (
                        <span style={{ fontSize: 18 }}>🏠</span>
                      )}
                      <div style={{ position: "absolute", bottom: 2, right: 2, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 3 }}>{pi+1}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

          </div>
        </div>
      </Card>

      {/* 재계약 저장/취소 */}
      {renewEditMode && (
        <Card style={{ marginBottom: 16, border: "2px solid #DC2626", background: "#FEF2F2" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#DC2626", marginBottom: 12 }}>📝 재계약 입력 모드 — 적색 필드를 수정 후 저장하세요</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setRenewEditMode(false); }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
            <button onClick={() => {
              const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value ?? "";
              const newMoveIn = g("td-movein") || t.moveIn || "";
              const newExpiry = g("td-expiry") || t.expiry;
              const newDeposit = Number(g("td-deposit").replace(/,/g, "")) || t.deposit;
              const newRent = Number(g("td-rent").replace(/,/g, "")) || t.rent;
              const newMgmt = Number(g("td-mgmt").replace(/,/g, "")) || 0;
              if (!newExpiry) { alert("만기일을 입력하세요"); return; }
              // 이전 계약 정보를 pastTenantsData에 재계약 이력으로 저장
              const historyKey = `${t.building}_${t.room}`;
              const prevRecord = {
                name: t.name, phone: t.phone,
                moveIn: t.moveIn || "", moveOut: newMoveIn || t.expiry || "",
                expiry: t.expiry,
                deposit: t.deposit, rent: t.rent, mgmt: t.mgmt,
                reason: "재계약", settlement: "재계약",
                renewedAt: new Date().toISOString().slice(0, 10),
              };
              setPastTenantsData?.((prev: any) => ({ ...prev, [historyKey]: [...(prev[historyKey] || []), prevRecord] }));
              const updated = {
                ...t,
                moveIn: newMoveIn,
                expiry: newExpiry,
                deposit: newDeposit,
                rent: newRent,
                mgmt: newMgmt,
                overdue: 0,
                prevUnpaid: 0,
                status: "정상",
              };
              setActiveTenants?.((prev: any[]) => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
              setSelectedTenant({ ...t, ...updated });
              setRenewEditMode(false);
              alert("재계약이 저장되었습니다.");
            }} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>📝 재계약 저장</button>
          </div>
        </Card>
      )}


      {/* Action Buttons */}
      {t.status === "퇴실" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <Card onClick={() => setActionMode("movein")} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #BBF7D0", background: "#F0FDF4" }}>
            <span style={{ fontSize: 28 }}>📦</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", marginTop: 8 }}>입주 처리</div>
            <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>신규 임차인 등록</div>
          </Card>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: roomType === "단기" ? "1fr" : "1fr 1fr", gap: 10 }}>
          {roomType !== "단기" && (
            <Card onClick={() => { setRenewEditMode(true); setShowContractHistory(false); }} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #BFDBFE", background: "#EFF6FF" }}>
              <span style={{ fontSize: 28 }}>📝</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#2563EB", marginTop: 8 }}>재계약입력</div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>입주일·만기일·금액 변경</div>
            </Card>
          )}
          <Card onClick={() => setActionMode("moveout")} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #E9D5FF", background: "#FAF5FF" }}>
            <span style={{ fontSize: 28 }}>🧮</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED", marginTop: 8 }}>가상퇴실계산</div>
            <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>정산 시뮬레이션</div>
          </Card>
        </div>
      )}

    </div>
  );
};
