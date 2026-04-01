// @ts-nocheck
import { useState, useMemo } from 'react';
import { useIsMobile } from '../utils';
import { Card, SectionTitle } from '../components';
import { inputClassName } from '../components/Field';
import { useLocalStorage } from '../utils/useLocalStorage';

export const BrokerPage = ({ calendarEvts = [] }: { calendarEvts?: any[] }) => {
  const isMobile = useIsMobile();
  const [brokerList, setBrokerList] = useLocalStorage("hm_brokerList", []);
  const [showAdd, setShowAdd] = useState(false);
  const [newBroker, setNewBroker] = useState({ name: "", phone: "", area: "" });
  const [editingId, setEditingId] = useState(null);
  const [editBroker, setEditBroker] = useState(null);

  // 기존 계약에서 부동산 정보 수집 (중복 제거)
  const collectedBrokers = useMemo(() => {
    try {
      const evts = calendarEvts || [];
      const map = {};
      for (const ev of evts) {
        if (ev.type === "계약" && ev.brokerPhone) {
          const phone = ev.brokerPhone.trim();
          if (!map[phone]) {
            map[phone] = { name: ev.broker || "", phone, buildings: new Set() };
          }
          if (ev.building) map[phone].buildings.add(ev.building);
        }
      }
      return Object.values(map).map(b => ({ ...b, buildings: [...b.buildings] }));
    } catch { return []; }
  }, [calendarEvts]);

  const normalize = (p) => (p || "").replace(/[-\s()]/g, "");
  const importBroker = (b) => {
    if (brokerList.some(x => normalize(x.phone) === normalize(b.phone))) return;
    setBrokerList(prev => [...prev, { id: Date.now(), name: b.name, phone: b.phone, area: b.buildings.join(", ") }]);
  };

  const addBroker = () => {
    if (!newBroker.name.trim() || !newBroker.phone.trim()) return;
    setBrokerList(prev => [...prev, { id: Date.now(), ...newBroker }]);
    setNewBroker({ name: "", phone: "", area: "" });
    setShowAdd(false);
  };
  const removeBroker = (id) => setBrokerList(prev => prev.filter(b => b.id !== id));
  const startEdit = (b) => { setEditingId(b.id); setEditBroker({ name: b.name, phone: b.phone, area: b.area || "" }); };
  const saveEdit = () => {
    if (!editBroker.name.trim()) return;
    setBrokerList(prev => prev.map(b => b.id === editingId ? { ...b, ...editBroker } : b));
    setEditingId(null); setEditBroker(null);
  };

  return (
    <div>
      <SectionTitle sub="계약 부동산을 관리합니다">🏠 부동산 관리</SectionTitle>

      {/* 기존 계약에서 수집된 부동산 */}
      {collectedBrokers.length > 0 && (
        <div className="mb-5">
          <div className="text-[13px] font-bold text-gray-500 mb-2">계약 이력에서 수집 ({collectedBrokers.length}개)</div>
          <div className="flex flex-col gap-1.5">
            {collectedBrokers.map((b, i) => {
              const alreadyAdded = brokerList.some(x => normalize(x.phone) === normalize(b.phone));
              return (
                <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border ${alreadyAdded ? 'bg-green-50 border-green-200' : 'bg-hm-bg-hover border-gray-200'}`}>
                  <div>
                    <span className="text-sm font-bold text-gray-900">{b.name || "미입력"}</span>
                    <span className="text-xs text-gray-500 ml-2">{b.phone}</span>
                    {b.buildings.length > 0 && <span className="text-[11px] text-gray-400 ml-2">{b.buildings.join(", ")}</span>}
                  </div>
                  {alreadyAdded
                    ? <span className="text-[11px] font-bold text-green-600">등록됨</span>
                    : <button onClick={() => importBroker(b)} className="px-3.5 py-1.5 rounded-md border border-hm-blue bg-hm-blue-bg text-hm-blue-dark text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">등록</button>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 등록된 부동산 목록 */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-[13px] font-bold">등록 부동산 ({brokerList.length}개)</div>
        <button onClick={() => setShowAdd(!showAdd)}
          className={`px-5 py-2 rounded-lg font-bold text-xs cursor-pointer font-[inherit] transition-colors ${showAdd ? 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub' : 'border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark'}`}>
          {showAdd ? "취소" : "➕ 부동산 추가"}
        </button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 16, border: "2px solid var(--color-hm-blue)" }}>
          <div className="text-xs font-extrabold text-hm-blue-dark mb-3">새 부동산 등록</div>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-3`}>
            <div>
              <div className="text-[10px] text-hm-text-muted mb-[3px]">부동산명 *</div>
              <input value={newBroker.name} onChange={e => setNewBroker(p => ({ ...p, name: e.target.value }))} placeholder="OO공인중개사" className={`${inputClassName} py-2`} />
            </div>
            <div>
              <div className="text-[10px] text-hm-text-muted mb-[3px]">연락처 *</div>
              <input value={newBroker.phone} onChange={e => setNewBroker(p => ({ ...p, phone: e.target.value }))} placeholder="02-0000-0000" className={`${inputClassName} py-2`} />
            </div>
            <div>
              <div className="text-[10px] text-hm-text-muted mb-[3px]">담당 지역/건물</div>
              <input value={newBroker.area} onChange={e => setNewBroker(p => ({ ...p, area: e.target.value }))} placeholder="관악구" className={`${inputClassName} py-2`} />
            </div>
          </div>
          <button onClick={addBroker} className={`px-7 py-2.5 rounded-lg border-none text-white font-extrabold text-[13px] font-[inherit] ${newBroker.name && newBroker.phone ? 'bg-hm-blue-dark cursor-pointer hover:bg-blue-700' : 'bg-gray-300 cursor-default'} transition-colors`}>등록</button>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {brokerList.map(b => (
          <Card key={b.id} className="!py-3.5 !px-[18px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full bg-[#EC489915] border-2 border-pink-500 flex items-center justify-center text-lg">🏠</div>
                <div>
                  <div className="text-[15px] font-extrabold text-hm-text">{b.name}</div>
                  <div className="text-xs text-hm-text-muted mt-0.5">
                    <a href={`tel:${b.phone}`} className="text-hm-blue no-underline hover:underline">{b.phone}</a>
                    {b.area && <span className="ml-2 text-gray-400">{b.area}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {editingId !== b.id && <>
                  <button onClick={() => startEdit(b)} className="px-3.5 py-1.5 rounded-md border border-blue-200 bg-hm-blue-bg text-hm-blue-dark text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">수정</button>
                  <button onClick={() => removeBroker(b.id)} className="px-3.5 py-1.5 rounded-md border border-hm-danger-border bg-hm-danger-bg text-hm-danger text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">삭제</button>
                </>}
              </div>
            </div>
            {editingId === b.id && editBroker && (
              <div className="mt-3 pt-3 border-t-2 border-pink-500">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-3`}>
                  <div>
                    <div className="text-[10px] text-hm-text-muted mb-[3px]">부동산명 *</div>
                    <input value={editBroker.name} onChange={e => setEditBroker(p => ({ ...p, name: e.target.value }))} className={`${inputClassName} py-2`} />
                  </div>
                  <div>
                    <div className="text-[10px] text-hm-text-muted mb-[3px]">연락처</div>
                    <input value={editBroker.phone} onChange={e => setEditBroker(p => ({ ...p, phone: e.target.value }))} className={`${inputClassName} py-2`} />
                  </div>
                  <div>
                    <div className="text-[10px] text-hm-text-muted mb-[3px]">담당 지역</div>
                    <input value={editBroker.area} onChange={e => setEditBroker(p => ({ ...p, area: e.target.value }))} className={`${inputClassName} py-2`} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-6 py-2 rounded-lg border-none bg-pink-500 text-white font-extrabold text-xs cursor-pointer font-[inherit] hover:bg-pink-600 transition-colors">저장</button>
                  <button onClick={() => { setEditingId(null); setEditBroker(null); }} className="px-6 py-2 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {brokerList.length === 0 && (
          <div className="py-8 text-center text-gray-400 text-[13px]">등록된 부동산이 없습니다. 위에서 추가하거나 계약 이력에서 가져오세요.</div>
        )}
      </div>
    </div>
  );
};
