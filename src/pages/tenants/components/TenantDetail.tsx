import React from 'react';
import { Card, SectionTitle, StatusBadge, ContractDropZone } from '@/components';
import { PhotoDropZone } from '@/components/PhotoDropZone';
import { rtCfg } from '@/components/RoomTypeBadge';
import { inputClassName } from '@/components/Field';
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

const tdInputBase = `${inputClassName} px-[10px] py-[7px] text-xs`;

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
      <div className="flex items-center gap-2 mb-5 cursor-pointer" onClick={() => setSelectedTenant(null)}>
        <span className="text-xl">&larr;</span>
        <span className="text-sm font-bold text-hm-blue">임차인 목록으로</span>
      </div>

      {/* Header */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xl font-bold text-hm-text">{t.name}</div>
            <div className="text-xs text-hm-text-muted mt-0.5 flex items-center gap-1.5">
              {t.building} {t.room}호 &middot;
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: rtCfg(getRoomType(t.building, t.room)).bg,
                  color: rtCfg(getRoomType(t.building, t.room)).c }}>
                {getRoomType(t.building, t.room)}
              </span>
              {t.source === "supabase" && <span className="text-xs font-bold px-[5px] py-0.5 rounded bg-[#D1FAE5] text-[#065F46]">DB</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 임차인연결 — 일반임대/근생만 */}
            {(roomType === "일반임대" || roomType === "근생") && setBuildingData && (() => {
              const listingLockKey = `_listingLock_${t.id}`;
              const isLocked = buildingData[listingLockKey] !== false;
              const toggleLock = () => setBuildingData((prev: any) => ({ ...prev, [listingLockKey]: !isLocked }));
              return (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ border: `1.5px solid ${te.is_listing ? "#FCA5A5" : "#F3E8E8"}`, background: te.is_listing ? "var(--color-hm-danger-bg)" : "#FDF8F8", opacity: isLocked ? 0.7 : 1 }}>
                    <label className={`flex items-center gap-1.5 ${isLocked ? "cursor-default" : "cursor-pointer"}`}>
                      <input type="checkbox" defaultChecked={!!te.is_listing} disabled={isLocked}
                        onChange={e => {
                          updateTE({ is_listing: e.target.checked, listing_available_date: e.target.checked ? (te.listing_available_date || "") : "" });
                          persistUpdateTenant(t.supabaseId, { is_listing: e.target.checked, listing_available_date: e.target.checked ? (te.listing_available_date || null) : null }).catch(() => {});
                        }}
                        className="w-4 h-4 accent-hm-danger" />
                      <span className={`text-sm font-bold ${te.is_listing ? "text-hm-danger" : "text-[#D4A0A0]"}`}>임차인연결</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-hm-text-muted">입주가능일</span>
                      <input type="date" defaultValue={te.listing_available_date || ""} disabled={isLocked || !te.is_listing}
                        onChange={e => {
                          updateTE({ listing_available_date: e.target.value });
                          persistUpdateTenant(t.supabaseId, { listing_available_date: e.target.value || null }).catch(() => {});
                        }}
                        className="px-2 py-1 rounded-md border-[1.5px] border-[#D1D5DB] text-xs" style={{ opacity: (!isLocked && te.is_listing) ? 1 : 0.4 }} />
                    </div>
                  </div>
                  <button type="button" onClick={toggleLock}
                    className={`px-2 py-1.5 rounded-lg border-[1.5px] border-hm-input-border text-sm leading-none cursor-pointer transition-colors hover:opacity-80 ${isLocked ? "bg-hm-bg-slate" : "bg-hm-danger-bg"}`}
                    title={isLocked ? "잠금 해제" : "잠금"}>{isLocked ? "\uD83D\uDD12" : "\uD83D\uDD13"}</button>
                </div>
              );
            })()}
            <StatusBadge status={t.status} />
          </div>
        </div>
      </Card>

      {/* Full Info */}
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-3">
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
              className="px-4 py-1.5 rounded-lg border-none bg-hm-success text-white font-bold text-xs cursor-pointer font-[inherit] transition-opacity hover:opacity-90">
              &#10003; 수정완료
            </button>
          ) : (
            <button onClick={() => setDetailEdit(true)}
              className="px-4 py-1.5 rounded-lg border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark font-bold text-xs cursor-pointer font-[inherit] transition-opacity hover:opacity-90">
              ✏️ 수정
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Left */}
          <div>
            <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">기본 정보</div>
            <div className="grid grid-cols-1 gap-2 mb-2">
              <div><div className="text-xs text-hm-text-muted mb-1">입주자명</div><input id="td-name" defaultValue={t.name} readOnly={!detailEdit} className={`${tdInputBase} ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className={`text-xs mb-1 ${renewEditMode ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>입주일</div><input id="td-movein" type="date" defaultValue={t.moveIn || ""} readOnly={!detailEdit && !renewEditMode} className={`${tdInputBase} ${renewEditMode ? "bg-hm-danger-bg border-2 border-hm-danger text-hm-danger font-bold" : detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} style={renewEditMode ? {} : { color: "var(--color-hm-text)" }} /></div>
              <div><div className={`text-xs mb-1 ${renewEditMode ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>만기일</div><input id="td-expiry" type="date" defaultValue={t.expiry} readOnly={!detailEdit && !renewEditMode} className={`${tdInputBase} ${renewEditMode ? "bg-hm-danger-bg border-2 border-hm-danger" : detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} style={{ color: renewEditMode ? "var(--color-hm-danger)" : daysToExpiry < 30 ? "var(--color-hm-danger)" : "var(--color-hm-text)", fontWeight: renewEditMode || daysToExpiry < 30 ? 700 : 400 }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className="text-xs text-hm-text-muted mb-1">월세일(납부일) <span className="text-[8px] text-[#B0B5C1]">미입력시 입주일</span></div><input id="td-rentday" type="number" min="1" max="31" defaultValue={t.rentDay || ""} placeholder={t.moveIn ? new Date(t.moveIn).getDate() + "일" : "입주일"} readOnly={!detailEdit} className={`${tdInputBase} text-center font-bold ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">관리비납부일 <span className="text-[8px] text-[#B0B5C1]">미입력시 월세일</span></div><input id="td-mgmtday" type="number" min="1" max="31" defaultValue={t.mgmtDay || ""} placeholder="월세일과 동일" readOnly={!detailEdit} className={`${tdInputBase} text-center font-bold ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><div className="text-xs text-hm-text-muted mb-1">연락처1</div><input id="td-phone" defaultValue={t.phone} readOnly={!detailEdit} className={`${tdInputBase} ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">연락처2</div><input id="td-phone2" defaultValue={t.phone2 || ""} placeholder="010-0000-0000" readOnly={!detailEdit} className={`${tdInputBase} ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">연락처3</div><input id="td-phone3" defaultValue={t.phone3 || ""} placeholder="010-0000-0000" readOnly={!detailEdit} className={`${tdInputBase} ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div><div className="text-xs text-hm-text-muted mb-1">주민등록번호</div><input id="td-ssn" defaultValue={t.ssn || ""} placeholder="000000-0000000" readOnly={!detailEdit} className={`${tdInputBase} font-mono ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">전입신고</div>
                <select id="td-resident" defaultValue={t.resident || ""} disabled={!detailEdit} className={`${tdInputBase} ${detailEdit ? "cursor-pointer bg-white" : "cursor-default bg-hm-bg-slate"}`}>
                  <option value="">미확인</option><option value="완료">완료</option><option value="미신고">미신고</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">💰 금액 정보</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><div className={`text-xs mb-1 ${renewEditMode ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>{depositLabel}</div><input id="td-deposit" defaultValue={(t.deposit || 0).toLocaleString()} readOnly={!detailEdit && !renewEditMode} className={`${tdInputBase} text-right ${renewEditMode ? "bg-hm-danger-bg border-2 border-hm-danger text-hm-danger font-bold" : detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} style={renewEditMode ? {} : { color: "var(--color-hm-text)" }} /></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${renewEditMode ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>임대료</span>
                  <label className={`flex items-center gap-0.5 ${detailEdit ? "cursor-pointer" : "cursor-default"}`}>
                    <input id="td-rentPostpaid" type="checkbox" defaultChecked={t.rentPayType === "후불"} disabled={!detailEdit} className={`w-3 h-3 ${detailEdit ? "cursor-pointer" : "cursor-default"}`} />
                    <span className={`text-[8px] ${t.rentPayType === "후불" ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>후불</span>
                  </label>
                </div>
                <input id="td-rent" defaultValue={(t.rent || 0).toLocaleString()} readOnly={!detailEdit && !renewEditMode} className={`${tdInputBase} text-right ${renewEditMode ? "bg-hm-danger-bg border-2 border-hm-danger text-hm-danger font-bold" : detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} style={renewEditMode ? {} : { color: "var(--color-hm-text)" }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${renewEditMode ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>관리비</span>
                  <label className={`flex items-center gap-0.5 ${detailEdit ? "cursor-pointer" : "cursor-default"}`}>
                    <input id="td-mgmtPostpaid" type="checkbox" defaultChecked={t.mgmtPayType === "후불"} disabled={!detailEdit} className={`w-3 h-3 ${detailEdit ? "cursor-pointer" : "cursor-default"}`} />
                    <span className={`text-[8px] ${t.mgmtPayType === "후불" ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>후불</span>
                  </label>
                </div>
                <input id="td-mgmt" defaultValue={t.mgmt > 0 ? (t.mgmt || 0).toLocaleString() : ""} placeholder="0" readOnly={!detailEdit && !renewEditMode} className={`${tdInputBase} text-right ${renewEditMode ? "bg-hm-danger-bg border-2 border-hm-danger text-hm-danger font-bold" : detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} style={renewEditMode ? {} : { color: "var(--color-hm-text)" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-hm-text-muted">수도</span>
                  <label className={`flex items-center gap-0.5 ${detailEdit ? "cursor-pointer" : "cursor-default"}`}>
                    <input id="td-waterPostpaid" type="checkbox" defaultChecked={t.waterPayType === "후불"} disabled={!detailEdit} className={`w-3 h-3 ${detailEdit ? "cursor-pointer" : "cursor-default"}`} />
                    <span className={`text-[8px] ${t.waterPayType === "후불" ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>후불</span>
                  </label>
                </div>
                <input id="td-water" defaultValue={t.waterAmount || ""} placeholder="10,000" readOnly={!detailEdit} className={`${tdInputBase} text-right ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-hm-text-muted">케이블</span>
                  <label className={`flex items-center gap-0.5 ${detailEdit ? "cursor-pointer" : "cursor-default"}`}>
                    <input id="td-cablePostpaid" type="checkbox" defaultChecked={t.cablePayType === "후불"} disabled={!detailEdit} className={`w-3 h-3 ${detailEdit ? "cursor-pointer" : "cursor-default"}`} />
                    <span className={`text-[8px] ${t.cablePayType === "후불" ? "text-hm-danger font-bold" : "text-hm-text-muted font-normal"}`}>후불</span>
                  </label>
                </div>
                <input id="td-cable" defaultValue={t.cableAmount || ""} placeholder="0" readOnly={!detailEdit} className={`${tdInputBase} text-right ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} />
              </div>
            </div>

            <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">🏠 중개 정보</div>
            {(() => { const rm = roomMasterData[`${t.building}_${t.room}`] || {}; return (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className="text-xs text-hm-text-muted mb-1">중개수수료 (기본)</div><input id="td-commBase" defaultValue={rm.commFee || ""} placeholder="200,000" className={`${tdInputBase} text-right`} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">중개수수료 (이벤트)</div><input id="td-commEvent" defaultValue="" placeholder="0" className={`${tdInputBase} text-right`} /></div>
            </div>
            ); })()}
            <div className="grid grid-cols-3 gap-2">
              <div><div className="text-xs text-hm-text-muted mb-1">부동산명</div><input defaultValue="" placeholder="부동산명" className={tdInputBase} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">부동산 연락처</div><input defaultValue="" placeholder="02-000-0000" className={tdInputBase} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">부동산 담당자</div><input defaultValue="" placeholder="담당자명" className={tdInputBase} /></div>
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

            <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">🅿️ 주차</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className="text-xs text-hm-text-muted mb-1">차번호</div><input value={parkingInfo[t.id]?.carNumber ?? t.carNumber ?? ""} onChange={e => setParkingInfo && setParkingInfo((prev: any) => ({ ...prev, [t.id]: { ...prev[t.id], carNumber: e.target.value, carType: prev[t.id]?.carType ?? t.carType ?? "" } }))} placeholder="12가 3456" className={tdInputBase} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">차종</div><input value={parkingInfo[t.id]?.carType ?? t.carType ?? ""} onChange={e => setParkingInfo && setParkingInfo((prev: any) => ({ ...prev, [t.id]: { ...prev[t.id], carType: e.target.value, carNumber: prev[t.id]?.carNumber ?? t.carNumber ?? "" } }))} placeholder="현대 아반떼" className={tdInputBase} /></div>
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
                <div className="mb-3">
                  {visibleCars.map(i => {
                    const pt = te[`parking_type_${i}`] || "";
                    const showRemote = pt === "remote" || pt === "remote_paid";
                    const showPaid = pt === "paid" || pt === "remote_paid";
                    return (
                      <div key={i} className="py-2 border-t border-[#F0F2F5]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-hm-text-muted">🚗 차량 {i}</span>
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
                              className="px-2 py-0.5 rounded border border-hm-danger-border bg-hm-danger-bg text-xs font-bold text-hm-danger cursor-pointer font-[inherit] transition-opacity hover:opacity-80">
                              ✕ 삭제
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-1">
                          <div><div className="text-xs text-hm-text-muted mb-1">주차유형</div>
                            <select id={`te-parkingType${i}`} defaultValue={pt} disabled={!detailEdit} className={`${tdInputBase} ${detailEdit ? "cursor-pointer" : "cursor-default"}`}>
                              <option value="">선택</option>
                              {extraOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          {showRemote && <div><div className="text-xs text-hm-text-muted mb-1">리모컨 보증금</div><input id={`te-parkingRemoteDeposit${i}`} defaultValue={te[`parking_remote_deposit_${i}`] || ""} readOnly={!detailEdit} placeholder="50,000" className={`${tdInputBase} text-right`} /></div>}
                          {showPaid && <div><div className="text-xs text-hm-text-muted mb-1">주차비</div><input id={`te-parkingFee${i}`} defaultValue={te[`parking_fee_${i}`] || ""} readOnly={!detailEdit} placeholder="50,000" className={`${tdInputBase} text-right`} /></div>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><div className="text-xs text-hm-text-muted mb-1">차번호</div><input id={`te-carNumber${i}`} defaultValue={te[`car_number_${i}`] || ""} readOnly={!detailEdit} placeholder="12가 3456" className={tdInputBase} /></div>
                          <div><div className="text-xs text-hm-text-muted mb-1">차종</div><input id={`te-carType${i}`} defaultValue={te[`car_type_${i}`] || ""} readOnly={!detailEdit} placeholder="현대 아반떼" className={tdInputBase} /></div>
                        </div>
                      </div>
                    );
                  })}
                  {detailEdit && extraCarCount < 4 && (
                    <div className="text-center py-2">
                      <button type="button" onClick={() => setExtraCarCount?.((prev: number) => Math.min(prev + 1, 4))}
                        className="px-5 py-1.5 rounded-lg border border-dashed border-[#9CA3AF] bg-hm-bg-hover text-xs font-bold text-[#6B7280] cursor-pointer font-[inherit] transition-colors hover:bg-[#F3F4F6]">
                        + 차량 추가 (현재 {extraCarCount + 1}대 / 최대 5대)
                      </button>
                    </div>
                  )}
                  {(totalParkingFee > 0 || totalRemoteDeposit > 0) && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex gap-4 text-xs">
                      <span className="font-bold text-[#92400E]">🅿️ 주차 총 비용</span>
                      {totalParkingFee > 0 && <span className="text-[#92400E]">월 주차비: <b>{totalParkingFee.toLocaleString()}원</b></span>}
                      {totalRemoteDeposit > 0 && <span className="text-[#92400E]">리모컨 보증금: <b>{totalRemoteDeposit.toLocaleString()}원</b></span>}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">📌 기타</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className="text-xs text-hm-text-muted mb-1">애완동물 신고</div><input id="td-pet" defaultValue={t.pet || ""} readOnly={!detailEdit} placeholder="애완동물 신고 내용" className={`${tdInputBase} ${detailEdit ? "bg-white" : "bg-hm-bg-slate"}`} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">만기</div>
                <div className="px-[10px] py-[7px] rounded-lg text-sm font-bold text-center" style={{ background: daysToExpiry < 30 ? "var(--color-hm-danger-bg)" : daysToExpiry < 90 ? "#FFFBEB" : "#F0FDF4", color: daysToExpiry < 30 ? "var(--color-hm-danger)" : daysToExpiry < 90 ? "#D97706" : "var(--color-hm-success)" }}>
                  {daysToExpiry > 0 ? `${daysToExpiry}일 남음` : `${Math.abs(daysToExpiry)}일 경과`}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div><div className="text-xs text-hm-text-muted mb-1">기타1</div><input defaultValue="" placeholder="입력" className={tdInputBase} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">기타2</div><input defaultValue="" placeholder="입력" className={tdInputBase} /></div>
              <div><div className="text-xs text-hm-text-muted mb-1">기타3</div><input defaultValue="" placeholder="입력" className={tdInputBase} /></div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-hm-text mb-1.5">📎 계약서</div>
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
            <div className="mt-3">
              <div className="text-xs font-bold text-hm-text mb-1.5">📷 입주사진 ({(t.moveInPhotos || []).length}장) <span className="text-xs text-hm-text-muted font-semibold">{t.moveIn || ""}</span></div>
              <div className="grid grid-cols-6 gap-1.5">
                {(t.moveInPhotos || []).map((src: any, pi: number) => {
                  const imgSrc = src instanceof File ? URL.createObjectURL(src) : src;
                  const isReal = imgSrc && typeof imgSrc === "string" && (imgSrc.startsWith("data:image/") || imgSrc.startsWith("blob:") || imgSrc.startsWith("http"));
                  return (
                    <div key={pi}
                      onClick={(e) => { e.stopPropagation(); setPhotoViewer({ photos: t.moveInPhotos, index: pi }); }}
                      className="aspect-square rounded-lg border-2 border-[#BBF7D0] overflow-hidden bg-[#F0FDF4] flex items-center justify-center cursor-pointer relative">
                      {isReal ? (
                        <img src={imgSrc} alt={`입주 ${pi+1}`} className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <span className="text-lg">🏠</span>
                      )}
                      <div className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[8px] font-bold px-1 py-px rounded-[3px]">{pi+1}</div>
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
        <Card className="mb-4 border-2 border-hm-danger bg-hm-danger-bg">
          <div className="text-sm font-bold text-hm-danger mb-3">📝 재계약 입력 모드 — 적색 필드를 수정 후 저장하세요</div>
          <div className="flex gap-2">
            <button onClick={() => { setRenewEditMode(false); }} className="flex-1 py-3 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] transition-colors hover:bg-hm-bg-hover">취소</button>
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
            }} className="flex-[2] py-3 rounded-lg border-none bg-hm-danger text-white font-bold text-sm cursor-pointer font-[inherit] transition-opacity hover:opacity-90">📝 재계약 저장</button>
          </div>
        </Card>
      )}


      {/* Action Buttons */}
      {t.status === "퇴실" ? (
        <div className="grid grid-cols-1 gap-3">
          <Card onClick={() => setActionMode("movein")} className="cursor-pointer text-center py-5 px-3 border-[1.5px] border-[#BBF7D0] bg-[#F0FDF4] transition-shadow hover:shadow-md">
            <span className="text-2xl">📦</span>
            <div className="text-sm font-bold text-hm-success mt-2">입주 처리</div>
            <div className="text-xs text-hm-text-muted mt-1">신규 임차인 등록</div>
          </Card>
        </div>
      ) : (
        <div className={`grid gap-3 ${roomType === "단기" ? "grid-cols-1" : "grid-cols-2"}`}>
          {roomType !== "단기" && (
            <Card onClick={() => { setRenewEditMode(true); setShowContractHistory(false); }} className="cursor-pointer text-center py-5 px-3 border-[1.5px] border-[#BFDBFE] bg-hm-blue-bg transition-shadow hover:shadow-md">
              <span className="text-2xl">📝</span>
              <div className="text-sm font-bold text-hm-blue-dark mt-2">재계약입력</div>
              <div className="text-xs text-hm-text-muted mt-1">입주일·만기일·금액 변경</div>
            </Card>
          )}
          <Card onClick={() => setActionMode("moveout")} className="cursor-pointer text-center py-5 px-3 border-[1.5px] border-[#E9D5FF] bg-[#FAF5FF] transition-shadow hover:shadow-md">
            <span className="text-2xl">🧮</span>
            <div className="text-sm font-bold text-[#7C3AED] mt-2">가상퇴실계산</div>
            <div className="text-xs text-hm-text-muted mt-1">정산 시뮬레이션</div>
          </Card>
        </div>
      )}

    </div>
  );
};
