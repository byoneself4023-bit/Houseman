import { useState, useMemo } from 'react';
import { buildings } from '@/data';
import { useIsMobile } from '@/utils';
import { matchKorean, getChosung, CHOSUNG } from '@/utils/koreanSearch';
import { Card, SectionTitle, Table } from '@/components';
import { inputClassName } from '@/components/Field';

interface ParkingPageProps {
  myBuildings?: string[];
  activeTenants?: Record<string, any>[];
  parkingInfo: Record<string, any>;
  setParkingInfo: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isLoading?: boolean;
}

export const ParkingPage = ({ myBuildings = [], activeTenants = [], parkingInfo, setParkingInfo, isLoading }: ParkingPageProps) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCarNumber, setEditCarNumber] = useState("");
  const [editCarType, setEditCarType] = useState("");

  const allTenants = useMemo(() => myBuildings.length > 0
    ? activeTenants.filter(t => myBuildings.includes(t.building))
    : activeTenants, [myBuildings, activeTenants]);

  // Only real tenants (exclude 퇴실, 건물주, 전세)
  const realTenants = useMemo(() => allTenants.filter(t =>
    t.phone && t.phone.startsWith("010") &&
    !["퇴실", "건물주", "전세"].includes(t.name)
  ), [allTenants]);

  const getCar = (t: Record<string, any>) => ({
    carNumber: parkingInfo[t.id]?.carNumber ?? t.carNumber ?? "",
    carType: parkingInfo[t.id]?.carType ?? t.carType ?? "",
  });

  // Tenants with car registered
  const tenantsWithCars = realTenants.filter(t => {
    const car = getCar(t);
    return car.carNumber || car.carType;
  });

  // Filter
  const filtered = realTenants.filter(t => {
    const car = getCar(t);
    if (search) {
      const q = search;
      const inCarNumber = car.carNumber && matchKorean(car.carNumber, q);
      const inCarType = car.carType && matchKorean(car.carType, q);
      const inName = matchKorean(t.name, q);
      const inBuilding = matchKorean(t.building, q);
      const inRoom = matchKorean(t.room, q);
      if (!inCarNumber && !inCarType && !inName && !inBuilding && !inRoom) return false;
    }
    return true;
  });

  // Only show tenants with car data when not searching
  const displayList = search ? filtered : filtered.filter(t => {
    const car = getCar(t);
    return car.carNumber || car.carType;
  });

  // Building list for filter
  const buildingNames = [...new Set(realTenants.map(t => t.building))];

  // Stats per building
  const buildingCarCounts: Record<string, number> = {};
  tenantsWithCars.forEach(t => {
    buildingCarCounts[t.building] = (buildingCarCounts[t.building] || 0) + 1;
  });

  // Building parking totals lookup
  const getBuildingParkingTotal = (bName: string) => {
    const b = buildings.find(bd => bd.name === bName);
    return (b as any)?.parkingTotal ?? 0;
  };
  const totalParkingCapacity = buildingNames.reduce((sum, bName) => sum + getBuildingParkingTotal(bName), 0);

  // Buildings matched by search keyword (starts-with matching for chosung)
  const matchBuildingStart = (target: string, query: string) => {
    if (!query) return false;
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    if (t.startsWith(q)) return true;
    const isAllChosung = [...q].every(c => CHOSUNG.includes(c));
    if (isAllChosung) return getChosung(t).startsWith(q);
    const tCho = getChosung(t);
    let match = true;
    for (let j = 0; j < q.length; j++) {
      if (j >= t.length) { match = false; break; }
      const qc = q[j], tc = t[j], tcc = tCho[j];
      if (qc !== tc && qc !== tcc) { match = false; break; }
    }
    return match;
  };
  const searchMatchedBuildings = search
    ? buildingNames.filter(bName => matchBuildingStart(bName, search))
    : [];

  const startEdit = (t: Record<string, any>) => {
    const car = getCar(t);
    setEditingId(t.id);
    setEditCarNumber(car.carNumber);
    setEditCarType(car.carType);
  };

  const saveEdit = (id: string) => {
    setParkingInfo(prev => ({
      ...prev,
      [id]: { ...prev[id], carNumber: editCarNumber, carType: editCarType }
    }));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Mobile card view
  if (isMobile) {
    return (
      <div>
        <SectionTitle sub={`등록 차량 ${tenantsWithCars.length}대`}>🅿️ 주차 관리</SectionTitle>

        {/* Search */}
        <div className="mb-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="차번호, 이름, 건물, 호실 검색 (초성 가능)..."
            className={`${inputClassName} w-full px-4 py-2.5 text-sm bg-hm-bg-hover`} />
        </div>

        {/* Stats — search matched buildings */}
        {searchMatchedBuildings.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {searchMatchedBuildings.map(bName => {
              const used = buildingCarCounts[bName] || 0;
              const total = getBuildingParkingTotal(bName);
              const remain = total - used;
              return (
                <Card key={bName} className="p-3.5">
                  <div className="text-xs font-bold text-hm-text mb-1.5">{bName}</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs text-hm-text-muted">등록 / 총 주차대수</div>
                      <div className="text-lg font-bold text-hm-blue">
                        {used}<span className="text-xs text-hm-text-muted mx-0.5">/</span>{total}<span className="text-xs text-hm-text-muted ml-0.5">대</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-hm-text-muted">잔여</div>
                      <div className="text-base font-bold" style={{ color: remain < 0 ? "var(--color-hm-danger)" : remain === 0 ? "#D97706" : "var(--color-hm-success)" }}>
                        {remain}<span className="text-xs text-hm-text-muted ml-0.5">대</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Car list */}
        {displayList.length === 0 ? (
          <Card className="text-center py-10 text-hm-text-muted">
            <div className="text-[32px] mb-2">🅿️</div>
            <div className="text-sm">{search ? "검색 결과가 없습니다" : "등록된 차량이 없습니다"}</div>
          </Card>
        ) : (
          displayList.map(t => {
            const car = getCar(t);
            const isEditing = editingId === t.id;
            return (
              <Card key={t.id} className="mb-2 p-3.5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-hm-text-muted mb-1">
                      {t.building} · {t.room}호 · {t.name} · {t.phone || "-"}
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 mt-1.5">
                        <div>
                          <div className="text-xs text-hm-text-muted mb-1">차번호</div>
                          <input value={editCarNumber} onChange={e => setEditCarNumber(e.target.value)}
                            placeholder="123가 4567" className={`${inputClassName} px-2.5 py-[7px] text-xs`} />
                        </div>
                        <div>
                          <div className="text-xs text-hm-text-muted mb-1">차종</div>
                          <input value={editCarType} onChange={e => setEditCarType(e.target.value)}
                            placeholder="현대 아반떼" className={`${inputClassName} px-2.5 py-[7px] text-xs`} />
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(t.id)}
                            className="flex-1 py-2 rounded-lg border-none bg-hm-blue text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-blue-600 transition-colors">
                            저장
                          </button>
                          <button onClick={cancelEdit}
                            className="flex-1 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub text-xs font-bold cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-base font-bold text-hm-text tracking-wide">
                          {car.carNumber || <span className="text-gray-300">미등록</span>}
                        </div>
                        <div className="text-xs text-hm-text-sub mt-0.5">{car.carType}</div>
                      </>
                    )}
                  </div>
                  {editingId !== t.id && (
                    <button onClick={() => startEdit(t)}
                      className={`px-3 py-1.5 rounded-lg border border-hm-input-border text-xs font-bold text-hm-blue cursor-pointer font-[inherit] hover:bg-blue-50 transition-colors ${(car.carNumber || car.carType) ? "bg-hm-bg-hover" : "bg-hm-blue-bg"}`}>
                      {(car.carNumber || car.carType) ? "수정" : "등록"}
                    </button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    );
  }

  // Desktop layout
  const columns = [
    { label: "건물", key: "building", width: "5%" },
    { label: "호실", key: "room", width: "3%" },
    { label: "입주자", key: "name", width: "3%" },
    { label: "연락처", key: "phone", width: "5%", render: (row: Record<string, any>) => <span className="text-xs text-hm-text-sub">{row.phone || "-"}</span> },
    { label: "차번호", key: "carNumber", width: "5%", render: (row: Record<string, any>) => {
      if (editingId === row.id) {
        return <input value={editCarNumber} onChange={e => setEditCarNumber(e.target.value)}
          placeholder="123가 4567" autoFocus
          className={`${inputClassName} px-2 py-[5px] text-xs w-full`} />;
      }
      const car = getCar(row);
      return <span className="font-bold tracking-wide">{car.carNumber || <span className="text-gray-300">-</span>}</span>;
    }},
    { label: "차종", key: "carType", width: "5%", render: (row: Record<string, any>) => {
      if (editingId === row.id) {
        return <input value={editCarType} onChange={e => setEditCarType(e.target.value)}
          placeholder="현대 아반떼"
          className={`${inputClassName} px-2 py-[5px] text-xs w-full`} />;
      }
      const car = getCar(row);
      return car.carType || <span className="text-gray-300">-</span>;
    }},
    { label: "", key: "action", width: "3%", render: (row: Record<string, any>) => {
      if (editingId === row.id) {
        return (
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); saveEdit(row.id); }}
              className="px-2.5 py-1 rounded-md border-none bg-hm-blue text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-blue-600 transition-colors">
              저장
            </button>
            <button onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
              className="px-2.5 py-1 rounded-md border border-hm-input-border bg-white text-hm-text-sub text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              취소
            </button>
          </div>
        );
      }
      const car = getCar(row);
      const hasCar = car.carNumber || car.carType;
      return (
        <button onClick={(e) => { e.stopPropagation(); startEdit(row); }}
          className={`px-2.5 py-1 rounded-md border border-hm-input-border text-xs font-semibold text-hm-blue cursor-pointer font-[inherit] hover:bg-blue-50 transition-colors ${hasCar ? "bg-hm-bg-hover" : "bg-hm-blue-bg"}`}>
          {hasCar ? "수정" : "등록"}
        </button>
      );
    }}
  ];

  return (
    <div>
      <SectionTitle sub={`등록 차량 ${tenantsWithCars.length}대`}>🅿️ 주차 관리</SectionTitle>

      {/* Search */}
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="차번호, 이름, 건물, 호실 검색 (초성 가능)..."
          className="w-[300px] px-4 py-2.5 rounded-lg border border-hm-input-border text-sm outline-none font-[inherit] bg-hm-bg-hover focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
      </div>

      {/* Stats — search matched buildings */}
      {searchMatchedBuildings.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-4">
          {searchMatchedBuildings.map(bName => {
            const used = buildingCarCounts[bName] || 0;
            const total = getBuildingParkingTotal(bName);
            const remain = total - used;
            return (
              <Card key={bName} className="p-4">
                <div className="text-xs font-bold text-hm-text mb-2">{bName}</div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-hm-text-muted mb-1">등록 / 총 주차대수</div>
                    <div className="text-xl font-bold text-hm-blue">
                      {used}<span className="text-xs text-hm-text-muted mx-[3px]">/</span><span className="text-base text-hm-text">{total}</span><span className="text-xs text-hm-text-muted ml-0.5">대</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-hm-text-muted mb-1">잔여</div>
                    <div className="text-lg font-bold" style={{ color: remain < 0 ? "var(--color-hm-danger)" : remain === 0 ? "#D97706" : "var(--color-hm-success)" }}>
                      {remain}<span className="text-xs text-hm-text-muted ml-0.5">대</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table */}
      {displayList.length === 0 ? (
        <Card className="text-center py-12 text-hm-text-muted">
          <div className="text-[40px] mb-3">🅿️</div>
          <div className="text-sm font-semibold">{search ? "검색 결과가 없습니다" : "등록된 차량이 없습니다"}</div>
        </Card>
      ) : (
        <Card className="overflow-auto">
          <Table columns={columns} data={displayList} />
        </Card>
      )}
    </div>
  );
};
