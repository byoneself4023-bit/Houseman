import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { calendarEvents as defaultEvents, buildingFloors } from '@/data';
import { persistUpdate, persistDelete } from './calendarApi';
import { Card, SectionTitle } from '@/components';
import { MSG_TEMPLATES, fillBuildingContractMsg, STATIC_BUILDING_NAMES } from './constants';

// Sub-components
import { FilterTabs, MonthNavigation } from './components/CalendarHeader';
import { CalendarGrid } from './components/CalendarGrid';
import { EventListView } from './components/EventListView';
import { ContractStatusPanel } from './components/ContractStatusPanel';
import { MoveOutStatusPanel } from './components/MoveOutStatusPanel';
import { ContractEventForm } from './components/ContractEventForm';
import { MoveOutEventForm } from './components/MoveOutEventForm';
import { VacationEventForm } from './components/VacationEventForm';
import { EventDetailModal } from './components/EventDetailModal';
import { SendMessageModal } from './components/SendMessageModal';
import { SendLinkModal } from './components/SendLinkModal';
import { PhotoModal, CheckPhotoModal, ZoomPhotoModal, CompareModal } from './components/PhotoModals';
import { ContractReportModal, MoveOutOwnerReportModal, BreakReportModal, MoveOutMsgModal } from './components/OwnerReportModals';
import { DirectInputModal } from './components/DirectInputModal';
import { ExternalCheckModal } from './components/ExternalCheckModal';

// 현재 단계 깜빡임 애니메이션 (side-effect: injects CSS keyframes)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const blinkStyle = document.getElementById("hm-blink-style") || (() => {
  const s = document.createElement("style");
  s.id = "hm-blink-style";
  s.textContent = `@keyframes hm-blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } } @keyframes hm-wobble { 0%,100% { transform:rotate(0deg); } 25% { transform:rotate(10deg); } 50% { transform:rotate(-5deg); } 75% { transform:rotate(7deg); } }`;
  document.head.appendChild(s);
  return s;
})();

