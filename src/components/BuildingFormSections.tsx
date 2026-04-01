// @ts-nocheck
import { useState, useRef } from 'react';
import { inputClassName } from './Field';
import { Card } from './Card';
import { FIELD_VALIDATORS } from '../utils/validation';

/* ══════════════════════════════════════════════════════════════
   Shared Building Form Sections
   Both BuildingDetailPage and BuildingsPage use these components.
   Props: data (object), onChange (patch => void), editMode (bool)
   ══════════════════════════════════════════════════════════════ */

/* ── Shared field helpers ── */
const FLabel = ({ label }) => (
  <div className="text-[11px] text-[#8B95A1] mb-[3px]">{label}</div>
);

const FInput = ({ data, field, onChange, placeholder, type, style: extraStyle, readOnly, required: isRequired, className: extraClassName, ...rest }) => {
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
    <div className="relative">
      <input type={type || "text"} value={data[field] ?? ""} onChange={e => { !readOnly && onChange({ [field]: e.target.value }); if (touched) { const v = validator; if (v) { const r = v(e.target.value); setError(r.valid ? "" : r.message); } else { setError(""); } } }}
        onBlur={handleBlur} readOnly={readOnly} placeholder={placeholder}
        className={`${inputClassName} px-3 py-2 text-xs ${readOnly ? 'bg-hm-bg-slate cursor-default' : 'bg-white cursor-text'} ${hasError ? 'border-red-500' : ''} ${extraClassName || ''}`}
        style={extraStyle} {...rest} />
      {hasError && <div className="text-[9px] text-red-500 mt-0.5">{error}</div>}
    </div>
  );
};

