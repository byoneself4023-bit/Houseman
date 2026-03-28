// @ts-nocheck
import { useState } from 'react';
import { inputStyle } from './Field';
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
  <div style={{ padding: "6px 10px", background: "#F9FAFB", borderRadius: 6, border: "1px solid #E8ECF0", ...extraStyle }}>
    <div style={{ fontSize: 11, color, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1D23" }}>{value || "-"}</div>
  </div>
);

/* ── Edit input cell ── */
const EditCell = ({ label, color = "#8F95A3", children }) => (
  <div>
    <div style={{ fontSize: 11, color, marginBottom: 3 }}>{label}</div>
    {children}
  </div>
);

const sInput = { ...inputStyle, padding: "7px 10px", fontSize: 12 };
const sInputRight = { ...sInput, textAlign: "right" };
const sSelect = { ...sInput, cursor: "pointer" };

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
        <div style={{ marginBottom: 12, padding: "8px 12px", background: d.isManaged === false ? "#FEF2F2" : "#F0FDF4", borderRadius: 8, border: `1.5px solid ${d.isManaged === false ? "#FECACA" : "#BBF7D0"}`, display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={d.isManaged !== false}
            onChange={e => {
              const newVal = e.target.checked;
              const msg = newVal
                ? "이 호실을 하우스맨 관리로 변경합니다. 계속하시겠습니까?"
                : "⚠️ 이 호실을 비관리로 변경합니다.\n비관리 호실은 청구/정산/수금에서 제외됩니다.\n정말 변경하시겠습니까?";
              if (!window.confirm(msg)) return;
              set("isManaged", newVal);
            }}
            style={{ width: 16, height: 16, cursor: "pointer" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: d.isManaged === false ? "#DC2626" : "#059669", cursor: "pointer" }}>
            하우스맨 관리 호실
          </span>
          <span style={{ fontSize: 9, color: "#8B95A1" }}>변경 시 확인 필요</span>
        </div>

        {/* ── Row 1: 기본 정보 ── */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8 }}>📋 기본 정보</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <EditCell label="호실형태">
            {(isShort || isLong) ? (
              <input value="주택" readOnly style={{ ...sInput, background: "#F3F4F6", color: "#6B7280" }} />
            ) : (
              <select value={d.roomLayout || ""} onChange={e => set("roomLayout", e.target.value)} style={sSelect}>
                <option value="">선택</option>
                {["상가","오피스","상가/오피스"].map(t => <option key={t}>{t}</option>)}
              </select>
            )}
          </EditCell>
          {(isShort || isLong) && (
          <EditCell label="방구조">
            <select value={d.roomType || ""} onChange={e => set("roomType", e.target.value)} style={sSelect}>
              <option value="">선택</option>
              {["원룸","분리형원룸","투룸","쓰리룸","포룸"].map(t => <option key={t}>{t}</option>)}
            </select>
          </EditCell>
          )}
          <EditCell label="면적 (㎡)">
            <input value={d.area || ""} onChange={e => set("area", e.target.value)} placeholder="26.4" style={sInput} />
          </EditCell>
          {!isAgency && (
            <EditCell label="부동산수수료">
              <input value={d.standardBrokerFee || ""} onChange={e => set("standardBrokerFee", e.target.value)} placeholder="100,000" style={sInputRight} />
            </EditCell>
          )}
        </div>

        {/* ── Row 2: 금액 ── */}
        {isAgency ? null : (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", marginBottom: 8 }}>💰 금액</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 6 }}>
              <EditCell label="예치금" color="#059669">
                <input value={d.standardDeposit || ""} onChange={e => set("standardDeposit", e.target.value)} placeholder="0" style={sInputRight} />
              </EditCell>
              <EditCell label="임대료" color="#059669">
                <input value={d.standardRent || ""} onChange={e => set("standardRent", e.target.value)} placeholder="0" style={sInputRight} />
              </EditCell>
              <EditCell label="할인임대료" color="#DC2626">
                <input value={d.rentDiscountLimit || ""} onChange={e => set("rentDiscountLimit", e.target.value)} placeholder="0"
                  style={{ ...sInputRight, background: "#FEF2F2", border: "1.5px solid #FECACA" }} />
              </EditCell>
              <EditCell label="관리비" color="#059669">
                <input value={d.standardManagementFee || ""} onChange={e => set("standardManagementFee", e.target.value)} placeholder="0" style={sInputRight} />
              </EditCell>
              <EditCell label="수도" color="#059669">
                <input value={d.standardWaterFee || ""} onChange={e => set("standardWaterFee", e.target.value)} placeholder="0" style={sInputRight} />
              </EditCell>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
              {isShort && (
                <EditCell label="인터넷" color="#059669">
                  <input value={d.standardInternetFee || ""} onChange={e => set("standardInternetFee", e.target.value)} placeholder="0" style={sInputRight} />
                </EditCell>
              )}
              {(isShort || isLong) && (
                <EditCell label="퇴실청소비" color="#059669">
                  <input value={d.standardCleaningFee || ""} onChange={e => set("standardCleaningFee", e.target.value)} placeholder="0" style={sInputRight} />
                </EditCell>
              )}
              <EditCell label="주차여부" color="#059669">
                <select value={d.standardParkingType || ""} onChange={e => { set("standardParkingType", e.target.value); setShowParkingFee(e.target.value === "paid"); }} style={sSelect}>
                  <option value="">선택</option>
                  <option value="remote">주차리모컨</option>
                  <option value="free">선착순주차가능</option>
                  <option value="prohibited">주차불가</option>
                  <option value="paid">주차요금있음</option>
                </select>
              </EditCell>
              {showParkingFee && (
                <EditCell label="주차요금" color="#059669">
                  <input value={d.standardParkingFee || ""} onChange={e => set("standardParkingFee", e.target.value)} placeholder="0" style={sInputRight} />
                </EditCell>
              )}
            </div>
          </>
        )}

        {/* ── Row 3: 선후불 설정 ── */}
        {isAgency ? null : <>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", marginBottom: 6 }}>⚡ 선후불 설정</div>
        <div style={{ display: "grid", gridTemplateColumns: isShort ? "1fr 1fr 1fr" : "1fr", gap: 6, marginBottom: 12 }}>
          <EditCell label="관리비 선후불" color="#8F95A3">
            <select value={d.mgmtBillingTypeOverride || ""} onChange={e => set("managementFeeBillingTypeOverride", e.target.value)} style={sSelect}>
              <option value="">{billingTypeLabel(saved.mgmtBillingType || "prepaid")} (건물)</option>
              <option value="prepaid">선불</option>
              <option value="postpaid">후불</option>
            </select>
          </EditCell>
          {isShort && (
            <EditCell label="수도비 선후불" color="#8F95A3">
              <select value={d.waterBillingTypeOverride || ""} onChange={e => set("waterBillingTypeOverride", e.target.value)} style={sSelect}>
                <option value="">{billingTypeLabel(saved.waterBillingType || "prepaid")} (건물)</option>
                <option value="prepaid">선불</option>
                <option value="postpaid">후불</option>
              </select>
            </EditCell>
          )}
          {isShort && (
            <EditCell label="인터넷,TV 선후불" color="#8F95A3">
              <select value={d.internetBillingTypeOverride || ""} onChange={e => set("internetBillingTypeOverride", e.target.value)} style={sSelect}>
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
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>🔌 공과금 고객번호</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <EditCell label="전기" color="#6366F1">
                <input value={d.electricCustomerNumber || ""} onChange={e => set("electricCustomerNumber", e.target.value)} style={{ ...sInput, fontFamily: "monospace" }} />
              </EditCell>
              <EditCell label="가스" color="#6366F1">
                <input value={d.gasCustomerNumber || ""} onChange={e => set("gasCustomerNumber", e.target.value)} style={{ ...sInput, fontFamily: "monospace" }} />
              </EditCell>
              <EditCell label="납부방식" color="#6366F1">
                <select value={d.electricGasPaymentType || "houseman_charge"} onChange={e => set("electricGasPaymentType", e.target.value)} style={sSelect}>
                  <option value="houseman_charge">하우스맨 대납 후 청구</option>
                  <option value="tenant_direct">임차인 직접 납부</option>
                </select>
              </EditCell>
            </div>
          </div>
        )}

        {/* ── Row 5: 기타 설정 ── */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#5F6577", marginBottom: 6 }}>⚙️ 기타 설정</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          {/* 수도 납부방식 - 일반임대만 */}
          {isLong && (
            <EditCell label="수도 납부방식" color="#8F95A3">
              <select value={d.waterPaymentType || ""} onChange={e => set("waterPaymentType", e.target.value)} style={sSelect}>
                <option value="">기본 (하우스맨 청구)</option>
                <option value="tenant_direct">임차인 직접 납부</option>
              </select>
            </EditCell>
          )}

          {/* ── 항목별 입금 계좌 블럭 ── */}
          {!isAgency && (
          <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            <div style={{ padding: "10px 12px", background: hasOverride ? "#FFF7ED" : "#F0F4FF", borderRadius: 8, border: `1px solid ${hasOverride ? "#FED7AA" : "#BFDBFE"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: hasOverride ? "#EA580C" : "#2563EB" }}>
                  📦 입금 계좌 ({roomType}) {hasOverride ? "— 호실별 변경됨" : "— 건물 기본값"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(allBlockItems.length, allBlockItems.length <= 4 ? 4 : 3)}, 1fr)`, gap: 8 }}>
                {allBlockItems.map(item => {
                  const bldgVal = getBldgTarget(item.field);
                  const roomVal = roomOverrides[item.field];
                  return (
                    <div key={item.field} style={{ padding: "8px 10px", borderRadius: 8, background: roomVal ? "#FFF7ED" : "#F9FAFB", border: `1px solid ${roomVal ? "#FED7AA" : "#E5E8EB"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
                      <select value={roomVal} onChange={e => set(item.field, e.target.value)} style={sSelect}>
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
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 8, color: "#D97706", marginBottom: 2 }}>변동관리비 메모 <span style={{ color: "#D97706", fontSize: 7 }}>근생 전용</span></div>
              <textarea value={d.variableManagementFeeMemo || ""} onChange={e => set("variableManagementFeeMemo", e.target.value)} placeholder="근생 전용 - 변동관리비 메모"
                rows={2} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, width: "100%", resize: "vertical", minHeight: 36 }} />
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
      <div style={{ marginBottom: 12, padding: "8px 12px", background: d.isManaged === false ? "#FEF2F2" : "#F0FDF4", borderRadius: 8, border: `1.5px solid ${d.isManaged === false ? "#FECACA" : "#BBF7D0"}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: d.isManaged === false ? "#DC2626" : "#059669" }}>
          {d.isManaged === false ? "❌ 비관리 호실" : "✅ 하우스맨 관리 호실"}
        </span>
      </div>

      {/* ── Row 1: 기본 정보 ── */}
      <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8 }}>📋 기본 정보</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <RoCell label="호실형태" value={(isShort || isLong) ? "주택" : d.roomLayout} />
        {(isShort || isLong) && <RoCell label="방구조" value={d.roomType} />}
        <RoCell label="면적 (㎡)" value={d.area ? `${d.area}` : null} />
        {!isAgency && <RoCell label="부동산수수료" value={d.standardBrokerFee} />}
      </div>

      {/* ── Row 2: 금액 ── */}
      {isAgency ? null : (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", marginBottom: 8 }}>💰 금액</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 6 }}>
            <RoCell label="예치금" value={d.standardDeposit} color="#059669" />
            <RoCell label="임대료" value={d.standardRent} color="#059669" />
            <RoCell label="할인임대료" value={d.rentDiscountLimit} color="#DC2626"
              style={d.rentDiscountLimit ? { background: "#FEF2F2", border: "1.5px solid #FECACA" } : {}} />
            <RoCell label="관리비" value={d.standardManagementFee} color="#059679" />
            <RoCell label="수도" value={d.standardWaterFee} color="#059669" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
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
      <div style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", marginBottom: 6 }}>⚡ 선후불 설정</div>
      <div style={{ display: "grid", gridTemplateColumns: isShort ? "1fr 1fr 1fr" : "1fr", gap: 6, marginBottom: 12 }}>
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
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>🔌 공과금 고객번호</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <RoCell label="전기" value={d.electricCustomerNumber} color="#6366F1" />
            <RoCell label="가스" value={d.gasCustomerNumber} color="#6366F1" />
            <RoCell label="납부방식" value={d.electricGasPaymentType === "tenant_direct" ? "임차인 직접 납부" : "하우스맨 대납 후 청구"} color="#6366F1" />
          </div>
        </div>
      )}

      {/* ── Row 5: 기타 설정 ── */}
      {!isAgency && (
      <>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#5F6577", marginBottom: 6 }}>⚙️ 기타 설정</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {isLong && <RoCell label="수도 납부방식" value={d.waterPaymentType === "tenant_direct" ? "임차인 직접 납부" : "기본 (하우스맨 청구)"} />}
        {/* ── 항목별 입금 계좌 블럭 ── */}
        <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
          <div style={{ padding: "10px 12px", background: hasOverride ? "#FFF7ED" : "#F0F4FF", borderRadius: 8, border: `1px solid ${hasOverride ? "#FED7AA" : "#BFDBFE"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: hasOverride ? "#EA580C" : "#2563EB" }}>
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
                  <div key={item.field} style={{ padding: "8px 10px", borderRadius: 8, background: isOverridden ? "#FFF7ED" : "#F9FAFB", border: `1px solid ${isOverridden ? "#FED7AA" : "#E5E8EB"}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: displayVal ? "#191F28" : "#8B95A1" }}>
                      {acctLabel(displayVal)}
                      {isOverridden && <span style={{ fontSize: 8, color: "#EA580C", marginLeft: 4 }}>개별</span>}
                      {!isOverridden && <span style={{ fontSize: 8, color: "#8B95A1", marginLeft: 4 }}>(건물)</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* 변동관리비 메모 - 근생만 */}
        {isComm && (
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ padding: "6px 8px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
              <div style={{ fontSize: 8, color: "#D97706", marginBottom: 2 }}>변동관리비 메모 <span style={{ color: "#D97706", fontSize: 7 }}>근생 전용</span></div>
              <div style={{ fontSize: 10, color: "#92400E", whiteSpace: "pre-wrap" }}>{d.variableManagementFeeMemo || "-"}</div>
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
    <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0", marginTop: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 6 }}>
        💳 계좌 설정 <span style={{ fontSize: 9, color: "#8B95A1", fontWeight: 500 }}>(건물 설정 기준)</span>
      </div>
      <div style={{ fontSize: 10, color: "#4E5968", marginBottom: 4 }}>
        입금방식: {saved.tenantAccountType ? (tenantAccountTypeLabels[saved.tenantAccountType] || saved.tenantAccountType) : "미설정"}
      </div>
      {saved.housemanBillingAccount && (
        <div style={{ fontSize: 10, color: "#4E5968", marginBottom: 4 }}>
          하우스맨 계좌: {saved.housemanBillingAccount}
        </div>
      )}
      {[1,2,3].map(n => saved[`billingAccount${n}`] && (
        <div key={n} style={{ fontSize: 10, color: "#4E5968", marginBottom: 2 }}>
          건물주 청구계좌 {n}: {saved[`billingAccount${n}Bank`] || ""} {saved[`billingAccount${n}`]} ({saved[`billingAccount${n}Holder`] || ""})
        </div>
      ))}
      {saved.rentAccountTarget && (
        <div style={{ fontSize: 9, color: "#6B7280", marginTop: 4, padding: "4px 8px", background: "#F0F4FF", borderRadius: 4 }}>
          월세→{saved.rentAccountTarget === "houseman" ? "HM" : saved.rentAccountTarget} · 관리비→{saved.managementFeeAccountTarget === "houseman" ? "HM" : saved.managementFeeAccountTarget || "-"} · 공과금→{saved.utilityAccountTarget === "houseman" ? "HM" : saved.utilityAccountTarget || "-"}
          {saved.electricGasAccountTarget && ` · 전기가스→${saved.electricGasAccountTarget === "houseman" ? "HM" : saved.electricGasAccountTarget}`}
        </div>
      )}
    </div>
  );
}

export default RoomFormSection;