export const CalendarPage = ({ events: propEvents, setEvents, currentStaff, activeVacancies = [], setActiveVacancies, activeTenants = [], setActiveTenants, pastTenantsData = {}, setPastTenantsData, setPage, setPendingMoveout, setPendingContract, buildingData = {} }: Record<string, any>) => {
  const BUILDING_NAMES = useMemo(() => {
    const set = new Set(STATIC_BUILDING_NAMES);
    Object.keys(buildingFloors).forEach(n => set.add(n));
    activeTenants.forEach((t: any) => t.building && set.add(t.building));
    activeVacancies.forEach((v: any) => v.building && set.add(v.building));
    return [...set].sort();
  }, [activeTenants, activeVacancies]);

  const calendarEvents = propEvents || defaultEvents;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState("전체");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("계약");
  const [formDate, setFormDate] = useState("");
  const [formBuilding, setFormBuilding] = useState("");
  const [formBuildingSearch, setFormBuildingSearch] = useState("");
  const [showBuildingSuggestions, setShowBuildingSuggestions] = useState(false);
  const [formRoom, setFormRoom] = useState("");
  const [formName, setFormName] = useState("");
  const [selectedVacancy, setSelectedVacancy] = useState<number | null>(null);
  const [vacancyEdits, setVacancyEdits] = useState<Record<string, any>>({});
  const [photoModalTenant, setPhotoModalTenant] = useState<any>(null);
  const [checkPhotoModalTenant, setCheckPhotoModalTenant] = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [moveOutMsgModal, setMoveOutMsgModal] = useState<any>(null);
  const [externalCheckModal, setExternalCheckModal] = useState<any>(null);
  const [directInputModal, setDirectInputModal] = useState<any>(null);
  const [sendLinkModal, setSendLinkModal] = useState<any>(null);

  const [zoomPhoto, setZoomPhoto] = useState<any>(null);
  const [dragEventIndex, setDragEventIndex] = useState<any>(null);
  const [dropTargetDay, setDropTargetDay] = useState<number | null>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [breakReport, setBreakReport] = useState<any>(null);
  const [contractReport, setContractReport] = useState<any>(null);
  const [moveOutOwnerReport, setMoveOutOwnerReport] = useState<any>(null);

  const openEditEvent = (evt: Record<string, any>) => {
    const idx = calendarEvents.indexOf(evt);
    if (idx < 0 || !setEvents) return;
    setEditEvent({ idx, evt, edits: { ...evt } });
  };
  const saveEditEvent = () => {
    if (!editEvent || !setEvents) return;
    const { idx, evt, edits } = editEvent;
    persistUpdate(evt.supabaseId, edits);
    setEvents((prev: any[]) => prev.map((e: any, i: number) => i === idx ? { ...e, ...edits } : e));
    setEditEvent(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  // 자동 정리: 완료된 계약 삭제 + 임차인 없는 퇴실 삭제
  useEffect(() => {
    if (!setEvents || activeTenants.length === 0) return;
    const toRemove = calendarEvents.filter((ev: any) => {
      if (ev.type === "계약" && ev.building && ev.room) {
        // 기존 임차인과 이름이 같으면 완료된 계약 → 삭제. 이름이 다르면 새 계약 → 유지
        return activeTenants.some((t: any) => t.building === ev.building && String(t.room) === String(ev.room) && t.name === ev.name && ev.name);
      }
      if (ev.type === "퇴실" && ev.building && ev.room) {
        // 퇴실체크 완료된 건은 자동 삭제 불가
        if (ev.externalCheckDone) return false;
        const hk = `${ev.building}_${ev.room}`;
        const pastRecords = pastTenantsData[hk] || [];
        const hasTenant = activeTenants.some((t: any) => t.building === ev.building && String(t.room) === String(ev.room));
        if (hasTenant) return false;
        if (pastRecords.length === 0) return true;
        const lastRecord = pastRecords[pastRecords.length - 1];
        const hasCheckPhotos = (lastRecord.moveOutCheckPhotos || []).some((p: any) => p && p.startsWith("data:image/"));
        return hasCheckPhotos;
      }
      return false;
    });
    if (toRemove.length > 0) {
      toRemove.forEach((ev: any) => persistDelete(ev.supabaseId));
      const removeSet = new Set(toRemove);
      setEvents((prev: any[]) => prev.filter((ev: any) => !removeSet.has(ev)));
    }
  }, [activeTenants]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEvents = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let evts = calendarEvents.filter((e: any) => e.date === dateStr);
    if (filter !== "전체") evts = evts.filter((e: any) => e.type === filter);
    return evts;
  };

  const monthEvents = useMemo(() => calendarEvents.filter((e: any) => e.date.startsWith(monthStr)), [calendarEvents, monthStr]);
  const filteredMonthEvents = useMemo(() => filter === "전체" ? monthEvents : monthEvents.filter((e: any) => e.type === filter), [monthEvents, filter]);

  const selectedEvents = selectedDay ? getEvents(selectedDay) : [];

  const [pendingSendEvt, setPendingSendEvt] = useState<any>(null);
  const [sendMsg, setSendMsg] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("기본");

  const buildContractMsg = (evt: Record<string, any>, template: string) => {
    if (template === "건물 계약문자") {
      const bldgMsg = (buildingData[evt.building] || {}).contractMsg || "";
      if (bldgMsg) return fillBuildingContractMsg(bldgMsg, evt) || MSG_TEMPLATES["기본"](evt);
      return MSG_TEMPLATES["기본"](evt);
    }
    const fn = MSG_TEMPLATES[template || "기본"];
    return fn ? fn(evt) : MSG_TEMPLATES["기본"](evt);
  };

  const getTemplateKeys = (evt: Record<string, any>) => {
    const keys = [...Object.keys(MSG_TEMPLATES)];
    const bldgMsg = (buildingData[evt?.building] || {}).contractMsg;
    if (bldgMsg) keys.unshift("건물 계약문자");
    return keys;
  };

  const openSendModal = (evt: Record<string, any>) => {
    setPendingSendEvt(evt);
    const bldgMsg = (buildingData[evt.building] || {}).contractMsg;
    const defaultTpl = bldgMsg ? "건물 계약문자" : "기본";
    setSelectedTemplate(defaultTpl);
    setSendMsg(buildContractMsg(evt, defaultTpl));
  };

  const handleSendSMS = (evt: Record<string, any>, msg: string) => {
    const text = msg || buildContractMsg(evt, "기본");
    const phone = (evt.brokerPhone || "").replace(/-/g, "");
    window.open(`sms:${phone}?body=${encodeURIComponent(text)}`);
    setPendingSendEvt(null);
  };

  const handleSendKakao = (evt: Record<string, any>, msg: string) => {
    const text = msg || buildContractMsg(evt, "기본");
    navigator.clipboard.writeText(text).then(() => {
      alert("계약정보가 클립보드에 복사되었습니다.\n카카오톡에서 붙여넣기(Ctrl+V) 하세요.");
    }).catch(() => {
      prompt("아래 내용을 복사하세요:", text);
    });
    setPendingSendEvt(null);
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

  return (
    <div>
      <SectionTitle sub="입퇴실 일정 & 직원 휴무 관리">📅 입퇴실일정</SectionTitle>

      {/* 계약현황 */}
      <ContractStatusPanel
        calendarEvents={calendarEvents}
        activeTenants={activeTenants}
        activeVacancies={activeVacancies}
        buildingData={buildingData}
        setEvents={setEvents}
        setActiveVacancies={setActiveVacancies}
        setPendingContract={setPendingContract}
        setPage={setPage}
        openEditEvent={openEditEvent}
        setContractReport={setContractReport}
        setBreakReport={setBreakReport}
        openSendModal={openSendModal}
      />

      {/* 퇴실현황 */}
      <MoveOutStatusPanel
        calendarEvents={calendarEvents}
        activeTenants={activeTenants}
        activeVacancies={activeVacancies}
        pastTenantsData={pastTenantsData}
        buildingData={buildingData}
        setEvents={setEvents}
        setActiveVacancies={setActiveVacancies}
        setPage={setPage}
        setPendingMoveout={setPendingMoveout}
        setPhotoModalTenant={setPhotoModalTenant}
        setCheckPhotoModalTenant={setCheckPhotoModalTenant}
        setCompareData={setCompareData}
        setMoveOutMsgModal={setMoveOutMsgModal}
        setMoveOutOwnerReport={setMoveOutOwnerReport}
        setExternalCheckModal={setExternalCheckModal}
        setDirectInputModal={setDirectInputModal}
        setSendLinkModal={setSendLinkModal}
        openEditEvent={openEditEvent}
      />

      {/* Filter Tabs */}
      <FilterTabs filter={filter} setFilter={setFilter} />

      {/* Event Forms */}
      {setEvents && (
        <>
          <ContractEventForm
            showForm={showForm} formType={formType}
            formDate={formDate} setFormDate={setFormDate}
            activeVacancies={activeVacancies}
            selectedVacancy={selectedVacancy} setSelectedVacancy={setSelectedVacancy}
            vacancyEdits={vacancyEdits} setVacancyEdits={setVacancyEdits}
            setEvents={setEvents} setActiveVacancies={setActiveVacancies}
            setShowForm={setShowForm} currentStaff={currentStaff}
            openSendModal={openSendModal}
          />
          <MoveOutEventForm
            showForm={showForm} formType={formType}
            formDate={formDate} setFormDate={setFormDate}
            formBuilding={formBuilding} setFormBuilding={setFormBuilding}
            formBuildingSearch={formBuildingSearch} setFormBuildingSearch={setFormBuildingSearch}
            showBuildingSuggestions={showBuildingSuggestions} setShowBuildingSuggestions={setShowBuildingSuggestions}
            formRoom={formRoom} setFormRoom={setFormRoom}
            BUILDING_NAMES={BUILDING_NAMES}
            activeTenants={activeTenants} activeVacancies={activeVacancies}
            setEvents={setEvents} setShowForm={setShowForm} currentStaff={currentStaff}
          />
          <VacationEventForm
            showForm={showForm} formType={formType}
            formDate={formDate} setFormDate={setFormDate}
            formName={formName} setFormName={setFormName}
            setEvents={setEvents} setShowForm={setShowForm} currentStaff={currentStaff}
          />
        </>
      )}

      {/* Send Message Modal */}
      <SendMessageModal
        pendingSendEvt={pendingSendEvt} setPendingSendEvt={setPendingSendEvt}
        sendMsg={sendMsg} setSendMsg={setSendMsg}
        selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}
        buildContractMsg={buildContractMsg} getTemplateKeys={getTemplateKeys}
        handleSendSMS={handleSendSMS} handleSendKakao={handleSendKakao}
      />

      {/* Calendar Grid + Side Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <MonthNavigation
            year={year} month={month} prevMonth={prevMonth} nextMonth={nextMonth}
            showForm={showForm} formType={formType} setShowForm={setShowForm} setFormType={setFormType}
            setSelectedVacancy={setSelectedVacancy} setVacancyEdits={setVacancyEdits}
            setFormDate={setFormDate} setFormBuilding={setFormBuilding}
            setFormRoom={setFormRoom} setFormName={setFormName}
            selectedDay={selectedDay} setEvents={setEvents}
          />
          <CalendarGrid
            days={days} year={year} month={month} firstDay={firstDay}
            selectedDay={selectedDay} setSelectedDay={setSelectedDay}
            getEvents={getEvents} isToday={isToday}
            setEvents={setEvents} openEditEvent={openEditEvent}
            dropTargetDay={dropTargetDay} setDropTargetDay={setDropTargetDay}
            setDragEventIndex={setDragEventIndex}
          />
        </Card>

        <EventListView
          selectedDay={selectedDay} month={month}
          selectedEvents={selectedEvents}
          filteredMonthEvents={filteredMonthEvents}
          setSelectedDay={setSelectedDay}
          setEvents={setEvents} calendarEvents={calendarEvents}
          openEditEvent={openEditEvent} openSendModal={openSendModal}
        />
      </div>

      {/* All Modals */}
      <PhotoModal
        photoModalTenant={photoModalTenant} setPhotoModalTenant={setPhotoModalTenant}
        setActiveTenants={setActiveTenants} setPastTenantsData={setPastTenantsData}
        setZoomPhoto={setZoomPhoto}
      />
      <CheckPhotoModal
        checkPhotoModalTenant={checkPhotoModalTenant} setCheckPhotoModalTenant={setCheckPhotoModalTenant}
        setActiveTenants={setActiveTenants} setPastTenantsData={setPastTenantsData}
        setZoomPhoto={setZoomPhoto}
      />
      <EventDetailModal
        editEvent={editEvent} setEditEvent={setEditEvent}
        setEvents={setEvents} saveEditEvent={saveEditEvent}
      />
      <MoveOutMsgModal
        moveOutMsgModal={moveOutMsgModal} setMoveOutMsgModal={setMoveOutMsgModal}
        calendarEvents={calendarEvents} setEvents={setEvents}
      />
      <CompareModal
        compareData={compareData} setCompareData={setCompareData}
      />
      <ZoomPhotoModal
        zoomPhoto={zoomPhoto} setZoomPhoto={setZoomPhoto}
      />
      <ContractReportModal
        contractReport={contractReport} setContractReport={setContractReport}
        setEvents={setEvents}
      />
      <MoveOutOwnerReportModal
        moveOutOwnerReport={moveOutOwnerReport} setMoveOutOwnerReport={setMoveOutOwnerReport}
        setEvents={setEvents}
      />
      <BreakReportModal
        breakReport={breakReport} setBreakReport={setBreakReport}
      />
      <SendLinkModal
        sendLinkModal={sendLinkModal} setSendLinkModal={setSendLinkModal}
      />
      <DirectInputModal
        directInputModal={directInputModal} setDirectInputModal={setDirectInputModal}
        setEvents={setEvents}
      />
      <ExternalCheckModal
        externalCheckModal={externalCheckModal} setExternalCheckModal={setExternalCheckModal}
        setEvents={setEvents} setActiveTenants={setActiveTenants} setZoomPhoto={setZoomPhoto}
      />
    </div>
  );
};
