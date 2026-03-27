import { useState, useMemo } from 'react';
import { useIsMobile } from '@/utils';
import { Card, SectionTitle } from '@/components';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { Input } from '@/components/ui/input';

interface Broker {
  id: number;
  name: string;
  phone: string;
  area: string;
}

interface CollectedBroker {
  name: string;
  phone: string;
  buildings: string[];
}

export const BrokerPage = () => {
  const isMobile = useIsMobile();
  const [brokerList, setBrokerList] = useLocalStorage<Broker[]>("hm_brokerList", []);
  const [showAdd, setShowAdd] = useState(false);
  const [newBroker, setNewBroker] = useState({ name: "", phone: "", area: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBroker, setEditBroker] = useState<{ name: string; phone: string; area: string } | null>(null);

  // 기존 계약에서 부동산 정보 수집 (중복 제거)
  const collectedBrokers = useMemo<CollectedBroker[]>(() => {
    try {
      const evts = JSON.parse(localStorage.getItem("hm_calendarEvts") || "[]");
      const map: Record<string, { name: string; phone: string; buildings: Set<string> }> = {};
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
  }, []);

  const normalize = (p: string) => (p || "").replace(/[-\s()]/g, "");
  const importBroker = (b: CollectedBroker) => {
    if (brokerList.some(x => normalize(x.phone) === normalize(b.phone))) return;
    setBrokerList(prev => [...prev, { id: Date.now(), name: b.name, phone: b.phone, area: b.buildings.join(", ") }]);
  };

  const addBroker = () => {
    if (!newBroker.name.trim() || !newBroker.phone.trim()) return;
    setBrokerList(prev => [...prev, { id: Date.now(), ...newBroker }]);
    setNewBroker({ name: "", phone: "", area: "" });
    setShowAdd(false);
  };
  const removeBroker = (id: number) => setBrokerList(prev => prev.filter(b => b.id !== id));
  const startEdit = (b: Broker) => { setEditingId(b.id); setEditBroker({ name: b.name, phone: b.phone, area: b.area || "" }); };
  const saveEdit = () => {
    if (!editBroker || !editBroker.name.trim()) return;
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
                <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border ${
                  alreadyAdded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div>
                    <span className="text-sm font-bold text-[#111]">{b.name || "미입력"}</span>
                    <span className="text-xs text-gray-500 ml-2">{b.phone}</span>
                    {b.buildings.length > 0 && <span className="text-[11px] text-gray-400 ml-2">{b.buildings.join(", ")}</span>}
                  </div>
                  {alreadyAdded
                    ? <span className="text-[11px] font-bold text-green-600">등록됨</span>
                    : <button onClick={() => importBroker(b)} className="px-3.5 py-1 rounded-md border border-blue-500 bg-blue-50 text-blue-600 text-[11px] font-bold cursor-pointer">등록</button>
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
          className={`px-5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
            showAdd
              ? 'border-[1.5px] border-[#E0E3E9] bg-white text-[#5F6577]'
              : 'border-[1.5px] border-blue-500 bg-blue-50 text-blue-600'
          }`}>
          {showAdd ? "취소" : "➕ 부동산 추가"}
        </button>
      </div>

      {showAdd && (
        <Card className="mb-4 border-2 border-blue-500">
          <div className="text-xs font-extrabold text-blue-600 mb-3">새 부동산 등록</div>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-3`}>
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">부동산명 *</div>
              <Input value={newBroker.name} onChange={e => setNewBroker(p => ({ ...p, name: e.target.value }))} placeholder="OO공인중개사" className="h-9" />
            </div>
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">연락처 *</div>
              <Input value={newBroker.phone} onChange={e => setNewBroker(p => ({ ...p, phone: e.target.value }))} placeholder="02-0000-0000" className="h-9" />
            </div>
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">담당 지역/건물</div>
              <Input value={newBroker.area} onChange={e => setNewBroker(p => ({ ...p, area: e.target.value }))} placeholder="관악구" className="h-9" />
            </div>
          </div>
          <button onClick={addBroker}
            className={`px-7 py-2.5 rounded-lg border-none text-white font-extrabold text-[13px] ${
              newBroker.name && newBroker.phone ? 'bg-blue-600 cursor-pointer' : 'bg-gray-300 cursor-default'
            }`}>
            등록
          </button>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {brokerList.map(b => (
          <Card key={b.id} className="px-[18px] py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full bg-[#EC489915] border-2 border-[#EC4899] flex items-center justify-center text-lg">🏠</div>
                <div>
                  <div className="text-[15px] font-extrabold text-[#1A1D23]">{b.name}</div>
                  <div className="text-xs text-[#8F95A3] mt-0.5">
                    <a href={`tel:${b.phone}`} className="text-blue-500 no-underline">{b.phone}</a>
                    {b.area && <span className="ml-2 text-gray-400">{b.area}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {editingId !== b.id && <>
                  <button onClick={() => startEdit(b)} className="px-3.5 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-600 text-[11px] font-bold cursor-pointer">수정</button>
                  <button onClick={() => removeBroker(b.id)} className="px-3.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 text-[11px] font-bold cursor-pointer">삭제</button>
                </>}
              </div>
            </div>
            {editingId === b.id && editBroker && (
              <div className="mt-3 pt-3 border-t-2 border-[#EC4899]">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-3`}>
                  <div>
                    <div className="text-[10px] text-[#8F95A3] mb-0.5">부동산명 *</div>
                    <Input value={editBroker.name} onChange={e => setEditBroker(p => p ? { ...p, name: e.target.value } : p)} className="h-9" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8F95A3] mb-0.5">연락처</div>
                    <Input value={editBroker.phone} onChange={e => setEditBroker(p => p ? { ...p, phone: e.target.value } : p)} className="h-9" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8F95A3] mb-0.5">담당 지역</div>
                    <Input value={editBroker.area} onChange={e => setEditBroker(p => p ? { ...p, area: e.target.value } : p)} className="h-9" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-6 py-2 rounded-lg border-none bg-[#EC4899] text-white font-extrabold text-xs cursor-pointer">저장</button>
                  <button onClick={() => { setEditingId(null); setEditBroker(null); }} className="px-6 py-2 rounded-lg border-[1.5px] border-[#E0E3E9] bg-white text-[#5F6577] font-bold text-xs cursor-pointer">취소</button>
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
