// @ts-nocheck
import { useState, useRef } from 'react';
import { inputStyle } from './Field';
import { Card } from './Card';
import { FIELD_VALIDATORS } from '../utils/validation';

/* ══════════════════════════════════════════════════════════════
   Shared Building Form Sections
   Both BuildingDetailPage and BuildingsPage use these components.
   Props: data (object), onChange (patch => void), editMode (bool)
   ══════════════════════════════════════════════════════════════ */

/* ── Shared field helpers ── */
const FLabel = ({ label }) => (
  <div style={{ fontSize: 11, color: "#8B95A1", marginBottom: 3 }}>{label}</div>
);

const FInput = ({ data, field, onChange, placeholder, type, style: extraStyle, readOnly, required: isRequired, ...rest }) => {
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const validator = FIELD_VALIDATORS[field];
  const handleBlur = () => {
    setTouched(true);
    if (validator) {
      const result = validator(data[field]);
      setError(result.valid ? "" : result.message);
    } else if (isRequired && (!data[field] || (typeof data[field] === "string" && !data[field].trim()))) {
      setError("필수 항목입니다");
    } else {
      setError("");
    }
  };
  const hasError = touched && error;
  return (
    <div style={{ position: "relative" }}>
      <input type={type || "text"} value={data[field] ?? ""} onChange={e => { !readOnly && onChange({ [field]: e.target.value }); if (touched) { const v = validator; if (v) { const r = v(e.target.value); setError(r.valid ? "" : r.message); } else { setError(""); } } }}
        onBlur={handleBlur} readOnly={readOnly} placeholder={placeholder}
        style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, background: readOnly ? "#F8FAFC" : "#fff", cursor: readOnly ? "default" : "text", borderColor: hasError ? "#EF4444" : undefined, ...extraStyle }} {...rest} />
      {hasError && <div style={{ fontSize: 9, color: "#EF4444", marginTop: 2 }}>{error}</div>}
    </div>
  );
};

const FSelect = ({ data, field, onChange, options, style: extraStyle, readOnly }) => (
  <select value={data[field] || ""} onChange={e => !readOnly && onChange({ [field]: e.target.value })} disabled={readOnly}
    style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, cursor: readOnly ? "default" : "pointer", background: readOnly ? "#F8FAFC" : "#fff", ...extraStyle }}>
    <option value="">선택</option>
    {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const FCheck = ({ data, field, onChange, label, readOnly }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <input type="checkbox" checked={!!data[field]} onChange={e => !readOnly && onChange({ [field]: e.target.checked })} disabled={readOnly} style={{ width: 16, height: 16 }} />
    <div style={{ fontSize: 12, color: "#8F95A3" }}>{label}</div>
  </div>
);

const FTextarea = ({ data, field, onChange, placeholder, rows, readOnly }) => (
  <textarea value={data[field] || ""} onChange={e => !readOnly && onChange({ [field]: e.target.value })}
    readOnly={readOnly} placeholder={placeholder} rows={rows || 3}
    style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, minHeight: 60, width: "100%", resize: "vertical", background: readOnly ? "#F8FAFC" : "#fff" }} />
);

/* ── Collapsible section header ── */
const SectionHeader = ({ title, subtitle, icon, isOpen, onToggle }) => (
  <div onClick={onToggle} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isOpen ? 12 : 0 }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{icon} {title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{subtitle}</div>}
    </div>
    <span style={{ fontSize: 14, color: "#8F95A3", transition: "transform 0.2s", transform: isOpen ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
  </div>
);

/* ── File upload with thumbnail + optional full-screen viewer ── */
const FFileUpload = ({ data, field, label, onChange, setFullScreenFile, readOnly }) => {
  const fileRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const value = data[field];

  const processFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('파일 크기는 5MB 이하만 가능합니다.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ [field]: reader.result, [field + 'Name']: file.name, [field + 'Type']: file.type });
    };
    reader.readAsDataURL(file);
  };
  const handleUpload = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const isPdf = data[field + 'Type']?.includes('pdf');
  const fileName = data[field + 'Name'] || '파일';
  return (
    <div>
      <FLabel label={label} />
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleUpload} style={{ display: 'none' }} />
      {!value ? (
        readOnly ? (
          <div style={{ width: '100%', padding: '20px 12px', borderRadius: 8, border: '1.5px dashed #D1D5DB', background: '#F8FAFC', color: '#9CA3AF', fontSize: 11, fontFamily: 'inherit', textAlign: 'center' }}>
            첨부된 파일 없음
          </div>
        ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            width: '100%', padding: '20px 12px', borderRadius: 8,
            border: `1.5px dashed ${isDragging ? '#2563EB' : '#D1D5DB'}`,
            background: isDragging ? '#EFF6FF' : '#F9FAFB',
            color: isDragging ? '#2563EB' : '#6B7280',
            fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            transition: 'all 0.15s',
          }}>
          {isDragging ? '여기에 놓으세요' : '파일 첨부 (클릭 또는 드래그)'}
        </div>
        )
      ) : (
        <div style={{ position: 'relative' }}>
          <div onClick={() => setFullScreenFile && setFullScreenFile({ src: value, type: data[field + 'Type'], name: fileName })}
            style={{ width: '100%', height: 80, borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden', cursor: setFullScreenFile ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
            {isPdf ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>PDF</div>
                <div style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{fileName}</div>
              </div>
            ) : (
              <img src={value} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}
          </div>
          {!readOnly && <button onClick={(e) => { e.stopPropagation(); onChange({ [field]: null, [field + 'Name']: null, [field + 'Type']: null }); }}
            style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#EF4444', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>X</button>}
        </div>
      )}
    </div>
  );
};

/* ── Conditional visibility helpers (computed from data) ── */
function useVisibility(data) {
  const anyTypeChecked = data.isShortTermRental || data.isLongTermRental || data.isCommercial || data.isManagementAgency || data.isCorporateFacility;
  const isType = (...types) => !anyTypeChecked || types.some(t => data[t]);
  const notCorporateOnly = isType('isShortTermRental', 'isLongTermRental', 'isCommercial', 'isManagementAgency');
  const isRentalOrCommercial = isType('isShortTermRental', 'isLongTermRental', 'isCommercial');
  const isCommercialOrAgency = isType('isCommercial', 'isManagementAgency');
  const corporateOnly = anyTypeChecked && data.isCorporateFacility && !data.isShortTermRental && !data.isLongTermRental && !data.isCommercial && !data.isManagementAgency;
  const agencyOnly = anyTypeChecked && data.isManagementAgency && !data.isShortTermRental && !data.isLongTermRental && !data.isCommercial && !data.isCorporateFacility;
  return { anyTypeChecked, notCorporateOnly, isRentalOrCommercial, isCommercialOrAgency, corporateOnly, agencyOnly };
}


/* ════════════════════════════════════════════════════════════════
   BuildingTypeCards
   ════════════════════════════════════════════════════════════════ */