const FSelect = ({ data, field, onChange, options, style: extraStyle, readOnly }) => (
  <select value={data[field] || ""} onChange={e => !readOnly && onChange({ [field]: e.target.value })} disabled={readOnly}
    className={`${inputClassName} px-3 py-2 text-xs ${readOnly ? 'cursor-default bg-hm-bg-slate' : 'cursor-pointer bg-white'}`}
    style={extraStyle}>
    <option value="">선택</option>
    {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const FCheck = ({ data, field, onChange, label, readOnly }) => (
  <div className="flex items-center gap-2.5">
    <input type="checkbox" checked={!!data[field]} onChange={e => !readOnly && onChange({ [field]: e.target.checked })} disabled={readOnly} className="w-4 h-4" />
    <div className="text-xs text-hm-text-muted">{label}</div>
  </div>
);

const FTextarea = ({ data, field, onChange, placeholder, rows, readOnly }) => (
  <textarea value={data[field] || ""} onChange={e => !readOnly && onChange({ [field]: e.target.value })}
    readOnly={readOnly} placeholder={placeholder} rows={rows || 3}
    className={`${inputClassName} px-3 py-2 text-xs min-h-[60px] w-full resize-y ${readOnly ? 'bg-hm-bg-slate' : 'bg-white'}`} />
);

/* ── Collapsible section header ── */
const SectionHeader = ({ title, subtitle, icon, isOpen, onToggle }) => (
  <div onClick={onToggle} className={`cursor-pointer flex justify-between items-center ${isOpen ? 'mb-3' : 'mb-0'}`}>
    <div>
      <div className="text-[15px] font-[800] text-hm-text">{icon} {title}</div>
      {subtitle && <div className="text-[11px] text-hm-text-muted mt-0.5">{subtitle}</div>}
    </div>
    <span className="text-sm text-hm-text-muted transition-transform duration-200" style={{ transform: isOpen ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
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
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
      {!value ? (
        readOnly ? (
          <div className="w-full py-5 px-3 rounded-lg border-[1.5px] border-dashed border-gray-300 bg-hm-bg-slate text-gray-400 text-[11px] font-[inherit] text-center">
            첨부된 파일 없음
          </div>
        ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full py-5 px-3 rounded-lg border-[1.5px] border-dashed text-[11px] cursor-pointer font-[inherit] text-center transition-all duration-150 ${isDragging ? 'border-hm-blue-dark bg-hm-blue-bg text-hm-blue-dark' : 'border-gray-300 bg-hm-bg-hover text-gray-500'}`}>
          {isDragging ? '여기에 놓으세요' : '파일 첨부 (클릭 또는 드래그)'}
        </div>
        )
      ) : (
        <div className="relative">
          <div onClick={() => setFullScreenFile && setFullScreenFile({ src: value, type: data[field + 'Type'], name: fileName })}
            className={`w-full h-20 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-hm-bg-hover ${setFullScreenFile ? 'cursor-pointer' : 'cursor-default'}`}>
            {isPdf ? (
              <div className="text-center">
                <div className="text-[28px]">PDF</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{fileName}</div>
              </div>
            ) : (
              <img src={value} alt={label} className="max-w-full max-h-full object-contain" />
            )}
          </div>
          {!readOnly && <button onClick={(e) => { e.stopPropagation(); onChange({ [field]: null, [field + 'Name']: null, [field + 'Type']: null }); }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full border-none bg-red-500 text-white text-[11px] cursor-pointer flex items-center justify-center p-0 hover:bg-red-600 transition-colors">X</button>}
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
    { field: "isShortTermRental", label: "단기임대", icon: "\u{1F3E0}", color: "var(--color-hm-blue)", bg: "var(--color-hm-blue-bg)", border: "#BFDBFE" },
    { field: "isLongTermRental", label: "일반임대", icon: "\u{1F3E2}", color: "var(--color-hm-success)", bg: "var(--color-hm-success-bg)", border: "var(--color-hm-success-border)" },
    { field: "isCommercial", label: "근생", icon: "\u{1F3EA}", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    { field: "isManagementAgency", label: "관리사무소대행", icon: "\u{1F3D7}\uFE0F", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
    { field: "isCorporateFacility", label: "기업시설관리", icon: "\u{1F3ED}", color: "var(--color-hm-danger)", bg: "var(--color-hm-danger-bg)", border: "var(--color-hm-danger-border)" },
  ];

  return (
    <div className="mb-4">
      {/* Lock/unlock controls */}
      {locked !== undefined && anyTypeChecked && locked && editMode && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-[#8B95A1]">🔒 건물 유형이 설정되어 있습니다. 변경이 필요하면 잠금을 해제하세요.</div>
          <button onClick={() => {
            if (window.confirm("건물 유형을 변경하면 청구/정산 설정에 영향을 줄 수 있습니다.\n정말 잠금을 해제하시겠습니까?")) onUnlock && onUnlock();
          }} className="px-3 py-1 rounded-md border border-red-200 bg-hm-danger-bg text-hm-danger text-[10px] font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-red-100 transition-colors">🔓 잠금 해제</button>
        </div>
      )}
      {locked !== undefined && anyTypeChecked && !editMode && (
        <div className="text-[10px] text-[#8B95A1] mb-2">🔒 건물 유형 (수정 모드에서 변경 가능)</div>
      )}
      {locked !== undefined && !locked && anyTypeChecked && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-hm-danger font-semibold">⚠️ 건물 유형 변경 모드. 변경 후 아래 잠금 버튼을 눌러주세요.</div>
          <button onClick={() => onLock && onLock()} className="px-3 py-1 rounded-md border border-emerald-200 bg-hm-success-bg text-hm-success text-[10px] font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-emerald-100 transition-colors">🔒 잠금</button>
        </div>
      )}
      <div className="flex gap-2.5 flex-wrap">
        {typeConfigs.map(t => {
          const active = !!data[t.field];
          const soloTypes = ["isManagementAgency", "isCorporateFacility"];
          const mixTypes = ["isShortTermRental", "isLongTermRental", "isCommercial"];
          const isSolo = soloTypes.includes(t.field);
          const hasSoloSelected = soloTypes.some(f => f !== t.field && data[f]);
          const hasMixSelected = mixTypes.some(f => data[f]);
          const isLocked = locked !== undefined && anyTypeChecked && locked;
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
              className="relative flex-1 min-w-[130px] py-3.5 px-4 rounded-xl text-center transition-all duration-200"
              style={{
                cursor: disabled ? (isLocked ? "default" : "not-allowed") : "pointer",
                background: active ? t.bg : "var(--color-hm-bg-hover)",
                border: `2.5px solid ${active ? t.color : "#E5E7EB"}`,
                opacity: disabled ? (isLocked && active ? 0.85 : isLocked ? 0.3 : 0.25) : active ? 1 : 0.5,
                boxShadow: active ? `0 0 0 2px ${t.color}30` : "none",
              }}>
              {active && (
                <div className="absolute -top-2 -right-2 w-[22px] h-[22px] rounded-full flex items-center justify-center shadow-md" style={{ background: t.color }}>
                  <span className="text-white text-[13px] font-black">✓</span>
                </div>
              )}
              {isLocked && active && (
                <div className="absolute -top-1.5 -left-1.5 text-xs">🔒</div>
              )}
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-[13px] font-[800]" style={{ color: active ? t.color : "#9CA3AF" }}>{t.label}</div>
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
    <Card className="mb-4">
      <SectionHeader title={corporateOnly ? "회사 정보" : "건물 정보"} subtitle={corporateOnly ? "기본정보" : "기본정보, 시설/보안, 공과금/인프라"} icon="📋" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          <div className="grid grid-cols-4 gap-2.5 hm-form-grid-4">
            <div><FLabel label={corporateOnly ? "회사명" : "건물명"} /><FInput readOnly={ro} data={data} field="buildingName" onChange={onChange} placeholder={corporateOnly ? "회사명" : (buildingNamePlaceholder || "건물명")} /></div>
            <div><FLabel label="🔑 현관 비밀번호" /><FInput readOnly={ro} data={data} field="entranceDoorPassword" onChange={onChange} placeholder="비밀번호" className="font-mono tracking-wider" /></div>
            <div><FLabel label={corporateOnly ? "회사 약칭" : "건물 약칭"} /><FInput readOnly={ro} data={data} field="buildingNickname" onChange={onChange} placeholder="약칭" /></div>
            <div><FLabel label="관리시작일" /><FInput readOnly={ro} data={data} field="contractStartDate" onChange={onChange} type="date" /></div>
            <div>
              <FLabel label="도로명 주소" />
              <div className="flex gap-1.5 items-center">
                <input value={data.addressRoad || ""} onChange={e => !ro && onChange({ addressRoad: e.target.value })} readOnly={ro} placeholder="주소 검색 또는 직접 입력" className={`${inputClassName} py-1.5 px-2 text-[11px] flex-1 ${ro ? 'bg-hm-bg-slate' : 'bg-white'}`} />
                {!ro && <button onClick={() => {
                  new window.daum.Postcode({
                    oncomplete: (d) => {
                      onChange({ addressOld: d.jibunAddress || d.autoJibunAddress || "", addressRoad: d.roadAddress || "" });
                    }
                  }).open();
                }} className="px-3.5 py-1.5 rounded-md border-none bg-hm-blue text-white text-[11px] font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-hm-blue-dark transition-colors">검색</button>}
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
              <div className="col-span-2" style={{ opacity: Number(data.cctvCount) > 0 ? 1 : 0.4, pointerEvents: Number(data.cctvCount) > 0 ? "auto" : "none" }}><FLabel label="CCTV 설치법 및 비밀번호" /><FInput readOnly={ro} data={data} field="cctvInstallInfo" onChange={onChange} /></div>
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
                <div className="flex gap-1.5 items-center">
                  <FInput readOnly={ro} data={data} field="septicTankCleaningMonth1" onChange={onChange} type="number" min="1" max="12" placeholder="6" style={{ width: 70 }} />
                  {!data.septicTankCleaningMonth2 ? (
                    !ro && <button onClick={() => onChange({ septicTankCleaningMonth2: "12" })} className="px-2.5 py-1 rounded-md border border-dashed border-emerald-200 bg-green-50 text-hm-success text-[10px] font-semibold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-emerald-100 transition-colors">+ 연2회</button>
                  ) : (
                    <>
                      <FInput readOnly={ro} data={data} field="septicTankCleaningMonth2" onChange={onChange} type="number" min="1" max="12" placeholder="12" style={{ width: 70 }} />
                      {!ro && <button onClick={() => onChange({ septicTankCleaningMonth2: "" })} className="px-1.5 py-0.5 rounded border border-red-200 bg-hm-danger-bg text-hm-danger text-[9px] font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">✕</button>}
                    </>
                  )}
                </div>
              </div>
              <div><FLabel label="월 순회점검 횟수" /><FInput readOnly={ro} data={data} field="monthlyInspectionCount" onChange={onChange} type="number" placeholder="2" /></div>
              <FCheck readOnly={ro} data={data} field="isFireInspectionSelf" onChange={onChange} label="소방점검 하우스맨이 수행" />
            </>)}
            {/* 단기임대 전용 설정 */}
            {data.isShortTermRental && (
              <div className="col-span-full p-2.5 px-3 bg-hm-blue-bg rounded-lg border border-blue-200">
                <div className="text-[10px] font-[800] text-hm-blue-dark mb-2">🏠 단기임대 전용 설정</div>
                <div className="flex gap-4 mb-2">
                  <FCheck readOnly={ro} data={data} field="isResidentRegistrationAllowed" onChange={onChange} label="전입신고 가능" />
                  <FCheck readOnly={ro} data={data} field="isStandardContract" onChange={onChange} label="표준계약서 사용" />
                  <FCheck readOnly={ro} data={data} field="isRenthomeWritingAgency" onChange={onChange} label="렌트홈 작성 대행" />
                  <FCheck readOnly={ro} data={data} field="isStorageAvailable" onChange={onChange} label="창고 사용 가능" />
                </div>
                <div className="grid grid-cols-4 gap-2.5 hm-form-grid-4">
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
            <div className="col-span-full">
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
    <Card className="mb-4">
      <SectionHeader title={ownerLabel} subtitle={corporateOnly ? "담당자 정보, 계좌" : `${ownerLabel} 정보, 사업자정보, 계좌`} icon="👤" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          {/* 건물주 1 */}
          <div className="grid grid-cols-3 gap-3 mb-2 hm-form-grid-3">
            <div><FLabel label="이름" /><FInput readOnly={ro} data={data} field="ownerName" onChange={onChange} placeholder="홍길동" /></div>
            <div><FLabel label="주민등록번호" /><FInput readOnly={ro} data={data} field="ownerResidentNumber" onChange={onChange} placeholder="000000-0000000" className="font-mono" /></div>
            <div><FLabel label="전화번호" /><FInput readOnly={ro} data={data} field="ownerPhone" onChange={onChange} placeholder="010-0000-0000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div><FLabel label="이메일 1" /><FInput readOnly={ro} data={data} field="ownerEmail" onChange={onChange} placeholder="owner@email.com" /></div>
            <div><FLabel label="이메일 2" /><FInput readOnly={ro} data={data} field="ownerEmail2" onChange={onChange} placeholder="보조 이메일" /></div>
            {!corporateOnly && <div>
              <FLabel label="자택 주소" />
              <div className="flex gap-1.5 items-center mb-1">
                <input value={data.ownerHomeAddress || ""} onChange={() => {}} placeholder="주소 검색" className={`${inputClassName} px-3 py-2 text-xs flex-1`} readOnly />
                {!ro && <button onClick={() => {
                  new window.daum.Postcode({
                    oncomplete: (d) => {
                      onChange({ ownerHomeAddress: d.roadAddress || d.jibunAddress || "" });
                    }
                  }).open();
                }} className="px-3.5 py-2 rounded-md border-none bg-hm-blue text-white text-[11px] font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-hm-blue-dark transition-colors">검색</button>}
                <input value={data.ownerHomeAddressDetail || ""} onChange={e => !ro && onChange({ ownerHomeAddressDetail: e.target.value })} readOnly={ro} placeholder="상세주소" className={`${inputClassName} px-3 py-2 text-xs flex-1 ${ro ? 'bg-hm-bg-slate' : 'bg-white'}`} />
              </div>
            </div>}
          </div>

          {/* 건물주 정산계좌 */}
          {!hideSettlementAccounts && (
          <div className="border-t border-hm-border pt-3.5 mt-4 mb-3">
            <div className="text-xs font-bold text-hm-success mb-2.5">🏦 {ownerLabel} 정산계좌</div>
            <div className="grid grid-cols-2 gap-2.5">
              {/* 정산 계좌 1 */}
              <div className="p-2.5 px-3 bg-hm-success-bg rounded-lg border border-emerald-200">
                <div className="text-[11px] font-[800] text-hm-success mb-2">정산 계좌 ①</div>
                <div className="grid grid-cols-[1fr_2fr_1fr] gap-1.5">
                  <div><FLabel label="은행" /><FInput readOnly={ro} data={data} field="settlementAccount1Bank" onChange={onChange} placeholder="국민은행" /></div>
                  <div><FLabel label="계좌번호" /><FInput readOnly={ro} data={data} field="settlementAccount1" onChange={onChange} placeholder="110-234-567890" /></div>
                  <div><FLabel label="예금주" /><FInput readOnly={ro} data={data} field="settlementAccount1Holder" onChange={onChange} placeholder="홍길동" /></div>
                </div>
              </div>
              {/* 정산 계좌 2 */}
              <div className="p-2.5 px-3 rounded-lg" style={{ background: data.settlementAccount2 ? "var(--color-hm-success-bg)" : "var(--color-hm-bg-muted)", border: `1px solid ${data.settlementAccount2 ? "var(--color-hm-success-border)" : "#E5E8EB"}` }}>
                <div className="text-[11px] font-[800] mb-2" style={{ color: data.settlementAccount2 ? "var(--color-hm-success)" : "#8B95A1" }}>정산 계좌 ②</div>
                <div className="grid grid-cols-[1fr_2fr_1fr] gap-1.5">
                  <div><FLabel label="은행" /><FInput readOnly={ro} data={data} field="settlementAccount2Bank" onChange={onChange} placeholder="은행" /></div>
                  <div><FLabel label="계좌번호" /><FInput readOnly={ro} data={data} field="settlementAccount2" onChange={onChange} placeholder="계좌번호" /></div>
                  <div><FLabel label="예금주" /><FInput readOnly={ro} data={data} field="settlementAccount2Holder" onChange={onChange} placeholder="예금주" /></div>
                </div>
              </div>
            </div>
            {/* 분배 설정 */}
            {data.settlementAccount2 && (
              <div className="grid grid-cols-2 gap-2.5 mt-2">
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
                    {data.settlementSplitValue && <div className="text-[9px] text-[#8B95A1] mt-0.5">계좌①: {data.settlementSplitValue}% / 계좌②: {100 - (parseInt(data.settlementSplitValue) || 0)}%</div>}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* 사업자 정보 */}
          <div className="p-2 px-2.5 bg-hm-bg-slate rounded-lg border border-hm-border mb-2.5">
            <div className="text-xs font-bold text-indigo-500 mb-1.5">사업자 정보</div>
            <div className="grid grid-cols-3 gap-3 mb-1.5 hm-form-grid-3">
              <div><FLabel label="사업자등록번호" /><FInput readOnly={ro} data={data} field="ownerBusinessRegistrationNumber" onChange={onChange} placeholder="000-00-00000" className="font-mono" /></div>
              <div><FLabel label="사업자 상호" /><FInput readOnly={ro} data={data} field="ownerBusinessName" onChange={onChange} placeholder="상호명" /></div>
              <div><FLabel label="사업장 주소" /><FInput readOnly={ro} data={data} field="ownerBusinessAddress" onChange={onChange} placeholder="사업장 주소" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 hm-form-grid-3">
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
              className="px-4 py-1.5 rounded-md border-[1.5px] border-dashed border-hm-blue bg-hm-blue-bg text-hm-blue-dark text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">
              {`＋ ${ownerLabel} 추가 (공동소유)`}
            </button>
          )}

          {/* 건물주 2 */}
          {(showOwner2 || data.owner2Name) && (
            <div className="p-2.5 px-3 bg-amber-50 rounded-lg border border-amber-200 mb-2.5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-amber-800">👤 {ownerLabel} 2 (공동소유)</span>
                {!ro && <button onClick={() => { setShowOwner2(false); setShowOwner3(false); onChange({ owner2Name: "", owner2ResidentNumber: "", owner2Phone: "", owner2Email: "", owner2HomeAddress: "", owner2HomeAddressDetail: "", owner3Name: "", owner3ResidentNumber: "", owner3Phone: "", owner3Email: "", owner3HomeAddress: "", owner3HomeAddressDetail: "", coOwnerMemo: "" }); }}
                  className="px-2.5 py-0.5 rounded-[5px] border border-red-200 bg-hm-danger-bg text-hm-danger text-[10px] font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">✕ 삭제</button>}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-1.5 hm-form-grid-3">
                <div><FLabel label="이름" /><FInput readOnly={ro} data={data} field="owner2Name" onChange={onChange} placeholder="이름" /></div>
                <div><FLabel label="주민등록번호" /><FInput readOnly={ro} data={data} field="owner2ResidentNumber" onChange={onChange} placeholder="000000-0000000" className="font-mono" /></div>
                <div><FLabel label="전화번호" /><FInput readOnly={ro} data={data} field="owner2Phone" onChange={onChange} placeholder="010-0000-0000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div><FLabel label="이메일" /><FInput readOnly={ro} data={data} field="owner2Email" onChange={onChange} placeholder="email" /></div>
                <div>
                  <FLabel label="자택 주소" />
                  <div className="flex gap-1.5 items-center mb-1">
                    <input value={data.owner2HomeAddress || ""} onChange={() => {}} placeholder="주소 검색" className={`${inputClassName} px-3 py-2 text-xs flex-1`} readOnly />
                    {!ro && <button onClick={() => {
                      new window.daum.Postcode({
                        oncomplete: (d) => {
                          onChange({ owner2HomeAddress: d.roadAddress || d.jibunAddress || "" });
                        }
                      }).open();
                    }} className="px-3.5 py-2 rounded-md border-none bg-hm-blue text-white text-[11px] font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-hm-blue-dark transition-colors">검색</button>}
                    <input value={data.owner2HomeAddressDetail || ""} onChange={e => !ro && onChange({ owner2HomeAddressDetail: e.target.value })} readOnly={ro} placeholder="상세주소" className={`${inputClassName} px-3 py-2 text-xs flex-1 ${ro ? 'bg-hm-bg-slate' : 'bg-white'}`} />
                  </div>
                </div>
              </div>
              {/* 건물주 3 추가 버튼 */}
              {!ro && !showOwner3 && !data.owner3Name && (
                <button onClick={() => setShowOwner3(true)}
                  className="mt-2 px-4 py-1.5 rounded-md border-[1.5px] border-dashed border-hm-blue bg-hm-blue-bg text-hm-blue-dark text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">
                  {`＋ ${ownerLabel} 3 추가`}
                </button>
              )}
            </div>
          )}

          {/* 건물주 3 */}
          {(showOwner3 || data.owner3Name) && (showOwner2 || data.owner2Name) && (
            <div className="p-2.5 px-3 bg-green-50 rounded-lg border border-green-200 mb-2.5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-green-800">👤 {ownerLabel} 3 (공동소유)</span>
                {!ro && <button onClick={() => { setShowOwner3(false); onChange({ owner3Name: "", owner3ResidentNumber: "", owner3Phone: "", owner3Email: "", owner3HomeAddress: "", owner3HomeAddressDetail: "" }); }}
                  className="px-2.5 py-0.5 rounded-[5px] border border-red-200 bg-hm-danger-bg text-hm-danger text-[10px] font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">✕ 삭제</button>}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-1.5 hm-form-grid-3">
                <div><FLabel label="이름" /><FInput readOnly={ro} data={data} field="owner3Name" onChange={onChange} placeholder="이름" /></div>
                <div><FLabel label="주민등록번호" /><FInput readOnly={ro} data={data} field="owner3ResidentNumber" onChange={onChange} placeholder="000000-0000000" className="font-mono" /></div>
                <div><FLabel label="전화번호" /><FInput readOnly={ro} data={data} field="owner3Phone" onChange={onChange} placeholder="010-0000-0000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div><FLabel label="이메일" /><FInput readOnly={ro} data={data} field="owner3Email" onChange={onChange} placeholder="email" /></div>
                <div>
                  <FLabel label="자택 주소" />
                  <div className="flex gap-1.5 items-center mb-1">
                    <input value={data.owner3HomeAddress || ""} onChange={() => {}} placeholder="주소 검색" className={`${inputClassName} px-3 py-2 text-xs flex-1`} readOnly />
                    {!ro && <button onClick={() => {
                      new window.daum.Postcode({
                        oncomplete: (d) => {
                          onChange({ owner3HomeAddress: d.roadAddress || d.jibunAddress || "" });
                        }
                      }).open();
                    }} className="px-3.5 py-2 rounded-md border-none bg-hm-blue text-white text-[11px] font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-hm-blue-dark transition-colors">검색</button>}
                    <input value={data.owner3HomeAddressDetail || ""} onChange={e => !ro && onChange({ owner3HomeAddressDetail: e.target.value })} readOnly={ro} placeholder="상세주소" className={`${inputClassName} px-3 py-2 text-xs flex-1 ${ro ? 'bg-hm-bg-slate' : 'bg-white'}`} />
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
          <div className="border-t border-hm-border pt-3.5 mt-4">
            <div className="text-[11px] font-[800] text-hm-blue-dark mb-2">연락 담당자</div>
            <div className="grid grid-cols-3 gap-3 mb-1.5 hm-form-grid-3">
              <div><FLabel label="담당자 이름" /><FInput readOnly={ro} data={data} field="contactPersonName" onChange={onChange} /></div>
              <div><FLabel label="담당자 전화" /><FInput readOnly={ro} data={data} field="contactPersonPhone" onChange={onChange} /></div>
              <div><FLabel label="담당자 이메일" /><FInput readOnly={ro} data={data} field="contactPersonEmail" onChange={onChange} /></div>
            </div>
            <div className="mb-3">
              <FCheck readOnly={ro} data={data} field="isContactPersonPrimary" onChange={onChange} label={`1차 연락대상 여부 (${ownerLabel}보다 먼저 연락)`} />
            </div>
            <div className="border-t border-hm-border pt-2.5">
              <div className="text-[11px] font-[800] text-hm-success mb-2">현장소장</div>
              <div className="grid grid-cols-3 gap-2.5 hm-form-grid-3">
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
    <Card className="mb-4">
      <SectionHeader title={corporateOnly ? "청구 설정" : "정산·청구"} subtitle={corporateOnly ? "청구 주기, 수수료" : "수수료/정산, 청구 방식"} icon="💰" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          {/* 관리수수료 (purple card) */}
          <div className="p-3 px-3.5 bg-violet-50 rounded-[10px] border border-violet-200 mb-3.5">
            <div className="text-xs font-[800] text-violet-600 mb-2.5">관리수수료</div>
            {corporateOnly ? (
              <div className="max-w-[300px]">
                <FLabel label="고정금액 (원)" /><FInput readOnly={ro} data={data} field="managementFeeFixedAmount" onChange={onChange} type="number" placeholder="1,500,000" />
              </div>
            ) : (
            <div className="grid grid-cols-3 gap-2.5 hm-form-grid-3">
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
          <div className="p-3 px-3.5 bg-hm-success-bg rounded-[10px] border border-emerald-200 mb-3.5">
            <div className="text-xs font-[800] text-hm-success mb-2.5">{corporateOnly ? "청구서 발송일" : "정산 일정"}</div>
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
                    <div className="flex items-center">
                      <div className="px-3 py-2 bg-emerald-100 rounded-md text-[11px] text-emerald-800 font-semibold w-full">
                        📅 정산 기간: {period1}
                      </div>
                    </div>
                  )}
                </div>
                {data.isShortTermRental && hasPeriod1 && (
                  <div style={{ display: "grid", gridTemplateColumns: period2 ? "1fr 1fr" : "1fr", gap: 8 }} className="mt-2">
                    <div className="px-2.5 py-1.5 bg-emerald-100 rounded-md text-[11px] text-emerald-800 font-semibold">
                      📅 {dl(d1)} 정산 → {period1}
                    </div>
                    {period2 && (
                      <div className="px-2.5 py-1.5 bg-emerald-100 rounded-md text-[11px] text-emerald-800 font-semibold">
                        📅 {dl(d2)} 정산 → {period2}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-[9px] text-gray-500 mt-1.5">※ 정산일이 토/일/공휴일이면 다음 평일에 정산합니다.</div>
              </>);
            })()}
          </div>

          {/* 검침 설정 (orange card) — 근생만 */}
          {data.isCommercial && (
            <div className="p-3 px-3.5 bg-hm-warning-bg rounded-[10px] border border-orange-200 mb-3.5">
              <div className="text-xs font-[800] text-hm-warning mb-2.5">검침 설정 (사설계량기)</div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* 전기 검침일 */}
                <div>
                  <FLabel label="전기 검침일 (매월)" />
                  {data.electricReadingDay == null ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">검침 안 함</span>
                      {!ro && <button onClick={() => onChange({ electricReadingDay: 1 })} className="text-[10px] text-hm-warning bg-transparent border border-orange-200 rounded px-2 py-0.5 cursor-pointer font-[inherit] hover:bg-orange-50 transition-colors">+ 설정</button>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <FInput readOnly={ro} data={data} field="electricReadingDay" onChange={onChange} type="number" min="1" max="31" placeholder="15" />
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">일</span>
                      {!ro && <button onClick={() => onChange({ electricReadingDay: null })} className="text-[10px] text-hm-danger bg-transparent border-none cursor-pointer whitespace-nowrap hover:text-red-700 transition-colors">해제</button>}
                    </div>
                  )}
                </div>
                {/* 수도 검침일 */}
                <div>
                  <FLabel label="수도 검침일" />
                  {data.waterReadingDay == null ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">검침 안 함</span>
                      {!ro && <button onClick={() => onChange({ waterReadingDay: 1, waterReadingCycle: 'every' })} className="text-[10px] text-hm-warning bg-transparent border border-orange-200 rounded px-2 py-0.5 cursor-pointer font-[inherit] hover:bg-orange-50 transition-colors">+ 설정</button>}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FInput readOnly={ro} data={data} field="waterReadingDay" onChange={onChange} type="number" min="1" max="31" placeholder="20" />
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">일</span>
                        {!ro && <button onClick={() => onChange({ waterReadingDay: null, waterReadingCycle: null })} className="text-[10px] text-hm-danger bg-transparent border-none cursor-pointer whitespace-nowrap hover:text-red-700 transition-colors">해제</button>}
                      </div>
                      <div className="flex gap-1.5">
                        {[{ v: "every", l: "매달" }, { v: "even", l: "짝수달" }, { v: "odd", l: "홀수달" }].map(o => (
                          <label key={o.v} className={`flex items-center gap-[3px] text-[11px] text-gray-700 ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
                            <input type="radio" name="waterCycle" checked={data.waterReadingCycle === o.v} onChange={() => !ro && onChange({ waterReadingCycle: o.v })} disabled={ro} />
                            {o.l}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-[9px] text-gray-500 mt-2">※ 검침일이 공휴일이면 가장 가까운 평일로 자동 이동됩니다.</div>
            </div>
          )}

          {/* 납부일·청구서 (amber card) — 근생/일반임대 */}
          {(data.isCommercial || data.isLongTermRental) && (
            <div className="p-3 px-3.5 bg-amber-50 rounded-[10px] border border-amber-200 mb-3.5">
              <div className="text-xs font-[800] text-amber-600 mb-2.5">납부일·청구서</div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* 임대료 납부일 */}
                <div>
                  <FLabel label="임대료 납부일" />
                  <div className="flex flex-col gap-1">
                    <label className={`flex items-center gap-1 text-[11px] text-gray-700 ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
                      <input type="radio" checked={data.rentDueDay == null} onChange={() => !ro && onChange({ rentDueDay: null })} disabled={ro} />
                      입주일 기준
                    </label>
                    <label className={`flex items-center gap-1 text-[11px] text-gray-700 ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
                      <input type="radio" checked={data.rentDueDay != null} onChange={() => !ro && onChange({ rentDueDay: data.rentDueDay || 25 })} disabled={ro} />
                      건물 지정일
                    </label>
                    {data.rentDueDay != null && (
                      <div className="flex items-center gap-1.5 ml-[18px]">
                        <FInput readOnly={ro} data={data} field="rentDueDay" onChange={onChange} type="number" min="1" max="31" placeholder="25" />
                        <span className="text-[10px] text-gray-400">일</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* 관리비 납부일 */}
                <div>
                  <FLabel label="관리비 납부일" />
                  <div className="flex flex-col gap-1">
                    <label className={`flex items-center gap-1 text-[11px] text-gray-700 ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
                      <input type="radio" checked={data.mgmtDueDay == null} onChange={() => !ro && onChange({ mgmtDueDay: null })} disabled={ro} />
                      {data.rentDueDay != null ? "임대료와 동일" : "입주일 기준"}
                    </label>
                    <label className={`flex items-center gap-1 text-[11px] text-gray-700 ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
                      <input type="radio" checked={data.mgmtDueDay != null} onChange={() => !ro && onChange({ mgmtDueDay: data.mgmtDueDay || 25 })} disabled={ro} />
                      건물 지정일
                    </label>
                    {data.mgmtDueDay != null && (
                      <div className="flex items-center gap-1.5 ml-[18px]">
                        <FInput readOnly={ro} data={data} field="mgmtDueDay" onChange={onChange} type="number" min="1" max="31" placeholder="25" />
                        <span className="text-[10px] text-gray-400">일</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* 관리비 청구서 발행일 */}
              <div className="mt-2.5 pt-2.5 border-t border-amber-200">
                <div className="flex items-center gap-2">
                  <label className={`flex items-center gap-1 text-[11px] text-gray-700 ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
                    <input type="checkbox" checked={data.mgmtBillIssueDay != null} onChange={e => !ro && onChange({ mgmtBillIssueDay: e.target.checked ? (data.mgmtBillIssueDay || 10) : null })} disabled={ro} />
                    관리비 청구서 발행일 별도 지정
                  </label>
                  {data.mgmtBillIssueDay != null && (
                    <div className="flex items-center gap-1.5">
                      <FInput readOnly={ro} data={data} field="mgmtBillIssueDay" onChange={onChange} type="number" min="1" max="31" placeholder="10" />
                      <span className="text-[10px] text-gray-400">일</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 청구 설정 (blue card) */}
          <div className="p-3 px-3.5 bg-hm-blue-bg rounded-[10px] border border-blue-200 mb-3.5">
            <div className="text-xs font-[800] text-hm-blue-dark mb-2.5">청구 설정</div>
            <div className="flex flex-wrap gap-2.5">
              {isRentalOrCommercial && !isMeteredCommercial && !(data.isShortTermRental && !data.isLongTermRental && !data.isCommercial) && (
                <div className="flex-[1_1_140px]">
                  <FLabel label="임대료 선후불" />
                  <FSelect readOnly={ro} data={{ ...data, rentBillingType: data.rentBillingType || "prepaid" }} field="rentBillingType" onChange={onChange} options={[
                    { value: "prepaid", label: "선불" },
                    { value: "postpaid", label: "후불" },
                  ]} />
                </div>
              )}
              {isRentalOrCommercial && !isMeteredCommercial && (
                <div className="flex-[1_1_140px]">
                  <FLabel label="관리비 선후불" />
                  <FSelect readOnly={ro} data={{ ...data, managementFeeBillingType: data.managementFeeBillingType || (data.isCommercial && !data.isShortTermRental && !data.isLongTermRental ? "" : "prepaid") }} field="managementFeeBillingType" onChange={onChange} options={[
                    { value: "prepaid", label: "선불" },
                    { value: "postpaid", label: "후불" },
                  ]} />
                </div>
              )}
              {data.isCorporateFacility && (
                <div className="flex-[1_1_140px]">
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
            <div className="p-2.5 px-3 bg-hm-blue-bg rounded-lg border border-blue-200 mt-3.5">
              <div className="text-[11px] font-[800] text-hm-blue-dark mb-2">결제받을 하우스맨 계좌</div>
              <FInput readOnly={ro} data={data} field="housemanBillingAccount" onChange={onChange} placeholder="하나은행 225-910048-15704 박종호(하우스맨)" />
            </div>
          )}

          {/* 임차인 청구 계좌 설정 */}
          {notCorporateOnly && (
          <div className="border-t border-hm-border pt-3.5 mt-4">
            <div className="text-xs font-bold text-hm-blue-dark mb-3">💳 임차인 청구 계좌 설정</div>

            {/* 하우스맨 계좌 */}
            <div className="p-2.5 px-3 bg-hm-blue-bg rounded-lg border border-blue-200 mb-2.5">
              <div className="text-[11px] font-[800] text-hm-blue-dark mb-2">하우스맨 계좌</div>
              <div className="grid grid-cols-1 gap-1.5">
                <FInput readOnly={ro} data={data} field="housemanBillingAccount" onChange={onChange} placeholder="하나은행 225-910048-15704 박종호(하우스맨)" />
              </div>
            </div>

            {/* 건물주 청구 계좌 1~3 */}
            {data.tenantAccountType !== "short_houseman_only" && (
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                {[1, 2, 3].map(n => {
                  const hasValue = data[`billingAccount${n}`];
                  if (n > 1 && !hasValue) return null;
                  return (
                    <div key={n} className="p-2.5 px-3 bg-[#F0F4FF] rounded-lg border border-blue-200">
                      <div className="text-[11px] font-[800] text-hm-blue-dark mb-2">{ownerLabel} 청구계좌 {n}</div>
                      <div className="grid grid-cols-[1fr_2fr_1fr] gap-1.5">
                        <div><FLabel label="은행" /><FInput readOnly={ro} data={data} field={`billingAccount${n}Bank`} onChange={onChange} placeholder="국민은행" /></div>
                        <div><FLabel label="계좌번호" /><FInput readOnly={ro} data={data} field={`billingAccount${n}`} onChange={onChange} placeholder="110-234-567890" /></div>
                        <div><FLabel label="예금주" /><FInput readOnly={ro} data={data} field={`billingAccount${n}Holder`} onChange={onChange} placeholder="홍길동" /></div>
                      </div>
                    </div>
                  );
                })}
                {!ro && !data.billingAccount2 && (
                  <button onClick={() => onChange({ billingAccount2: " " })} className="p-2.5 rounded-lg border-[1.5px] border-dashed border-blue-200 bg-hm-bg-hover text-hm-blue-dark text-[11px] font-semibold cursor-pointer font-[inherit] hover:bg-blue-50 transition-colors">
                    {`+ ${ownerLabel} 계좌 2 추가`}
                  </button>
                )}
                {!ro && data.billingAccount2 && !data.billingAccount3 && (
                  <button onClick={() => onChange({ billingAccount3: " " })} className="p-2.5 rounded-lg border-[1.5px] border-dashed border-blue-200 bg-hm-bg-hover text-hm-blue-dark text-[11px] font-semibold cursor-pointer font-[inherit] hover:bg-blue-50 transition-colors">
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
                { field: "rentAccountTarget", label: "💰 월세 (임대료)", color: "var(--color-hm-danger)", bg: "var(--color-hm-danger-bg)", border: "var(--color-hm-danger-border)", desc: "임차인이 납부하는 월 임대료" },
                { field: "managementFeeAccountTarget", label: "🏠 관리비", color: "var(--color-hm-blue-dark)", bg: "var(--color-hm-blue-bg)", border: "#BFDBFE", desc: "월 관리비 (고정분)" },
                { field: "utilityAccountTarget", label: "💧 공과금 (수도/인터넷)", color: "var(--color-hm-success)", bg: "var(--color-hm-success-bg)", border: "var(--color-hm-success-border)", desc: "수도, 인터넷, 케이블 등" },
                { field: "electricGasAccountTarget", label: "⚡ 전기+가스", color: "var(--color-hm-warning)", bg: "var(--color-hm-warning-bg)", border: "var(--color-hm-warning-border)", desc: "전기, 가스 (공과금과 별도)" },
              ];

              const shortItems = allItems;
              const longTermItems = allItems.filter(i => i.field !== "electricGasAccountTarget").map(i =>
                i.field === "depositAccountTarget" ? { ...i, label: "🔑 보증금", desc: "계약 시 1회 납부. 만기/퇴실 시 반환" } : i
              );
              const commercialItems = allItems.filter(i => i.field !== "electricGasAccountTarget").map(i =>
                i.field === "depositAccountTarget" ? { ...i, label: "🔑 보증금", desc: "계약 시 1회 납부. 만기/퇴실 시 반환" }
                : i.field === "utilityAccountTarget" ? { ...i, label: "💧 변동관리비", desc: "항목별 별도 청구 (엘리베이터/소방/소독/전기안전 등)" }
                : i
              );
              const itemsByType = { "단기": shortItems, "일반임대": longTermItems, "근생": commercialItems, "관리사무소": [allItems[2]] };
              const typeColors = { "단기": "var(--color-hm-blue-dark)", "일반임대": "var(--color-hm-success)", "근생": "var(--color-hm-warning)", "관리사무소": "#7C3AED" };
              const typeBgs = { "단기": "var(--color-hm-blue-bg)", "일반임대": "var(--color-hm-success-bg)", "근생": "var(--color-hm-warning-bg)", "관리사무소": "#F5F3FF" };

              const billingTypes = derivedTypes.filter(t => itemsByType[t]);
              const isMultiType = billingTypes.length > 1;

              return billingTypes.map(bType => {
                const suffix = isMultiType ? `_${bType}` : "";
                const items = (itemsByType[bType] || allItems).map(item => ({ ...item, field: `${item.field}${suffix}` }));

                return (
                  <div key={bType} className={isMultiType ? "mb-4 p-3.5 rounded-[10px]" : "mb-4"} style={{ background: isMultiType ? typeBgs[bType] : "transparent", border: isMultiType ? `1.5px solid ${typeColors[bType]}30` : "none" }}>
                    <div className="text-[11px] font-[800] mb-2 pb-1.5" style={{ color: isMultiType ? typeColors[bType] : "#191F28", borderBottom: `1.5px solid ${isMultiType ? typeColors[bType] + "40" : "var(--color-hm-border)"}` }}>
                      📦 {isMultiType ? `${bType} 호실` : ""} 항목별 입금 계좌 지정
                    </div>
                    {!isMultiType && <div className="text-[9px] text-[#8B95A1] mb-2.5">각 항목이 어느 계좌로 입금되는지 지정하세요. 레고 블럭처럼 자유롭게 조합.</div>}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${items.length <= 4 ? items.length : 3}, 1fr)`, gap: 10 }} className={isMultiType ? "" : "mb-3.5"}>
                      {items.map(item => {
                        const val = data[item.field] || "";
                        return (
                          <div key={item.field} className="p-3 px-3.5 rounded-[10px] transition-all duration-150" style={{ background: val ? item.bg : "var(--color-hm-bg-hover)", border: `1.5px solid ${val ? item.border : "#E5E8EB"}` }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-xs font-bold" style={{ color: item.color }}>{item.label}</span>
                              {val && <span className="text-[9px] font-semibold" style={{ color: item.color }}>✓</span>}
                            </div>
                            <select value={val} onChange={e => onChange({ [item.field]: e.target.value || (editMode ? "" : null) })} disabled={ro}
                              className={`${inputClassName} py-[7px] px-2.5 text-xs ${editMode ? 'cursor-pointer bg-white' : 'cursor-default bg-hm-bg-slate'} ${val ? 'font-semibold' : 'font-normal'}`}>
                              <option value="">-- 계좌 선택 --</option>
                              <option value="no_billing">🚫 청구안함</option>
                              {acctOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <div className="text-[9px] text-[#8B95A1] mt-[3px]">{item.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {/* 예치금 관리 예치금액 */}
            {data.depositAccountTarget === "houseman" && (
              <div className="p-2.5 px-3 bg-violet-50 rounded-lg border border-violet-200">
                <div className="text-[11px] font-[800] text-violet-600 mb-2">🔑 예치금 관리 설정</div>
                <div className="text-[9px] text-[#8B95A1] mb-2">예치금을 하우스맨 계좌로 받는 경우, {ownerLabel}에게 관리 보증금을 예치합니다.</div>
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
    <Card className="mb-4">
      <SectionHeader title="서류" subtitle="첨부서류" icon="📎" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          <div className="grid grid-cols-2 gap-2.5">
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
   ContractSpecialTermsSection
   ════════════════════════════════════════════════════════════════ */
export function ContractSpecialTermsSection({ data, onChange, editMode = true, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { anyTypeChecked, corporateOnly } = useVisibility(data);
  if (!anyTypeChecked || corporateOnly) return null;
  const ro = !editMode;

  const types = [
    { field: "contractSpecialTermsShortTerm", label: "🏠 단기임대 특약사항", show: !!data.isShortTermRental, color: "var(--color-hm-blue-dark)", bg: "var(--color-hm-blue-bg)", border: "#BFDBFE" },
    { field: "contractSpecialTermsLongTerm", label: "🏢 일반임대 특약사항", show: !!data.isLongTermRental, color: "var(--color-hm-success)", bg: "var(--color-hm-success-bg)", border: "var(--color-hm-success-border)" },
    { field: "contractSpecialTermsCommercial", label: "🏪 근생 특약사항", show: !!data.isCommercial, color: "var(--color-hm-warning)", bg: "var(--color-hm-warning-bg)", border: "var(--color-hm-warning-border)" },
  ].filter(t => t.show);

  if (types.length === 0) return null;

  return (
    <Card className="mb-4">
      <SectionHeader title="계약서 특약사항" subtitle="건물유형별 특약 — 호실 계약서에 자동 삽입" icon="📝" isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div>
          <div className="text-[10px] text-[#8B95A1] mb-3">건물유형별로 특약사항을 작성하면 해당 유형 호실의 계약서에 자동으로 삽입됩니다. 호실에서는 수정할 수 없습니다.</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${types.length}, 1fr)`, gap: 12 }}>
            {types.map(t => (
              <div key={t.field} className="p-3 px-3.5 rounded-[10px] flex flex-col" style={{ background: t.bg, border: `1.5px solid ${t.border}` }}>
                <div className="text-xs font-bold mb-2" style={{ color: t.color }}>{t.label}</div>
                <FTextarea readOnly={ro} data={data} field={t.field} onChange={onChange} placeholder={`${t.label.slice(2)} 내용을 입력하세요...`} rows={8} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
