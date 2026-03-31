// @ts-nocheck
import { useState } from 'react';
import { inputClassName } from './Field';
import { PhotoDropZone } from './PhotoDropZone';

/* ══════════════════════════════════════════════════════════════
   RoomFormSection — Shared room detail form component
   Used by BuildingDetailPage (view/edit) and BuildingsPage (create).
   Props:
     data          — room data object (master in detail page, or room object in create)
     onChange      — function(patch) to update room data
     buildingData  — building-level saved data (for account settings display)
     editMode      — true for edit/create, false for view
     roomType      — computed room type ("단기"/"일반임대"/"근생"/"관리사무소")
     buildingTypes — array of active building types (for suffix computation)
     photos        — room photos array (optional, if managed separately from data)
     onAddPhotos   — function(dataUrls) to add photos
     onRemovePhoto — function(index) to remove a photo
   ══════════════════════════════════════════════════════════════ */

const tenantAccountTypeLabels = {
  "short_houseman_only": "단기 - 하우스맨 계좌만",
  "short_owner_only": "단기 - 건물주 계좌만",
  "short_rent_to_owner": "단기 - 혼합1 (건물주:임대료, HM:관리비)",
  "short_rent_mgmt_to_owner": "단기 - 혼합2 (건물주:임대료+관리비, HM:공과금)",
  "short_rent_mgmt_util_to_owner": "단기 - 혼합3 (건물주:임대료+관리비+공과금)",
  "general_one_account": "일반/근생 - 단일계좌",
  "general_two_accounts": "일반/근생 - 2개 계좌",
  "general_three_accounts": "일반/근생 - 3개 계좌",
  "agency_houseman": "관리대행 - 하우스맨",
  "agency_owner": "관리대행 - 건물주",
};

const tenantAcctOptions = [
  { value: "", label: "건물 설정 따름" },
  { value: "short_houseman_only", label: "단기 - 하우스맨 계좌만" },
  { value: "short_owner_only", label: "단기 - 건물주 계좌만" },
  { value: "short_rent_to_owner", label: "단기 - 혼합1" },
  { value: "short_rent_mgmt_to_owner", label: "단기 - 혼합2" },
  { value: "short_rent_mgmt_util_to_owner", label: "단기 - 혼합3" },
  { value: "general_one_account", label: "일반/근생 - 단일계좌" },
  { value: "general_two_accounts", label: "일반/근생 - 2개 계좌" },
  { value: "general_three_accounts", label: "일반/근생 - 3개 계좌" },
  { value: "agency_houseman", label: "관리대행 - 하우스맨" },
  { value: "agency_owner", label: "관리대행 - 건물주" },
];

const tenantAcctLabel = (v) => { const found = tenantAcctOptions.find(o => o.value === v); return found ? found.label : v; };
const billingTypeLabel = (v) => v === "prepaid" ? "선불" : v === "postpaid" ? "후불" : v;
const standardParkingTypeLabels = { remote: "주차리모컨", free: "선착순주차가능", prohibited: "주차불가", paid: "주차요금있음" };

/* ── Read-only display cell ── */
const RoCell = ({ label, value, color = "#8B95A1", style: extraStyle = {} }) => (
  <div className="py-1.5 px-2.5 bg-hm-bg-hover rounded-md border border-hm-border" style={extraStyle}>
    <div className="text-[11px] mb-[3px]" style={{ color }}>{label}</div>
    <div className="text-[13px] font-semibold text-hm-text">{value || "-"}</div>
  </div>
);

/* ── Edit input cell ── */
const EditCell = ({ label, color = "#8F95A3", children }) => (
  <div>
    <div className="text-[11px] mb-[3px]" style={{ color }}>{label}</div>
    {children}
  </div>
);

const sInputCn = `${inputClassName} py-[7px] px-2.5 text-xs`;
const sInputRightCn = `${sInputCn} text-right`;
const sSelectCn = `${sInputCn} cursor-pointer`;