export function BuildingTypeCards({ data, onChange, locked, onUnlock, onLock, editMode = true }) {
  const { anyTypeChecked } = useVisibility(data);
  const typeConfigs = [
    { field: "isShortTermRental", label: "단기임대", icon: "\u{1F3E0}", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
    { field: "isLongTermRental", label: "일반임대", icon: "\u{1F3E2}", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    { field: "isCommercial", label: "근생", icon: "\u{1F3EA}", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    { field: "isManagementAgency", label: "관리사무소대행", icon: "\u{1F3D7}\uFE0F", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
    { field: "isCorporateFacility", label: "기업시설관리", icon: "\u{1F3ED}", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Lock/unlock controls — 수정 모드에서만 잠금 해제 버튼 표시 */}
      {locked !== undefined && anyTypeChecked && locked && editMode && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "#8B95A1" }}>🔒 건물 유형이 설정되어 있습니다. 변경이 필요하면 잠금을 해제하세요.</div>
          <button onClick={() => {
            if (window.confirm("건물 유형을 변경하면 청구/정산 설정에 영향을 줄 수 있습니다.\n정말 잠금을 해제하시겠습니까?")) onUnlock && onUnlock();
          }} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>🔓 잠금 해제</button>
        </div>
      )}
      {/* 보기 모드에서 유형 설정되어 있으면 잠금 표시만 */}
      {locked !== undefined && anyTypeChecked && !editMode && (
        <div style={{ fontSize: 10, color: "#8B95A1", marginBottom: 8 }}>🔒 건물 유형 (수정 모드에서 변경 가능)</div>
      )}
      {locked !== undefined && !locked && anyTypeChecked && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 600 }}>⚠️ 건물 유형 변경 모드. 변경 후 아래 잠금 버튼을 눌러주세요.</div>
          <button onClick={() => onLock && onLock()} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #A7F3D0", background: "#ECFDF5", color: "#059669", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>🔒 잠금</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {typeConfigs.map(t => {
          const active = !!data[t.field];
          const soloTypes = ["isManagementAgency", "isCorporateFacility"];
          const mixTypes = ["isShortTermRental", "isLongTermRental", "isCommercial"];
          const isSolo = soloTypes.includes(t.field);
          const hasSoloSelected = soloTypes.some(f => f !== t.field && data[f]);
          const hasMixSelected = mixTypes.some(f => data[f]);
          const isLocked = locked !== undefined && anyTypeChecked && locked;
          /* 수정 모드가 아니면 전부 비활성화 */
          const disabled = !editMode || isLocked || (!active && ((hasSoloSelected) || (isSolo && hasMixSelected)));
          return (
            <div key={t.field} onClick={() => {
              if (disabled) return;
              const msg = active
                ? `${t.label} 유형을 해제하시겠습니까?`
                : `${t.label} 유형을 추가하시겠습니까?`;
              if (!window.confirm(msg)) return;
              if (!active && isSolo) {
                onChange({ isShortTermRental: false, isLongTermRental: false, isCommercial: false, isManagementAgency: false, isCorporateFacility: false, [t.field]: true });
              } else if (!active && !isSolo) {
                onChange({ isManagementAgency: false, isCorporateFacility: false, [t.field]: true });
              } else {
                onChange({ [t.field]: false });
              }
            }}
              style={{
                position: "relative",
                flex: "1 1 0", minWidth: 130, padding: "14px 16px", borderRadius: 12,
                cursor: disabled ? (isLocked ? "default" : "not-allowed") : "pointer",
                background: active ? t.bg : "#F9FAFB",
                border: `2.5px solid ${active ? t.color : "#E5E7EB"}`,
                textAlign: "center", transition: "all 0.2s",
                opacity: disabled ? (isLocked && active ? 0.85 : isLocked ? 0.3 : 0.25) : active ? 1 : 0.5,
                boxShadow: active ? `0 0 0 2px ${t.color}30` : "none",
              }}>
              {active && (
                <div style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>
                </div>
              )}
              {isLocked && active && (
                <div style={{ position: "absolute", top: -6, left: -6, fontSize: 12 }}>🔒</div>
              )}
              <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: active ? t.color : "#9CA3AF" }}>{t.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════
   BuildingInfoSection
   ════════════════════════════════════════════════════════════════ */
export function BuildingInfoSection({ data, onChange, editMode = true, isMobile, defaultOpen = true, buildingNamePlaceholder }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { anyTypeChecked, notCorporateOnly, corporateOnly, agencyOnly } = useVisibility(data);
  const ro = !editMode;
  if (!anyTypeChecked) return null;

  return (
    <Card style={{ marginBottom: 16 }}>
      <SectionHeader title={corporateOnly ? "회사 정보" : "건물 정보"} subtitle={corporateOnly ? "기본정보" : "기본정보, 시설/보안, 공과금/인프라"} icon="📋" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }} className="hm-form-grid-4">
            <div><FLabel label={corporateOnly ? "회사명" : "건물명"} /><FInput readOnly={ro} data={data} field="buildingName" onChange={onChange} placeholder={corporateOnly ? "회사명" : (buildingNamePlaceholder || "건물명")} /></div>
            <div><FLabel label="🔑 현관 비밀번호" /><FInput readOnly={ro} data={data} field="entranceDoorPassword" onChange={onChange} placeholder="비밀번호" style={{ fontFamily: "monospace", letterSpacing: 1 }} /></div>
            <div><FLabel label={corporateOnly ? "회사 약칭" : "건물 약칭"} /><FInput readOnly={ro} data={data} field="buildingNickname" onChange={onChange} placeholder="약칭" /></div>
            <div><FLabel label="관리시작일" /><FInput readOnly={ro} data={data} field="contractStartDate" onChange={onChange} type="date" /></div>
            <div>
              <FLabel label="도로명 주소" />
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={data.addressRoad || ""} onChange={e => !ro && onChange({ addressRoad: e.target.value })} readOnly={ro} placeholder="주소 검색 또는 직접 입력" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, flex: 1, background: ro ? "#F8FAFC" : "#fff" }} />
                {!ro && <button onClick={() => {
                  new window.daum.Postcode({
                    oncomplete: (d) => {
                      onChange({ addressOld: d.jibunAddress || d.autoJibunAddress || "", addressRoad: d.roadAddress || "" });
                    }
                  }).open();
                }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>검색</button>}
              </div>
            </div>
            <div>
              <FLabel label="지번 주소" />
              <FInput readOnly={ro} data={data} field="addressOld" onChange={onChange} placeholder="지번 주소" />
            </div>
            {!corporateOnly && <div><FLabel label="사용승인일" /><FInput readOnly={ro} data={data} field="approvedDate" onChange={onChange} type="date" /></div>}
            <div><FLabel label="건물 총면적(㎡)" /><FInput readOnly={ro} data={data} field="buildingAreaTotal" onChange={onChange} type="number" placeholder="330.5" /></div>
            {notCorporateOnly && (<>
              <div><FLabel label="CCTV 대수" /><FInput readOnly={ro} data={data} field="cctvCount" onChange={onChange} type="number" placeholder="0" /></div>
              <div style={{ opacity: Number(data.cctvCount) > 0 ? 1 : 0.4, pointerEvents: Number(data.cctvCount) > 0 ? "auto" : "none" }}><FLabel label="CCTV 녹화기 위치" /><FInput readOnly={ro} data={data} field="cctvRoomLocation" onChange={onChange} /></div>
              <div style={{ gridColumn: "span 2", opacity: Number(data.cctvCount) > 0 ? 1 : 0.4, pointerEvents: Number(data.cctvCount) > 0 ? "auto" : "none" }}><FLabel label="CCTV 설치법 및 비밀번호" /><FInput readOnly={ro} data={data} field="cctvInstallInfo" onChange={onChange} /></div>
              <div><FLabel label="공용 전기 고객번호" /><FInput readOnly={ro} data={data} field="electricCommonCustomerNumber" onChange={onChange} placeholder={agencyOnly ? "여러 개면 쉼표(,)로 구분" : ""} /></div>
              <div><FLabel label="공용 수도 고객번호" /><FInput readOnly={ro} data={data} field="waterCommonCustomerNumber" onChange={onChange} placeholder={agencyOnly ? "여러 개면 쉼표(,)로 구분" : ""} /></div>
              <div><FLabel label="전체 계약전력" /><FInput readOnly={ro} data={data} field="electricContractPower" onChange={onChange} placeholder="예: 15kW" /></div>
              {!agencyOnly && <div><FLabel label="인터넷 통신사" /><FInput readOnly={ro} data={data} field="internetProvider" onChange={onChange} /></div>}
              <div><FLabel label="주차장 게이트 비밀번호" /><FInput readOnly={ro} data={data} field="parkingGatePassword" onChange={onChange} /></div>
              <div><FLabel label="전기계량기 함 비밀번호" /><FInput readOnly={ro} data={data} field="electricMeterBoxPassword" onChange={onChange} /></div>
              <div><FLabel label="옥상 출입 방법" /><FInput readOnly={ro} data={data} field="rooftopAccessMethod" onChange={onChange} /></div>
              <div><FLabel label="주차 총 대수" /><FInput readOnly={ro} data={data} field="parkingTotalSpaces" onChange={onChange} type="number" placeholder="0" /></div>
              <div>
                <FLabel label="정화조 청소 월" />
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <FInput readOnly={ro} data={data} field="septicTankCleaningMonth1" onChange={onChange} type="number" min="1" max="12" placeholder="6" style={{ width: 70 }} />
                  {!data.septicTankCleaningMonth2 ? (
                    !ro && <button onClick={() => onChange({ septicTankCleaningMonth2: "12" })} style={{ padding: "4px 10px", borderRadius: 6, border: "1px dashed #A7F3D0", background: "#F0FDF4", color: "#059669", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ 연2회</button>
                  ) : (
                    <>
                      <FInput readOnly={ro} data={data} field="septicTankCleaningMonth2" onChange={onChange} type="number" min="1" max="12" placeholder="12" style={{ width: 70 }} />
                      {!ro && <button onClick={() => onChange({ septicTankCleaningMonth2: "" })} style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕</button>}
                    </>
                  )}
                </div>
              </div>
              <div><FLabel label="월 순회점검 횟수" /><FInput readOnly={ro} data={data} field="monthlyInspectionCount" onChange={onChange} type="number" placeholder="2" /></div>
              <FCheck readOnly={ro} data={data} field="isFireInspectionSelf" onChange={onChange} label="소방점검 하우스맨이 수행" />
            </>)}
            {/* 단기임대 전용 설정 */}
            {data.isShortTermRental && (
              <div style={{ gridColumn: "1 / -1", padding: "10px 12px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB", marginBottom: 8 }}>🏠 단기임대 전용 설정</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                  <FCheck readOnly={ro} data={data} field="isResidentRegistrationAllowed" onChange={onChange} label="전입신고 가능" />
                  <FCheck readOnly={ro} data={data} field="isStandardContract" onChange={onChange} label="표준계약서 사용" />
                  <FCheck readOnly={ro} data={data} field="isRenthomeWritingAgency" onChange={onChange} label="렌트홈 작성 대행" />
                  <FCheck readOnly={ro} data={data} field="isStorageAvailable" onChange={onChange} label="창고 사용 가능" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }} className="hm-form-grid-4">
                  <div>
                    <FLabel label="7일 패널티 소유권" />
                    <FSelect readOnly={ro} data={data} field="penalty7daysOwnership" onChange={onChange} options={[
                      { value: "houseman", label: "하우스맨" },
                      { value: "owner", label: agencyOnly ? "대표자" : "건물주" },
                    ]} />
                  </div>
                  <div><FLabel label="무상수리 한도(원)" /><FInput readOnly={ro} data={data} field="freeRepairLimit" onChange={onChange} type="number" placeholder="0" /></div>
                  <div>
                    <FLabel label="수도비 선후불" />
                    <FSelect readOnly={ro} data={{ ...data, waterBillingType: data.waterBillingType || "prepaid" }} field="waterBillingType" onChange={onChange} options={[
                      { value: "prepaid", label: "선불" },
                      { value: "postpaid", label: "후불" },
                    ]} />
                  </div>
                  <div>
                    <FLabel label={`인터넷,TV 선후불${(data.isLongTermRental || data.isCommercial) ? " (단기에만 적용)" : ""}`} />
                    <FSelect readOnly={ro} data={{ ...data, internetBillingType: data.internetBillingType || "prepaid" }} field="internetBillingType" onChange={onChange} options={[
                      { value: "prepaid", label: "선불" },
                      { value: "postpaid", label: "후불" },
                    ]} />
                  </div>
                </div>
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <FLabel label="메모" />
              <FTextarea readOnly={ro} data={data} field="memo" onChange={onChange} placeholder="건물에 대한 메모를 입력하세요..." rows={3} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}


/* ════════════════════════════════════════════════════════════════
   OwnerSection
   ════════════════════════════════════════════════════════════════ */
export function OwnerSection({ data, onChange, editMode = true, defaultOpen = true, detailBuildingTypes }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showOwner2, setShowOwner2] = useState(false);
  const [showOwner3, setShowOwner3] = useState(false);
  const { anyTypeChecked, notCorporateOnly, corporateOnly, agencyOnly } = useVisibility(data);
  if (!anyTypeChecked) return null;
  const ro = !editMode;
  const ownerLabel = corporateOnly ? "담당자" : agencyOnly ? "대표자" : "건물주";

  // For detail page: determine if settlement accounts should be hidden
  const hideSettlementAccounts = !notCorporateOnly || (
    data.managementFeeAccountTarget && data.managementFeeAccountTarget.startsWith("owner") &&
    !data.rentAccountTarget &&
    detailBuildingTypes && detailBuildingTypes.includes("관리사무소")
  );

  return (
    <Card style={{ marginBottom: 16 }}>
      <SectionHeader title={ownerLabel} subtitle={corporateOnly ? "담당자 정보, 계좌" : `${ownerLabel} 정보, 사업자정보, 계좌`} icon="👤" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          {/* 건물주 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 8 }} className="hm-form-grid-3">
            <div><FLabel label="이름" /><FInput readOnly={ro} data={data} field="ownerName" onChange={onChange} placeholder="홍길동" /></div>
            <div><FLabel label="주민등록번호" /><FInput readOnly={ro} data={data} field="ownerResidentNumber" onChange={onChange} placeholder="000000-0000000" style={{ fontFamily: "monospace" }} /></div>
            <div><FLabel label="전화번호" /><FInput readOnly={ro} data={data} field="ownerPhone" onChange={onChange} placeholder="010-0000-0000" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
            <div><FLabel label="이메일 1" /><FInput readOnly={ro} data={data} field="ownerEmail" onChange={onChange} placeholder="owner@email.com" /></div>
            <div><FLabel label="이메일 2" /><FInput readOnly={ro} data={data} field="ownerEmail2" onChange={onChange} placeholder="보조 이메일" /></div>
            {!corporateOnly && <div>
              <FLabel label="자택 주소" />
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <input value={data.ownerHomeAddress || ""} onChange={() => {}} placeholder="주소 검색" style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, flex: 1 }} readOnly />
                {!ro && <button onClick={() => {
                  new window.daum.Postcode({
                    oncomplete: (d) => {
                      onChange({ ownerHomeAddress: d.roadAddress || d.jibunAddress || "" });
                    }
                  }).open();
                }} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>검색</button>}
                <input value={data.ownerHomeAddressDetail || ""} onChange={e => !ro && onChange({ ownerHomeAddressDetail: e.target.value })} readOnly={ro} placeholder="상세주소" style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, flex: 1, background: ro ? "#F8FAFC" : "#fff" }} />
              </div>
            </div>}
          </div>

          {/* 건물주 정산계좌 */}
          {!hideSettlementAccounts && (
          <div style={{ borderTop: "1px solid #E8ECF0", paddingTop: 14, marginTop: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 10 }}>🏦 {ownerLabel} 정산계좌</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* 정산 계좌 1 */}
              <div style={{ padding: "10px 12px", background: "#ECFDF5", borderRadius: 8, border: "1px solid #A7F3D0" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", marginBottom: 8 }}>정산 계좌 ①</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 6 }}>
                  <div><FLabel label="은행" /><FInput readOnly={ro} data={data} field="settlementAccount1Bank" onChange={onChange} placeholder="국민은행" /></div>
                  <div><FLabel label="계좌번호" /><FInput readOnly={ro} data={data} field="settlementAccount1" onChange={onChange} placeholder="110-234-567890" /></div>
                  <div><FLabel label="예금주" /><FInput readOnly={ro} data={data} field="settlementAccount1Holder" onChange={onChange} placeholder="홍길동" /></div>
                </div>
              </div>
              {/* 정산 계좌 2 */}
              <div style={{ padding: "10px 12px", background: data.settlementAccount2 ? "#ECFDF5" : "#F7F8FA", borderRadius: 8, border: `1px solid ${data.settlementAccount2 ? "#A7F3D0" : "#E5E8EB"}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: data.settlementAccount2 ? "#059669" : "#8B95A1", marginBottom: 8 }}>정산 계좌 ②</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 6 }}>
                  <div><FLabel label="은행" /><FInput readOnly={ro} data={data} field="settlementAccount2Bank" onChange={onChange} placeholder="은행" /></div>
                  <div><FLabel label="계좌번호" /><FInput readOnly={ro} data={data} field="settlementAccount2" onChange={onChange} placeholder="계좌번호" /></div>
                  <div><FLabel label="예금주" /><FInput readOnly={ro} data={data} field="settlementAccount2Holder" onChange={onChange} placeholder="예금주" /></div>
                </div>
              </div>
            </div>
            {/* 분배 설정 */}
            {data.settlementAccount2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                <div>
                  <FLabel label="분배 방식" />
                  <FSelect readOnly={ro} data={data} field="settlementSplitType" onChange={onChange} options={[
                    { value: "fixed", label: "고정비율 (매번 같은 %)" },
                    { value: "variable", label: "비고정 (매번 요청에 따라)" },
                  ]} />
                </div>
                {data.settlementSplitType === "fixed" && (
                  <div>
                    <FLabel label="계좌① 비율 (%)" />
                    <FInput readOnly={ro} data={data} field="settlementSplitValue" onChange={onChange} type="number" placeholder="60" />
                    {data.settlementSplitValue && <div style={{ fontSize: 9, color: "#8B95A1", marginTop: 2 }}>계좌①: {data.settlementSplitValue}% / 계좌②: {100 - (parseInt(data.settlementSplitValue) || 0)}%</div>}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* 사업자 정보 */}
          <div style={{ padding: "8px 10px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>사업자 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 6 }} className="hm-form-grid-3">
              <div><FLabel label="사업자등록번호" /><FInput readOnly={ro} data={data} field="ownerBusinessRegistrationNumber" onChange={onChange} placeholder="000-00-00000" style={{ fontFamily: "monospace" }} /></div>
              <div><FLabel label="사업자 상호" /><FInput readOnly={ro} data={data} field="ownerBusinessName" onChange={onChange} placeholder="상호명" /></div>
              <div><FLabel label="사업장 주소" /><FInput readOnly={ro} data={data} field="ownerBusinessAddress" onChange={onChange} placeholder="사업장 주소" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="hm-form-grid-3">
              <div><FLabel label="업태" /><FInput readOnly={ro} data={data} field="ownerBusinessType" onChange={onChange} placeholder="부동산업" /></div>
              <div><FLabel label="종목" /><FInput readOnly={ro} data={data} field="ownerBusinessItem" onChange={onChange} placeholder="임대업" /></div>
              <div>
                <FLabel label="사업자 유형" />
                <FSelect readOnly={ro} data={data} field="ownerEntityType" onChange={onChange} options={[
                  { value: "individual", label: "개인" },
                  { value: "sole_proprietor", label: "개인사업자" },
                  { value: "corporation", label: "법인사업자" },
                ]} />
              </div>
            </div>
          </div>

          {/* 건물주 추가 버튼 */}
          {!ro && !corporateOnly && !showOwner2 && !data.owner2Name && (
            <button onClick={() => setShowOwner2(true)}
              style={{ padding: "6px 16px", borderRadius: 6, border: "1.5px dashed #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {`＋ ${ownerLabel} 추가 (공동소유)`}
            </button>
          )}

          {/* 건물주 2 */}
          {(showOwner2 || data.owner2Name) && (
            <div style={{ padding: "10px 12px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>👤 {ownerLabel} 2 (공동소유)</span>
                {!ro && <button onClick={() => { setShowOwner2(false); setShowOwner3(false); onChange({ owner2Name: "", owner2ResidentNumber: "", owner2Phone: "", owner2Email: "", owner2HomeAddress: "", owner2HomeAddressDetail: "", owner3Name: "", owner3ResidentNumber: "", owner3Phone: "", owner3Email: "", owner3HomeAddress: "", owner3HomeAddressDetail: "", coOwnerMemo: "" }); }}
                  style={{ padding: "2px 10px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕ 삭제</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 6 }} className="hm-form-grid-3">
                <div><FLabel label="이름" /><FInput readOnly={ro} data={data} field="owner2Name" onChange={onChange} placeholder="이름" /></div>
                <div><FLabel label="주민등록번호" /><FInput readOnly={ro} data={data} field="owner2ResidentNumber" onChange={onChange} placeholder="000000-0000000" style={{ fontFamily: "monospace" }} /></div>
                <div><FLabel label="전화번호" /><FInput readOnly={ro} data={data} field="owner2Phone" onChange={onChange} placeholder="010-0000-0000" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><FLabel label="이메일" /><FInput readOnly={ro} data={data} field="owner2Email" onChange={onChange} placeholder="email" /></div>
                <div>
                  <FLabel label="자택 주소" />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <input value={data.owner2HomeAddress || ""} onChange={() => {}} placeholder="주소 검색" style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, flex: 1 }} readOnly />
                    {!ro && <button onClick={() => {
                      new window.daum.Postcode({
                        oncomplete: (d) => {
                          onChange({ owner2HomeAddress: d.roadAddress || d.jibunAddress || "" });
                        }
                      }).open();
                    }} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>검색</button>}
                    <input value={data.owner2HomeAddressDetail || ""} onChange={e => !ro && onChange({ owner2HomeAddressDetail: e.target.value })} readOnly={ro} placeholder="상세주소" style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, flex: 1, background: ro ? "#F8FAFC" : "#fff" }} />
                  </div>
                </div>
              </div>
              {/* 건물주 3 추가 버튼 */}
              {!ro && !showOwner3 && !data.owner3Name && (
                <button onClick={() => setShowOwner3(true)}
                  style={{ marginTop: 8, padding: "6px 16px", borderRadius: 6, border: "1.5px dashed #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {`＋ ${ownerLabel} 3 추가`}
                </button>
              )}
            </div>
          )}

          {/* 건물주 3 */}
          {(showOwner3 || data.owner3Name) && (showOwner2 || data.owner2Name) && (
            <div style={{ padding: "10px 12px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>👤 {ownerLabel} 3 (공동소유)</span>
                {!ro && <button onClick={() => { setShowOwner3(false); onChange({ owner3Name: "", owner3ResidentNumber: "", owner3Phone: "", owner3Email: "", owner3HomeAddress: "", owner3HomeAddressDetail: "" }); }}
                  style={{ padding: "2px 10px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕ 삭제</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 6 }} className="hm-form-grid-3">
                <div><FLabel label="이름" /><FInput readOnly={ro} data={data} field="owner3Name" onChange={onChange} placeholder="이름" /></div>
                <div><FLabel label="주민등록번호" /><FInput readOnly={ro} data={data} field="owner3ResidentNumber" onChange={onChange} placeholder="000000-0000000" style={{ fontFamily: "monospace" }} /></div>
                <div><FLabel label="전화번호" /><FInput readOnly={ro} data={data} field="owner3Phone" onChange={onChange} placeholder="010-0000-0000" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><FLabel label="이메일" /><FInput readOnly={ro} data={data} field="owner3Email" onChange={onChange} placeholder="email" /></div>
                <div>
                  <FLabel label="자택 주소" />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <input value={data.owner3HomeAddress || ""} onChange={() => {}} placeholder="주소 검색" style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, flex: 1 }} readOnly />
                    {!ro && <button onClick={() => {
                      new window.daum.Postcode({
                        oncomplete: (d) => {
                          onChange({ owner3HomeAddress: d.roadAddress || d.jibunAddress || "" });
                        }
                      }).open();
                    }} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>검색</button>}
                    <input value={data.owner3HomeAddressDetail || ""} onChange={e => !ro && onChange({ owner3HomeAddressDetail: e.target.value })} readOnly={ro} placeholder="상세주소" style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, flex: 1, background: ro ? "#F8FAFC" : "#fff" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 공동소유 메모 */}
          {(showOwner2 || data.owner2Name) && (
            <div>
              <FLabel label="공동소유 메모" />
              <FTextarea readOnly={ro} data={data} field="coOwnerMemo" onChange={onChange} placeholder="지분비율, 연락 우선순위 등..." rows={2} />
            </div>
          )}

          {/* 연락 담당자 */}
          <div style={{ borderTop: "1px solid #E8ECF0", paddingTop: 14, marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8 }}>연락 담당자</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 6 }} className="hm-form-grid-3">
              <div><FLabel label="담당자 이름" /><FInput readOnly={ro} data={data} field="contactPersonName" onChange={onChange} /></div>
              <div><FLabel label="담당자 전화" /><FInput readOnly={ro} data={data} field="contactPersonPhone" onChange={onChange} /></div>
              <div><FLabel label="담당자 이메일" /><FInput readOnly={ro} data={data} field="contactPersonEmail" onChange={onChange} /></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <FCheck readOnly={ro} data={data} field="isContactPersonPrimary" onChange={onChange} label={`1차 연락대상 여부 (${ownerLabel}보다 먼저 연락)`} />
            </div>
            <div style={{ borderTop: "1px solid #E8ECF0", paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", marginBottom: 8 }}>현장소장</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="hm-form-grid-3">
                <div><FLabel label="소장 이름" /><FInput readOnly={ro} data={data} field="siteManagerName" onChange={onChange} /></div>
                <div><FLabel label="소장 전화" /><FInput readOnly={ro} data={data} field="siteManagerPhone" onChange={onChange} /></div>
                <div><FLabel label="소장 이메일" /><FInput readOnly={ro} data={data} field="siteManagerEmail" onChange={onChange} /></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}


/* ════════════════════════════════════════════════════════════════
   SettlementBillingSection
   ════════════════════════════════════════════════════════════════ */
export function SettlementBillingSection({ data, onChange, editMode = true, isMobile, defaultOpen = true, buildingTypes }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { anyTypeChecked, notCorporateOnly, isRentalOrCommercial, isCommercialOrAgency, corporateOnly, agencyOnly } = useVisibility(data);
  if (!anyTypeChecked) return null;
  const ownerLabel = corporateOnly ? "담당자" : agencyOnly ? "대표자" : "건물주";
  const ro = !editMode;

  // 검침형 근생 판별: 6개 컬럼 중 하나라도 값이 있으면 검침형
  const isMeteredCommercial = data.isCommercial && (
    data.electricReadingDay || data.waterReadingDay ||
    data.rentDueDay || data.mgmtDueDay || data.mgmtBillIssueDay
  );

  // Derive building types for billing account assignment
  const derivedTypes = buildingTypes || (() => {
    const types = [];
    if (data.isShortTermRental) types.push("단기");
    if (data.isLongTermRental) types.push("일반임대");
    if (data.isCommercial) types.push("근생");
    if (data.isManagementAgency) types.push("관리사무소");
    if (data.isCorporateFacility) types.push("기업시설관리");
    return types;
  })();

  return (
    <Card style={{ marginBottom: 16 }}>
      <SectionHeader title={corporateOnly ? "청구 설정" : "정산·청구"} subtitle={corporateOnly ? "청구 주기, 수수료" : "수수료/정산, 청구 방식"} icon="💰" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          {/* 관리수수료 (purple card) */}
          <div style={{ padding: "12px 14px", background: "#F5F3FF", borderRadius: 10, border: "1px solid #DDD6FE", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", marginBottom: 10 }}>관리수수료</div>
            {corporateOnly ? (
              <div style={{ maxWidth: 300 }}>
                <FLabel label="고정금액 (원)" /><FInput readOnly={ro} data={data} field="managementFeeFixedAmount" onChange={onChange} type="number" placeholder="1,500,000" />
              </div>
            ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="hm-form-grid-3">
              <div>
                <FLabel label="방식" />
                <FSelect readOnly={ro} data={data} field="managementFeeType" onChange={onChange} options={[
                  { value: "percent", label: "% (비율)" },
                  { value: "fixed", label: "고정금액" },
                  { value: "hybrid", label: "혼합 (%+고정)" },
                ]} />
              </div>
              <div style={{ opacity: data.managementFeeType === "percent" || data.managementFeeType === "hybrid" ? 1 : 0.35, pointerEvents: data.managementFeeType === "percent" || data.managementFeeType === "hybrid" ? "auto" : "none" }}>
                <FLabel label="수수료율 (%)" /><FInput readOnly={ro} data={data} field="managementFeeRate" onChange={onChange} type="number" placeholder="5" />
              </div>
              <div style={{ opacity: data.managementFeeType === "fixed" || data.managementFeeType === "hybrid" ? 1 : 0.35, pointerEvents: data.managementFeeType === "fixed" || data.managementFeeType === "hybrid" ? "auto" : "none" }}>
                <FLabel label="고정금액 (원)" /><FInput readOnly={ro} data={data} field="managementFeeFixedAmount" onChange={onChange} type="number" placeholder="1,500,000" />
              </div>
            </div>
            )}
          </div>

          {/* 정산 일정 (green card) */}
          <div style={{ padding: "12px 14px", background: "#ECFDF5", borderRadius: 10, border: "1px solid #A7F3D0", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", marginBottom: 10 }}>{corporateOnly ? "청구서 발송일" : "정산 일정"}</div>
            {(() => {
              const d1 = parseInt(data.settlementDay1);
              const d2 = data.settlementCount === "2" ? parseInt(data.settlementDay2) : null;
              const dl = (d) => d === 0 ? "말일" : `${d}일`;
              const prev = (d) => d === 0 ? "말일 전날" : d === 1 ? "전월 말일" : `${d - 1}일`;
              const hasPeriod1 = !isNaN(d1) || d1 === 0;
              const period1 = hasPeriod1 ? (d2 != null && !isNaN(d2)
                ? (() => { const [a, b] = [d1, d2].sort((x, y) => (x || 32) - (y || 32)); return `${b === 0 ? "전월 말일" : `전월 ${b}일`} ~ ${prev(a)}`; })()
                : d1 === 0 ? `전월 말일 ~ 말일 전날` : `전월 ${dl(d1)} ~ ${prev(d1)}`) : null;
              const period2 = d2 != null && !isNaN(d2) ? (() => { const [a, b] = [d1, d2].sort((x, y) => (x || 32) - (y || 32)); return `${dl(a)} ~ ${prev(b)}`; })() : null;
              return (<>
                <div style={{ display: "grid", gridTemplateColumns: data.isShortTermRental ? "1fr 1fr 1fr" : "1fr 2fr", gap: 10 }}>
                  <div>
                    <FLabel label="정산일 (말일=0)" />
                    <FInput readOnly={ro} data={data} field="settlementDay1" onChange={onChange} type="number" min="0" max="31" placeholder="0" />
                  </div>
                  {data.isShortTermRental && (
                    <div>
                      <FLabel label="월 정산 횟수" />
                      <FSelect readOnly={ro} data={data} field="settlementCount" onChange={onChange} options={[
                        { value: "1", label: "1회" },
                        { value: "2", label: "2회" },
                      ]} />
                    </div>
                  )}
                  {data.isShortTermRental && data.settlementCount === "2" && (
                    <div>
                      <FLabel label="정산일 2 (말일=0)" />
                      <FInput readOnly={ro} data={data} field="settlementDay2" onChange={onChange} type="number" min="0" max="31" placeholder="15" />
                    </div>
                  )}
                  {!data.isShortTermRental && period1 && (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ padding: "8px 12px", background: "#D1FAE5", borderRadius: 6, fontSize: 11, color: "#065F46", fontWeight: 600, width: "100%" }}>
                        📅 정산 기간: {period1}
                      </div>
                    </div>
                  )}
                </div>
                {data.isShortTermRental && hasPeriod1 && (
                  <div style={{ display: "grid", gridTemplateColumns: period2 ? "1fr 1fr" : "1fr", gap: 8, marginTop: 8 }}>
                    <div style={{ padding: "6px 10px", background: "#D1FAE5", borderRadius: 6, fontSize: 11, color: "#065F46", fontWeight: 600 }}>
                      📅 {dl(d1)} 정산 → {period1}
                    </div>
                    {period2 && (
                      <div style={{ padding: "6px 10px", background: "#D1FAE5", borderRadius: 6, fontSize: 11, color: "#065F46", fontWeight: 600 }}>
                        📅 {dl(d2)} 정산 → {period2}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 9, color: "#6B7280", marginTop: 6 }}>※ 정산일이 토/일/공휴일이면 다음 평일에 정산합니다.</div>
              </>);
            })()}
          </div>

          {/* 검침 설정 (orange card) — 근생만 */}
          {data.isCommercial && (
            <div style={{ padding: "12px 14px", background: "#FFF7ED", borderRadius: 10, border: "1px solid #FED7AA", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#EA580C", marginBottom: 10 }}>검침 설정 (사설계량기)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* 전기 검침일 */}
                <div>
                  <FLabel label="전기 검침일 (매월)" />
                  {data.electricReadingDay == null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>검침 안 함</span>
                      {!ro && <button onClick={() => onChange({ electricReadingDay: 1 })} style={{ fontSize: 10, color: "#EA580C", background: "none", border: "1px solid #FED7AA", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>+ 설정</button>}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FInput readOnly={ro} data={data} field="electricReadingDay" onChange={onChange} type="number" min="1" max="31" placeholder="15" />
                      <span style={{ fontSize: 10, color: "#9CA3AF", whiteSpace: "nowrap" }}>일</span>
                      {!ro && <button onClick={() => onChange({ electricReadingDay: null })} style={{ fontSize: 10, color: "#DC2626", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>해제</button>}
                    </div>
                  )}
                </div>
                {/* 수도 검침일 */}
                <div>
                  <FLabel label="수도 검침일" />
                  {data.waterReadingDay == null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>검침 안 함</span>
                      {!ro && <button onClick={() => onChange({ waterReadingDay: 1, waterReadingCycle: 'every' })} style={{ fontSize: 10, color: "#EA580C", background: "none", border: "1px solid #FED7AA", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>+ 설정</button>}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <FInput readOnly={ro} data={data} field="waterReadingDay" onChange={onChange} type="number" min="1" max="31" placeholder="20" />
                        <span style={{ fontSize: 10, color: "#9CA3AF", whiteSpace: "nowrap" }}>일</span>
                        {!ro && <button onClick={() => onChange({ waterReadingDay: null, waterReadingCycle: null })} style={{ fontSize: 10, color: "#DC2626", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>해제</button>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[{ v: "every", l: "매달" }, { v: "even", l: "짝수달" }, { v: "odd", l: "홀수달" }].map(o => (
                          <label key={o.v} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#374151", cursor: ro ? "default" : "pointer" }}>
                            <input type="radio" name="waterCycle" checked={data.waterReadingCycle === o.v} onChange={() => !ro && onChange({ waterReadingCycle: o.v })} disabled={ro} />
                            {o.l}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 9, color: "#6B7280", marginTop: 8 }}>※ 검침일이 공휴일이면 가장 가까운 평일로 자동 이동됩니다.</div>
            </div>
          )}

          {/* 납부일·청구서 (amber card) — 근생/일반임대 */}
          {(data.isCommercial || data.isLongTermRental) && (
            <div style={{ padding: "12px 14px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#D97706", marginBottom: 10 }}>납부일·청구서</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* 임대료 납부일 */}
                <div>
                  <FLabel label="임대료 납부일" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#374151", cursor: ro ? "default" : "pointer" }}>
                      <input type="radio" checked={data.rentDueDay == null} onChange={() => !ro && onChange({ rentDueDay: null })} disabled={ro} />
                      입주일 기준
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#374151", cursor: ro ? "default" : "pointer" }}>
                      <input type="radio" checked={data.rentDueDay != null} onChange={() => !ro && onChange({ rentDueDay: data.rentDueDay || 25 })} disabled={ro} />
                      건물 지정일
                    </label>
                    {data.rentDueDay != null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 18 }}>
                        <FInput readOnly={ro} data={data} field="rentDueDay" onChange={onChange} type="number" min="1" max="31" placeholder="25" />
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>일</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* 관리비 납부일 */}
                <div>
                  <FLabel label="관리비 납부일" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#374151", cursor: ro ? "default" : "pointer" }}>
                      <input type="radio" checked={data.mgmtDueDay == null} onChange={() => !ro && onChange({ mgmtDueDay: null })} disabled={ro} />
                      {data.rentDueDay != null ? "임대료와 동일" : "입주일 기준"}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#374151", cursor: ro ? "default" : "pointer" }}>
                      <input type="radio" checked={data.mgmtDueDay != null} onChange={() => !ro && onChange({ mgmtDueDay: data.mgmtDueDay || 25 })} disabled={ro} />
                      건물 지정일
                    </label>
                    {data.mgmtDueDay != null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 18 }}>
                        <FInput readOnly={ro} data={data} field="mgmtDueDay" onChange={onChange} type="number" min="1" max="31" placeholder="25" />
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>일</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* 관리비 청구서 발행일 */}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #FDE68A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#374151", cursor: ro ? "default" : "pointer" }}>
                    <input type="checkbox" checked={data.mgmtBillIssueDay != null} onChange={e => !ro && onChange({ mgmtBillIssueDay: e.target.checked ? (data.mgmtBillIssueDay || 10) : null })} disabled={ro} />
                    관리비 청구서 발행일 별도 지정
                  </label>
                  {data.mgmtBillIssueDay != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FInput readOnly={ro} data={data} field="mgmtBillIssueDay" onChange={onChange} type="number" min="1" max="31" placeholder="10" />
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>일</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 청구 설정 (blue card) */}
          <div style={{ padding: "12px 14px", background: "#EFF6FF", borderRadius: 10, border: "1px solid #BFDBFE", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", marginBottom: 10 }}>청구 설정</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {/* 임대료 선후불: 단기만이면 숨김(무조건 선불). 검침형 근생이면 숨김(고정스케줄) */}
              {isRentalOrCommercial && !isMeteredCommercial && !(data.isShortTermRental && !data.isLongTermRental && !data.isCommercial) && (
                <div style={{ flex: "1 1 140px" }}>
                  <FLabel label="임대료 선후불" />
                  <FSelect readOnly={ro} data={{ ...data, rentBillingType: data.rentBillingType || "prepaid" }} field="rentBillingType" onChange={onChange} options={[
                    { value: "prepaid", label: "선불" },
                    { value: "postpaid", label: "후불" },
                  ]} />
                </div>
              )}
              {isRentalOrCommercial && !isMeteredCommercial && (
                <div style={{ flex: "1 1 140px" }}>
                  <FLabel label="관리비 선후불" />
                  <FSelect readOnly={ro} data={{ ...data, managementFeeBillingType: data.managementFeeBillingType || (data.isCommercial && !data.isShortTermRental && !data.isLongTermRental ? "" : "prepaid") }} field="managementFeeBillingType" onChange={onChange} options={[
                    { value: "prepaid", label: "선불" },
                    { value: "postpaid", label: "후불" },
                  ]} />
                </div>
              )}
              {/* 변동관리비 체크박스 제거 — 블럭에서 utilityAccountTarget(변동관리비)에 계좌 선택하면 자동으로 있는 것 */}
              {data.isCorporateFacility && (
                <div style={{ flex: "1 1 140px" }}>
                  <FLabel label="청구주기" />
                  <FSelect readOnly={ro} data={data} field="billingCycle" onChange={onChange} options={[
                    { value: "monthly", label: "월" },
                    { value: "bimonthly", label: "격월" },
                    { value: "quarterly", label: "분기" },
                    { value: "custom", label: "사용자 정의" },
                  ]} />
                </div>
              )}
            </div>
          </div>

          {/* 기업시설관리: 결제받을 하우스맨 계좌 */}
          {corporateOnly && (
            <div style={{ padding: "10px 12px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE", marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8 }}>결제받을 하우스맨 계좌</div>
              <FInput readOnly={ro} data={data} field="housemanBillingAccount" onChange={onChange} placeholder="하나은행 225-910048-15704 박종호(하우스맨)" />
            </div>
          )}

          {/* 임차인 청구 계좌 설정 */}
          {notCorporateOnly && (
          <div style={{ borderTop: "1px solid #E8ECF0", paddingTop: 14, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", marginBottom: 12 }}>💳 임차인 청구 계좌 설정</div>

            {/* 하우스맨 계좌 */}
            <div style={{ padding: "10px 12px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8 }}>하우스맨 계좌</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                <FInput readOnly={ro} data={data} field="housemanBillingAccount" onChange={onChange} placeholder="하나은행 225-910048-15704 박종호(하우스맨)" />
              </div>
            </div>

            {/* 건물주 청구 계좌 1~3 */}
            {data.tenantAccountType !== "short_houseman_only" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[1, 2, 3].map(n => {
                  const hasValue = data[`billingAccount${n}`];
                  if (n > 1 && !hasValue) return null;
                  return (
                    <div key={n} style={{ padding: "10px 12px", background: "#F0F4FF", borderRadius: 8, border: "1px solid #BFDBFE" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8 }}>{ownerLabel} 청구계좌 {n}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 6 }}>
                        <div><FLabel label="은행" /><FInput readOnly={ro} data={data} field={`billingAccount${n}Bank`} onChange={onChange} placeholder="국민은행" /></div>
                        <div><FLabel label="계좌번호" /><FInput readOnly={ro} data={data} field={`billingAccount${n}`} onChange={onChange} placeholder="110-234-567890" /></div>
                        <div><FLabel label="예금주" /><FInput readOnly={ro} data={data} field={`billingAccount${n}Holder`} onChange={onChange} placeholder="홍길동" /></div>
                      </div>
                    </div>
                  );
                })}
                {!ro && !data.billingAccount2 && (
                  <button onClick={() => onChange({ billingAccount2: " " })} style={{ padding: "10px", borderRadius: 8, border: "1.5px dashed #BFDBFE", background: "#F9FAFB", color: "#2563EB", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {`+ ${ownerLabel} 계좌 2 추가`}
                  </button>
                )}
                {!ro && data.billingAccount2 && !data.billingAccount3 && (
                  <button onClick={() => onChange({ billingAccount3: " " })} style={{ padding: "10px", borderRadius: 8, border: "1.5px dashed #BFDBFE", background: "#F9FAFB", color: "#2563EB", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {`+ ${ownerLabel} 계좌 3 추가`}
                  </button>
                )}
              </div>
            )}

            {/* 항목별 입금 계좌 지정 */}
            {(() => {
              const acctOptions = [{ value: "houseman", label: "🏢 하우스맨 계좌" }];
              if (data.billingAccount1) acctOptions.push({ value: "owner_1", label: `① ${data.billingAccount1Bank || ownerLabel} ${(data.billingAccount1 || "").slice(-4) || "계좌1"}` });
              if (data.billingAccount2) acctOptions.push({ value: "owner_2", label: `② ${data.billingAccount2Bank || ownerLabel} ${(data.billingAccount2 || "").slice(-4) || "계좌2"}` });
              if (data.billingAccount3) acctOptions.push({ value: "owner_3", label: `③ ${data.billingAccount3Bank || ownerLabel} ${(data.billingAccount3 || "").slice(-4) || "계좌3"}` });

              const allItems = [
                { field: "depositAccountTarget", label: "🔑 예치금 (보증금)", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", desc: "입주 시 1회 납부. 퇴실 시 정산 후 반환" },
                { field: "rentAccountTarget", label: "💰 월세 (임대료)", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", desc: "임차인이 납부하는 월 임대료" },
                { field: "managementFeeAccountTarget", label: "🏠 관리비", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", desc: "월 관리비 (고정분)" },
                { field: "utilityAccountTarget", label: "💧 공과금 (수도/인터넷)", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", desc: "수도, 인터넷, 케이블 등" },
                { field: "electricGasAccountTarget", label: "⚡ 전기+가스", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", desc: "전기, 가스 (공과금과 별도)" },
              ];

              /* 단기: 5개 전부 (3열). 일반: 보증금+월세+관리비+공과금 (4개, 4열). 근생: 보증금+월세+관리비+변동관리비 (4개, 4열). 관리사무소: 관리비만 */
              const shortItems = allItems;
              /* 일반: 보증금(라벨변경) + 월세 + 관리비 + 공과금 (전기가스만 제외) */
              const longTermItems = allItems.filter(i => i.field !== "electricGasAccountTarget").map(i =>
                i.field === "depositAccountTarget" ? { ...i, label: "🔑 보증금", desc: "계약 시 1회 납부. 만기/퇴실 시 반환" } : i
              );
              /* 근생: 보증금(라벨변경) + 월세 + 관리비 + 변동관리비 (전기가스 제외 + 공과금→변동관리비) */
              const commercialItems = allItems.filter(i => i.field !== "electricGasAccountTarget").map(i =>
                i.field === "depositAccountTarget" ? { ...i, label: "🔑 보증금", desc: "계약 시 1회 납부. 만기/퇴실 시 반환" }
                : i.field === "utilityAccountTarget" ? { ...i, label: "💧 변동관리비", desc: "항목별 별도 청구 (엘리베이터/소방/소독/전기안전 등)" }
                : i
              );
              /* 관리사무소: 관리비만. 월세/보증금/공과금/전기가스 없음 */
              const itemsByType = { "단기": shortItems, "일반임대": longTermItems, "근생": commercialItems, "관리사무소": [allItems[2]] };
              const typeColors = { "단기": "#2563EB", "일반임대": "#059669", "근생": "#EA580C", "관리사무소": "#7C3AED" };
              const typeBgs = { "단기": "#EFF6FF", "일반임대": "#ECFDF5", "근생": "#FFF7ED", "관리사무소": "#F5F3FF" };

              const billingTypes = derivedTypes.filter(t => itemsByType[t]);
              const isMultiType = billingTypes.length > 1;

              return billingTypes.map(bType => {
                const suffix = isMultiType ? `_${bType}` : "";
                const items = (itemsByType[bType] || allItems).map(item => ({ ...item, field: `${item.field}${suffix}` }));

                return (
                  <div key={bType} style={{ marginBottom: 16, padding: isMultiType ? "14px" : 0, background: isMultiType ? typeBgs[bType] : "transparent", borderRadius: isMultiType ? 10 : 0, border: isMultiType ? `1.5px solid ${typeColors[bType]}30` : "none" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: isMultiType ? typeColors[bType] : "#191F28", marginBottom: 8, paddingBottom: 6, borderBottom: `1.5px solid ${isMultiType ? typeColors[bType] + "40" : "#E8ECF0"}` }}>
                      📦 {isMultiType ? `${bType} 호실` : ""} 항목별 입금 계좌 지정
                    </div>
                    {!isMultiType && <div style={{ fontSize: 9, color: "#8B95A1", marginBottom: 10 }}>각 항목이 어느 계좌로 입금되는지 지정하세요. 레고 블럭처럼 자유롭게 조합.</div>}
                    {/* 단기 5개→3열, 일반/근생 4개→4열, 관리사무소 1개→1열 */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${items.length <= 4 ? items.length : 3}, 1fr)`, gap: 10, marginBottom: isMultiType ? 0 : 14 }}>
                      {items.map(item => {
                        const val = data[item.field] || "";
                        return (
                          <div key={item.field} style={{ padding: "12px 14px", borderRadius: 10, background: val ? item.bg : "#F9FAFB", border: `1.5px solid ${val ? item.border : "#E5E8EB"}`, transition: "all 0.15s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</span>
                              {val && <span style={{ fontSize: 9, fontWeight: 600, color: item.color }}>✓</span>}
                            </div>
                            <select value={val} onChange={e => onChange({ [item.field]: e.target.value || (editMode ? "" : null) })} disabled={ro}
                              style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, cursor: editMode ? "pointer" : "default", background: editMode ? "#fff" : "#F8FAFC", fontWeight: val ? 600 : 400 }}>
                              <option value="">-- 계좌 선택 --</option>
                              <option value="no_billing">🚫 청구안함</option>
                              {acctOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <div style={{ fontSize: 9, color: "#8B95A1", marginTop: 3 }}>{item.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {/* 예치금 관리 예치금액 — 예치금이 하우스맨 계좌로 설정된 경우만
                하우스맨이 건물주에게 예치금 관리 조건으로 예치하는 보증금 (건물 단위 고정금액) */}
            {data.depositAccountTarget === "houseman" && (
              <div style={{ padding: "10px 12px", background: "#F5F3FF", borderRadius: 8, border: "1px solid #DDD6FE" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", marginBottom: 8 }}>🔑 예치금 관리 설정</div>
                <div style={{ fontSize: 9, color: "#8B95A1", marginBottom: 8 }}>예치금을 하우스맨 계좌로 받는 경우, {ownerLabel}에게 관리 보증금을 예치합니다.</div>
                <div>
                  <FLabel label="예치금 관리 예치금액 (원)" />
                  <FInput readOnly={ro} data={data} field="depositManagementAmount" onChange={onChange} type="number" placeholder="5000000" />
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </Card>
  );
}


/* ════════════════════════════════════════════════════════════════
   DocumentSection
   ════════════════════════════════════════════════════════════════ */
export function DocumentSection({ data, onChange, editMode = true, defaultOpen = true, setFullScreenFile }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { anyTypeChecked, corporateOnly } = useVisibility(data);
  if (!anyTypeChecked) return null;
  const ro = !editMode;

  return (
    <Card style={{ marginBottom: 16 }}>
      <SectionHeader title="서류" subtitle="첨부서류" icon="📎" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {!corporateOnly && <FFileUpload data={data} field="fireInsuranceDocumentUrl" label="화재보험 증권" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />}
            {!corporateOnly && <FFileUpload data={data} field="documentBuildingRegisterUrl" label="건축물대장" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />}
            <FFileUpload data={data} field="documentManagementContractUrl" label="관리용역계약서" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />
            <FFileUpload data={data} field="documentBusinessRegistrationUrl" label="사업자등록증" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />
            {!corporateOnly && <FFileUpload data={data} field="documentCompletionDrawingUrl" label="준공도면" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />}
            <FFileUpload data={data} field="documentEtc1Url" label="기타 서류 1" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />
            <FFileUpload data={data} field="documentEtc2Url" label="기타 서류 2" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />
            <FFileUpload data={data} field="documentEtc3Url" label="기타 서류 3" onChange={onChange} setFullScreenFile={setFullScreenFile} readOnly={ro} />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════
   ContractSpecialTermsSection — 건물유형별 계약서 특약사항
   단기/일반/근생 각각 별도. 복합건물은 체크된 유형만큼 표시.
   호실에서는 건물 유형에 맞는 특약이 자동으로 따라감 (호실 수정 불가).
   ════════════════════════════════════════════════════════════════ */
export function ContractSpecialTermsSection({ data, onChange, editMode = true, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { anyTypeChecked, corporateOnly } = useVisibility(data);
  if (!anyTypeChecked || corporateOnly) return null;
  const ro = !editMode;

  const types = [
    { field: "contractSpecialTermsShortTerm", label: "🏠 단기임대 특약사항", show: !!data.isShortTermRental, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
    { field: "contractSpecialTermsLongTerm", label: "🏢 일반임대 특약사항", show: !!data.isLongTermRental, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    { field: "contractSpecialTermsCommercial", label: "🏪 근생 특약사항", show: !!data.isCommercial, color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
  ].filter(t => t.show);

  if (types.length === 0) return null;

  return (
    <Card style={{ marginBottom: 16 }}>
      <SectionHeader title="계약서 특약사항" subtitle="건물유형별 특약 — 호실 계약서에 자동 삽입" icon="📝" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          <div style={{ fontSize: 10, color: "#8B95A1", marginBottom: 12 }}>건물유형별로 특약사항을 작성하면 해당 유형 호실의 계약서에 자동으로 삽입됩니다. 호실에서는 수정할 수 없습니다.</div>
          {/* 열(가로) 배치: 1개면 1열, 2개면 2열, 3개면 3열. 높이 넉넉하게 */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${types.length}, 1fr)`, gap: 12 }}>
            {types.map(t => (
              <div key={t.field} style={{ padding: "12px 14px", background: t.bg, borderRadius: 10, border: `1.5px solid ${t.border}`, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 8 }}>{t.label}</div>
                <FTextarea readOnly={ro} data={data} field={t.field} onChange={onChange} placeholder={`${t.label.slice(2)} 내용을 입력하세요...`} rows={8} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
