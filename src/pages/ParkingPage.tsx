import { useState, useMemo } from 'react';
import { buildings } from '@/data';
import { useIsMobile } from '@/utils';
import { matchKorean, getChosung, CHOSUNG } from '@/utils/koreanSearch';
import { Card, SectionTitle, Table } from '@/components';
import { inputStyle } from '@/components/Field';

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
        <div style={{ marginBottom: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="차번호, 이름, 건물, 호실 검색 (초성 가능)..."
            style={{ ...inputStyle, width: "100%", padding: "10px 14px", fontSize: 13, background: "#F9FAFB" }} />
        </div>

        {/* Stats — search matched buildings */}
        {searchMatchedBuildings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {searchMatchedBuildings.map(bName => {
              const used = buildingCarCounts[bName] || 0;
              const total = getBuildingParkingTotal(bName);
              const remain = total - used;
              return (
                <Card key={bName} style={{ padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 6 }}>{bName}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 9, color: "#8F95A3" }}>등록 / 총 주차대수</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#3B82F6" }}>
                        {used}<span style={{ fontSize: 11, color: "#8F95A3", margin: "0 2px" }}>/</span>{total}<span style={{ fontSize: 10, color: "#8F95A3", marginLeft: 2 }}>대</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#8F95A3" }}>잔여</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: remain < 0 ? "#DC2626" : remain === 0 ? "#D97706" : "#059669" }}>
                        {remain}<span style={{ fontSize: 10, color: "#8F95A3", marginLeft: 2 }}>대</span>
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
          <Card style={{ textAlign: "center", padding: 40, color: "#8F95A3" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🅿️</div>
            <div style={{ fontSize: 13 }}>{search ? "검색 결과가 없습니다" : "등록된 차량이 없습니다"}</div>
          </Card>
        ) : (
          displayList.map(t => {
            const car = getCar(t);
            const isEditing = editingId === t.id;
            return (
              <Card key={t.id} style={{ marginBottom: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#8F95A3", marginBottom: 4 }}>
                      {t.building} · {t.room}호 · {t.name} · {t.phone || "-"}
                    </div>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                        <div>
                          <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차번호</div>
                          <input value={editCarNumber} onChange={e => setEditCarNumber(e.target.value)}
                            placeholder="123가 4567" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차종</div>
                          <input value={editCarType} onChange={e => setEditCarType(e.target.value)}
                            placeholder="현대 아반떼" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => saveEdit(t.id)}
                            style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            저장
                          </button>
                          <button onClick={cancelEdit}
                            style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23", letterSpacing: "0.5px" }}>
                          {car.carNumber || <span style={{ color: "#D1D5DB" }}>미등록</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#5F6577", marginTop: 2 }}>{car.carType}</div>
                      </>
                    )}
                  </div>
                  {editingId !== t.id && (
                    <button onClick={() => startEdit(t)}
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E0E3E9", background: (car.carNumber || car.carType) ? "#F9FAFB" : "#EFF6FF", fontSize: 11, fontWeight: 700, color: "#3B82F6", cursor: "pointer", fontFamily: "inherit" }}>
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
    { label: "연락처", key: "phone", width: "5%", render: (row: Record<string, any>) => <span style={{ fontSize: 12, color: "#5F6577" }}>{row.phone || "-"}</span> },
    { label: "차번호", key: "carNumber", width: "5%", render: (row: Record<string, any>) => {
      if (editingId === row.id) {
        return <input value={editCarNumber} onChange={e => setEditCarNumber(e.target.value)}
          placeholder="123가 4567" autoFocus
          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, width: "100%" }} />;
      }
      const car = getCar(row);
      return <span style={{ fontWeight: 700, letterSpacing: "0.5px" }}>{car.carNumber || <span style={{ color: "#D1D5DB" }}>-</span>}</span>;
    }},
    { label: "차종", key: "carType", width: "5%", render: (row: Record<string, any>) => {
      if (editingId === row.id) {
        return <input value={editCarType} onChange={e => setEditCarType(e.target.value)}
          placeholder="현대 아반떼"
          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, width: "100%" }} />;
      }
      const car = getCar(row);
      return car.carType || <span style={{ color: "#D1D5DB" }}>-</span>;
    }},
    { label: "", key: "action", width: "3%", render: (row: Record<string, any>) => {
      if (editingId === row.id) {
        return (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={(e) => { e.stopPropagation(); saveEdit(row.id); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              저장
            </button>
            <button onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              취소
            </button>
          </div>
        );
      }
      const car = getCar(row);
      const hasCar = car.carNumber || car.carType;
      return (
        <button onClick={(e) => { e.stopPropagation(); startEdit(row); }}
          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: hasCar ? "#F9FAFB" : "#EFF6FF", fontSize: 11, fontWeight: 600, color: "#3B82F6", cursor: "pointer", fontFamily: "inherit" }}>
          {hasCar ? "수정" : "등록"}
        </button>
      );
    }}
  ];

  return (
    <div>
      <SectionTitle sub={`등록 차량 ${tenantsWithCars.length}대`}>🅿️ 주차 관리</SectionTitle>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="차번호, 이름, 건물, 호실 검색 (초성 가능)..."
          style={{ width: 300, padding: "10px 16px", borderRadius: 10, border: "1px solid #E0E3E9", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
      </div>

      {/* Stats — search matched buildings */}
      {searchMatchedBuildings.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
          {searchMatchedBuildings.map(bName => {
            const used = buildingCarCounts[bName] || 0;
            const total = getBuildingParkingTotal(bName);
            const remain = total - used;
            return (
              <Card key={bName} style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 8 }}>{bName}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>등록 / 총 주차대수</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#3B82F6" }}>
                      {used}<span style={{ fontSize: 12, color: "#8F95A3", margin: "0 3px" }}>/</span><span style={{ fontSize: 16, color: "#1A1D23" }}>{total}</span><span style={{ fontSize: 10, color: "#8F95A3", marginLeft: 2 }}>대</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>잔여</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: remain < 0 ? "#DC2626" : remain === 0 ? "#D97706" : "#059669" }}>
                      {remain}<span style={{ fontSize: 10, color: "#8F95A3", marginLeft: 2 }}>대</span>
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
        <Card style={{ textAlign: "center", padding: 48, color: "#8F95A3" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🅿️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{search ? "검색 결과가 없습니다" : "등록된 차량이 없습니다"}</div>
        </Card>
      ) : (
        <div style={{ maxWidth: 800 }}>
          <Table columns={columns} data={displayList} />
        </div>
      )}
    </div>
  );
};