export function RoomFormSection({
  data,
  onChange,
  buildingData = {},
  editMode = false,
  roomType = "단기",
  buildingTypes = [],
  photos,
  onAddPhotos,
  onRemovePhoto,
}) {
  const d = data || {};
  const saved = buildingData;

  const isShort = roomType === "단기";
  const isLong = roomType === "일반임대";
  const isComm = roomType === "근생";
  const isAgency = roomType === "관리사무소";

  // For parking fee visibility toggle in edit mode
  const [showParkingFee, setShowParkingFee] = useState(d.standardParkingType === "paid");

  // Helper to set field
  const set = (field, value) => onChange({ [field]: value });

  // Photos: use props if provided, otherwise use data.photos
  const roomPhotos = photos !== undefined ? photos : (d.photos || []);

  /* ── Account block items (for account target section) ── */
  const suffix = buildingTypes.length > 1 ? `_${roomType}` : "";
  const getBldgTarget = (field) => saved[`${field}${suffix}`] || saved[field] || "";

  const allBlockItems = [
    { field: "depositAccountTarget", label: isShort ? "🔑 예치금" : "🔑 보증금", color: "#7C3AED", show: !isAgency },
    { field: "rentAccountTarget", label: "💰 월세", color: "#DC2626", show: !isAgency },
    { field: "managementFeeAccountTarget", label: "🏠 관리비", color: "#2563EB", show: true },
    { field: "utilityAccountTarget", label: isComm ? "💧 변동관리비" : "💧 공과금", color: "#059669", show: !isAgency },
    { field: "electricGasAccountTarget", label: "⚡ 전기+가스", color: "#EA580C", show: isShort },
  ].filter(i => i.show);

  const roomOverrides = {};
  allBlockItems.forEach(i => { roomOverrides[i.field] = d[i.field] || ""; });
  const hasOverride = allBlockItems.some(i => roomOverrides[i.field]);

  const acctOpts = [{ value: "houseman", label: "🏢 하우스맨" }];
  if (saved.billingAccount1) acctOpts.push({ value: "owner_1", label: `① ${saved.billingAccount1Bank || "건물주"} ...${(saved.billingAccount1 || "").slice(-4)}` });
  if (saved.billingAccount2) acctOpts.push({ value: "owner_2", label: `② ${saved.billingAccount2Bank || "건물주"} ...${(saved.billingAccount2 || "").slice(-4)}` });
  if (saved.billingAccount3) acctOpts.push({ value: "owner_3", label: `③ ${saved.billingAccount3Bank || "건물주"} ...${(saved.billingAccount3 || "").slice(-4)}` });
  const acctLabel = (val) => val === "no_billing" ? "🚫 청구안함" : (acctOpts.find(o => o.value === val)?.label || "미설정");

  /* ═══════════════════════════════════════════════════
     EDIT MODE
     ═══════════════════════════════════════════════════ */
  if (editMode) {
    return (
      <div>
        {/* ── 하우스맨 관리 여부 (최상단) ── */}
        <div className={`mb-3 py-2 px-3 rounded-lg border-[1.5px] flex items-center gap-2.5 ${d.isManaged === false ? 'bg-hm-danger-bg border-red-200' : 'bg-green-50 border-green-200'}`}>
          <input type="checkbox" checked={d.isManaged !== false}
            onChange={e => {
              const newVal = e.target.checked;
              const msg = newVal
                ? "이 호실을 하우스맨 관리로 변경합니다. 계속하시겠습니까?"
                : "⚠️ 이 호실을 비관리로 변경합니다.\n비관리 호실은 청구/정산/수금에서 제외됩니다.\n정말 변경하시겠습니까?";
              if (!window.confirm(msg)) return;
              set("isManaged", newVal);
            }}
            className="w-4 h-4 cursor-pointer" />
          <span className={`text-xs font-bold cursor-pointer ${d.isManaged === false ? 'text-hm-danger' : 'text-hm-success'}`}>
            하우스맨 관리 호실
          </span>
          <span className="text-[9px] text-[#8B95A1]">변경 시 확인 필요</span>
        </div>

        {/* ── Row 1: 기본 정보 ── */}
        <div className="text-[11px] font-[800] text-hm-blue-dark mb-2">📋 기본 정보</div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <EditCell label="호실형태">
            {(isShort || isLong) ? (
              <input value="주택" readOnly className={`${sInputCn} bg-gray-100 text-gray-500`} />
            ) : (
              <select value={d.roomLayout || ""} onChange={e => set("roomLayout", e.target.value)} className={sSelectCn}>
                <option value="">선택</option>
                {["상가","오피스","상가/오피스"].map(t => <option key={t}>{t}</option>)}
              </select>
            )}
          </EditCell>
          {(isShort || isLong) && (
          <EditCell label="방구조">
            <select value={d.roomType || ""} onChange={e => set("roomType", e.target.value)} className={sSelectCn}>
              <option value="">선택</option>
              {["원룸","분리형원룸","투룸","쓰리룸","포룸"].map(t => <option key={t}>{t}</option>)}
            </select>
          </EditCell>
          )}
          <EditCell label="면적 (㎡)">
            <input value={d.area || ""} onChange={e => set("area", e.target.value)} placeholder="26.4" className={sInputCn} />
          </EditCell>
          {!isAgency && (
            <EditCell label="부동산수수료">
              <input value={d.standardBrokerFee || ""} onChange={e => set("standardBrokerFee", e.target.value)} placeholder="100,000" className={sInputRightCn} />
            </EditCell>
          )}
        </div>

        {/* ── Row 2: 금액 ── */}
        {isAgency ? null : (
          <>
            <div className="text-[11px] font-[800] text-hm-success mb-2">💰 금액</div>
            <div className="grid grid-cols-5 gap-1.5 mb-1.5">
              <EditCell label="예치금" color="#059669">
                <input value={d.standardDeposit || ""} onChange={e => set("standardDeposit", e.target.value)} placeholder="0" className={sInputRightCn} />
              </EditCell>
              <EditCell label="임대료" color="#059669">
                <input value={d.standardRent || ""} onChange={e => set("standardRent", e.target.value)} placeholder="0" className={sInputRightCn} />
              </EditCell>
              <EditCell label="할인임대료" color="#DC2626">
                <input value={d.rentDiscountLimit || ""} onChange={e => set("rentDiscountLimit", e.target.value)} placeholder="0"
                  className={`${sInputRightCn} bg-hm-danger-bg border-[1.5px] border-red-200`} />
              </EditCell>
              <EditCell label="관리비" color="#059669">
                <input value={d.standardManagementFee || ""} onChange={e => set("standardManagementFee", e.target.value)} placeholder="0" className={sInputRightCn} />
              </EditCell>
              <EditCell label="수도" color="#059669">
                <input value={d.standardWaterFee || ""} onChange={e => set("standardWaterFee", e.target.value)} placeholder="0" className={sInputRightCn} />
              </EditCell>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {isShort && (
                <EditCell label="인터넷" color="#059669">
                  <input value={d.standardInternetFee || ""} onChange={e => set("standardInternetFee", e.target.value)} placeholder="0" className={sInputRightCn} />
                </EditCell>
              )}
              {(isShort || isLong) && (
                <EditCell label="퇴실청소비" color="#059669">
                  <input value={d.standardCleaningFee || ""} onChange={e => set("standardCleaningFee", e.target.value)} placeholder="0" className={sInputRightCn} />
                </EditCell>
              )}
              <EditCell label="주차여부" color="#059669">
                <select value={d.standardParkingType || ""} onChange={e => { set("standardParkingType", e.target.value); setShowParkingFee(e.target.value === "paid"); }} className={sSelectCn}>
                  <option value="">선택</option>
                  <option value="remote">주차리모컨</option>
                  <option value="free">선착순주차가능</option>
                  <option value="prohibited">주차불가</option>
                  <option value="paid">주차요금있음</option>
                </select>
              </EditCell>
              {showParkingFee && (
                <EditCell label="주차요금" color="#059669">
                  <input value={d.standardParkingFee || ""} onChange={e => set("standardParkingFee", e.target.value)} placeholder="0" className={sInputRightCn} />
                </EditCell>
              )}
            </div>
          </>
        )}

        {/* ── Row 3: 선후불 설정 ── */}
        {isAgency ? null : <>
        <div className="text-xs font-bold text-violet-600 mb-1.5">⚡ 선후불 설정</div>
        <div className={`grid ${isShort ? 'grid-cols-3' : 'grid-cols-1'} gap-1.5 mb-3`}>
          <EditCell label="관리비 선후불" color="#8F95A3">
            <select value={d.mgmtBillingTypeOverride || ""} onChange={e => set("managementFeeBillingTypeOverride", e.target.value)} className={sSelectCn}>
              <option value="">{billingTypeLabel(saved.mgmtBillingType || "prepaid")} (건물)</option>
              <option value="prepaid">선불</option>
              <option value="postpaid">후불</option>
            </select>
          </EditCell>
          {isShort && (
            <EditCell label="수도비 선후불" color="#8F95A3">
              <select value={d.waterBillingTypeOverride || ""} onChange={e => set("waterBillingTypeOverride", e.target.value)} className={sSelectCn}>
                <option value="">{billingTypeLabel(saved.waterBillingType || "prepaid")} (건물)</option>
                <option value="prepaid">선불</option>
                <option value="postpaid">후불</option>
              </select>
            </EditCell>
          )}
          {isShort && (
            <EditCell label="인터넷,TV 선후불" color="#8F95A3">
              <select value={d.internetBillingTypeOverride || ""} onChange={e => set("internetBillingTypeOverride", e.target.value)} className={sSelectCn}>
                <option value="">{billingTypeLabel(saved.internetBillingType || "prepaid")} (건물)</option>
                <option value="prepaid">선불</option>
                <option value="postpaid">후불</option>
              </select>
            </EditCell>
          )}
        </div>
        </>}

        {/* ── Row 4: 공과금 고객번호 (단기만) ── */}
        {isShort && (
          <div className="mb-3">
            <div className="text-xs font-bold text-indigo-500 mb-1.5">🔌 공과금 고객번호</div>
            <div className="grid grid-cols-3 gap-1.5">
              <EditCell label="전기" color="#6366F1">
                <input value={d.electricCustomerNumber || ""} onChange={e => set("electricCustomerNumber", e.target.value)} className={`${sInputCn} font-mono`} />
              </EditCell>
              <EditCell label="가스" color="#6366F1">
                <input value={d.gasCustomerNumber || ""} onChange={e => set("gasCustomerNumber", e.target.value)} className={`${sInputCn} font-mono`} />
              </EditCell>
              <EditCell label="납부방식" color="#6366F1">
                <select value={d.electricGasPaymentType || "houseman_charge"} onChange={e => set("electricGasPaymentType", e.target.value)} className={sSelectCn}>
                  <option value="houseman_charge">하우스맨 대납 후 청구</option>
                  <option value="tenant_direct">임차인 직접 납부</option>
                </select>
              </EditCell>
            </div>
          </div>
        )}

        {/* ── Row 5: 기타 설정 ── */}
        <div className="text-xs font-bold text-hm-text-sub mb-1.5">⚙️ 기타 설정</div>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {/* 수도 납부방식 - 일반임대만 */}
          {isLong && (
            <EditCell label="수도 납부방식" color="#8F95A3">
              <select value={d.waterPaymentType || ""} onChange={e => set("waterPaymentType", e.target.value)} className={sSelectCn}>
                <option value="">기본 (하우스맨 청구)</option>
                <option value="tenant_direct">임차인 직접 납부</option>
              </select>
            </EditCell>
          )}

          {/* ── 항목별 입금 계좌 블럭 ── */}
          {!isAgency && (
          <div className="col-span-full mt-2">
            <div className={`p-2.5 px-3 rounded-lg border ${hasOverride ? 'bg-hm-warning-bg border-orange-200' : 'bg-[#F0F4FF] border-blue-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className={`text-[10px] font-bold ${hasOverride ? 'text-hm-warning' : 'text-hm-blue-dark'}`}>
                  📦 입금 계좌 ({roomType}) {hasOverride ? "— 호실별 변경됨" : "— 건물 기본값"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(allBlockItems.length, allBlockItems.length <= 4 ? 4 : 3)}, 1fr)`, gap: 8 }}>
                {allBlockItems.map(item => {
                  const bldgVal = getBldgTarget(item.field);
                  const roomVal = roomOverrides[item.field];
                  return (
                    <div key={item.field} className={`p-2 px-2.5 rounded-lg border ${roomVal ? 'bg-hm-warning-bg border-orange-200' : 'bg-hm-bg-hover border-[#E5E8EB]'}`}>
                      <div className="text-[10px] font-bold mb-1" style={{ color: item.color }}>{item.label}</div>
                      <select value={roomVal} onChange={e => set(item.field, e.target.value)} className={sSelectCn}>
                        <option value="">건물 따름 ({acctLabel(bldgVal)})</option>
                        <option value="no_billing">🚫 청구안함</option>
                        {acctOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* 변동관리비 메모 - 근생만 */}
          {isComm && (
            <div className="col-span-full">
              <div className="text-[8px] text-amber-600 mb-0.5">변동관리비 메모 <span className="text-amber-600 text-[7px]">근생 전용</span></div>
              <textarea value={d.variableManagementFeeMemo || ""} onChange={e => set("variableManagementFeeMemo", e.target.value)} placeholder="근생 전용 - 변동관리비 메모"
                rows={2} className={`${inputClassName} py-[5px] px-2 text-[11px] w-full resize-y min-h-[36px]`} />
            </div>
          )}
        </div>


        {/* ── Row 7: 사진 ── */}
        {!isAgency && (
          <PhotoDropZone photos={roomPhotos} maxPhotos={30} label="호실 사진"
            onAdd={onAddPhotos || ((dataUrls) => set("photos", [...roomPhotos, ...dataUrls].slice(0, 30)))}
            onRemove={onRemovePhoto || ((pi) => { const updated = [...roomPhotos]; updated.splice(pi, 1); set("photos", updated); })}
          />
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     VIEW MODE (read-only)
     ═══════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── 하우스맨 관리 여부 표시 ── */}
      <div className={`mb-3 py-2 px-3 rounded-lg border-[1.5px] flex items-center gap-2.5 ${d.isManaged === false ? 'bg-hm-danger-bg border-red-200' : 'bg-green-50 border-green-200'}`}>
        <span className={`text-xs font-bold ${d.isManaged === false ? 'text-hm-danger' : 'text-hm-success'}`}>
          {d.isManaged === false ? "❌ 비관리 호실" : "✅ 하우스맨 관리 호실"}
        </span>
      </div>

      {/* ── Row 1: 기본 정보 ── */}
      <div className="text-[11px] font-[800] text-hm-blue-dark mb-2">📋 기본 정보</div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <RoCell label="호실형태" value={(isShort || isLong) ? "주택" : d.roomLayout} />
        {(isShort || isLong) && <RoCell label="방구조" value={d.roomType} />}
        <RoCell label="면적 (㎡)" value={d.area ? `${d.area}` : null} />
        {!isAgency && <RoCell label="부동산수수료" value={d.standardBrokerFee} />}
      </div>

      {/* ── Row 2: 금액 ── */}
      {isAgency ? null : (
        <>
          <div className="text-[11px] font-[800] text-hm-success mb-2">💰 금액</div>
          <div className="grid grid-cols-5 gap-1.5 mb-1.5">
            <RoCell label="예치금" value={d.standardDeposit} color="#059669" />
            <RoCell label="임대료" value={d.standardRent} color="#059669" />
            <RoCell label="할인임대료" value={d.rentDiscountLimit} color="#DC2626"
              style={d.rentDiscountLimit ? { background: "#FEF2F2", border: "1.5px solid #FECACA" } : {}} />
            <RoCell label="관리비" value={d.standardManagementFee} color="#059679" />
            <RoCell label="수도" value={d.standardWaterFee} color="#059669" />
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {isShort && <RoCell label="인터넷" value={d.standardInternetFee} color="#059669" />}
            {(isShort || isLong) && <RoCell label="퇴실청소비" value={d.standardCleaningFee} color="#059669" />}
            <RoCell label="주차여부" value={standardParkingTypeLabels[d.standardParkingType]} color="#059669" />
            {d.standardParkingType === "paid" && <RoCell label="주차요금" value={d.standardParkingFee} color="#059669" />}
          </div>
        </>
      )}

      {/* ── Row 3: 선후불 설정 ── */}
      {!isAgency && (
      <>
      <div className="text-xs font-bold text-violet-600 mb-1.5">⚡ 선후불 설정</div>
      <div className={`grid ${isShort ? 'grid-cols-3' : 'grid-cols-1'} gap-1.5 mb-3`}>
        <RoCell label="관리비 선후불"
          value={d.mgmtBillingTypeOverride ? billingTypeLabel(d.mgmtBillingTypeOverride) : billingTypeLabel(saved.mgmtBillingType || "prepaid")} />
        {isShort && (
          <RoCell label="수도비 선후불"
            value={d.waterBillingTypeOverride ? billingTypeLabel(d.waterBillingTypeOverride) : billingTypeLabel(saved.waterBillingType || "prepaid")} />
        )}
        {isShort && (
          <RoCell label="인터넷,TV 선후불"
            value={d.internetBillingTypeOverride ? billingTypeLabel(d.internetBillingTypeOverride) : billingTypeLabel(saved.internetBillingType || "prepaid")} />
        )}
      </div>
      </>
      )}

      {/* ── Row 4: 공과금 고객번호 (단기만) ── */}
      {isShort && (
        <div className="mb-3">
          <div className="text-xs font-bold text-indigo-500 mb-1.5">🔌 공과금 고객번호</div>
          <div className="grid grid-cols-3 gap-1.5">
            <RoCell label="전기" value={d.electricCustomerNumber} color="#6366F1" />
            <RoCell label="가스" value={d.gasCustomerNumber} color="#6366F1" />
            <RoCell label="납부방식" value={d.electricGasPaymentType === "tenant_direct" ? "임차인 직접 납부" : "하우스맨 대납 후 청구"} color="#6366F1" />
          </div>
        </div>
      )}

      {/* ── Row 5: 기타 설정 ── */}
      {!isAgency && (
      <>
      <div className="text-xs font-bold text-hm-text-sub mb-1.5">⚙️ 기타 설정</div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {isLong && <RoCell label="수도 납부방식" value={d.waterPaymentType === "tenant_direct" ? "임차인 직접 납부" : "기본 (하우스맨 청구)"} />}
        {/* ── 항목별 입금 계좌 블럭 ── */}
        <div className="col-span-full mt-2">
          <div className={`p-2.5 px-3 rounded-lg border ${hasOverride ? 'bg-hm-warning-bg border-orange-200' : 'bg-[#F0F4FF] border-blue-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <div className={`text-[10px] font-bold ${hasOverride ? 'text-hm-warning' : 'text-hm-blue-dark'}`}>
                📦 입금 계좌 ({roomType}) {hasOverride ? "— 호실별 변경됨" : "— 건물 기본값"}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(allBlockItems.length, allBlockItems.length <= 4 ? 4 : 3)}, 1fr)`, gap: 8 }}>
              {allBlockItems.map(item => {
                const bldgVal = getBldgTarget(item.field);
                const roomVal = roomOverrides[item.field];
                const displayVal = roomVal || bldgVal;
                const isOverridden = !!roomVal;
                return (
                  <div key={item.field} className={`p-2 px-2.5 rounded-lg border ${isOverridden ? 'bg-hm-warning-bg border-orange-200' : 'bg-hm-bg-hover border-[#E5E8EB]'}`}>
                    <div className="text-[10px] font-bold mb-1" style={{ color: item.color }}>{item.label}</div>
                    <div className={`text-[11px] font-semibold ${displayVal ? 'text-[#191F28]' : 'text-[#8B95A1]'}`}>
                      {acctLabel(displayVal)}
                      {isOverridden && <span className="text-[8px] text-hm-warning ml-1">개별</span>}
                      {!isOverridden && <span className="text-[8px] text-[#8B95A1] ml-1">(건물)</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* 변동관리비 메모 - 근생만 */}
        {isComm && (
          <div className="col-span-full">
            <div className="py-1.5 px-2 bg-hm-warning-bg rounded-md border border-orange-200">
              <div className="text-[8px] text-amber-600 mb-0.5">변동관리비 메모 <span className="text-amber-600 text-[7px]">근생 전용</span></div>
              <div className="text-[10px] text-amber-800 whitespace-pre-wrap">{d.variableManagementFeeMemo || "-"}</div>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* ── Row 6: 계좌 설정 (건물 기준 · 읽기전용) ── */}
      {!isAgency && <AccountSettingsDisplay saved={saved} />}

      {/* ── Row 7: 메모 ── */}

      {/* ── Row 8: 사진 ── */}
      {!isAgency && (
        <PhotoDropZone photos={roomPhotos} maxPhotos={30} label="호실 사진"
          onAdd={onAddPhotos || ((dataUrls) => set("photos", [...roomPhotos, ...dataUrls].slice(0, 30)))}
          onRemove={onRemovePhoto || ((pi) => { const updated = [...roomPhotos]; updated.splice(pi, 1); set("photos", updated); })}
        />
      )}
    </div>
  );
}

/* ── Account Settings Display (building level, read-only) ── */
function AccountSettingsDisplay({ saved }) {
  return (
    <div className="p-2.5 px-3 bg-[#F8FAFC] rounded-lg border border-hm-border mt-2 mb-3">
      <div className="text-[11px] font-bold text-hm-blue-dark mb-1.5">
        💳 계좌 설정 <span className="text-[9px] text-[#8B95A1] font-medium">(건물 설정 기준)</span>
      </div>
      <div className="text-[10px] text-[#4E5968] mb-1">
        입금방식: {saved.tenantAccountType ? (tenantAccountTypeLabels[saved.tenantAccountType] || saved.tenantAccountType) : "미설정"}
      </div>
      {saved.housemanBillingAccount && (
        <div className="text-[10px] text-[#4E5968] mb-1">
          하우스맨 계좌: {saved.housemanBillingAccount}
        </div>
      )}
      {[1,2,3].map(n => saved[`billingAccount${n}`] && (
        <div key={n} className="text-[10px] text-[#4E5968] mb-0.5">
          건물주 청구계좌 {n}: {saved[`billingAccount${n}Bank`] || ""} {saved[`billingAccount${n}`]} ({saved[`billingAccount${n}Holder`] || ""})
        </div>
      ))}
      {saved.rentAccountTarget && (
        <div className="text-[9px] text-gray-500 mt-1 py-1 px-2 bg-[#F0F4FF] rounded">
          월세→{saved.rentAccountTarget === "houseman" ? "HM" : saved.rentAccountTarget} · 관리비→{saved.managementFeeAccountTarget === "houseman" ? "HM" : saved.managementFeeAccountTarget || "-"} · 공과금→{saved.utilityAccountTarget === "houseman" ? "HM" : saved.utilityAccountTarget || "-"}
          {saved.electricGasAccountTarget && ` · 전기가스→${saved.electricGasAccountTarget === "houseman" ? "HM" : saved.electricGasAccountTarget}`}
        </div>
      )}
    </div>
  );
}

export default RoomFormSection;
