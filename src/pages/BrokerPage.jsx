import { useState, useMemo } from 'react';
import { useIsMobile } from '../utils';
import { Card, SectionTitle } from '../components';
import { inputStyle } from '../components/Field';
import { useLocalStorage } from '../utils/useLocalStorage';

export const BrokerPage = () => {
  const isMobile = useIsMobile();
  const [brokerList, setBrokerList] = useLocalStorage("hm_brokerList", []);
  const [showAdd, setShowAdd] = useState(false);
  const [newBroker, setNewBroker] = useState({ name: "", phone: "", area: "" });
  const [editingId, setEditingId] = useState(null);
  const [editBroker, setEditBroker] = useState(null);

  // 기존 계약에서 부동산 정보 수집 (중복 제거)
  const collectedBrokers = useMemo(() => {
    try {
      const evts = JSON.parse(localStorage.getItem("hm_calendarEvts") || "[]");
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
  }, []);

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
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 8 }}>계약 이력에서 수집 ({collectedBrokers.length}개)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {collectedBrokers.map((b, i) => {
              const alreadyAdded = brokerList.some(x => normalize(x.phone) === normalize(b.phone));
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: alreadyAdded ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${alreadyAdded ? "#BBF7D0" : "#E5E7EB"}`, borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{b.name || "미입력"}</span>
                    <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>{b.phone}</span>
                    {b.buildings.length > 0 && <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8 }}>{b.buildings.join(", ")}</span>}
                  </div>
                  {alreadyAdded
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>등록됨</span>
                    : <button onClick={() => importBroker(b)} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>등록</button>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 등록된 부동산 목록 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>등록 부동산 ({brokerList.length}개)</div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: "8px 20px", borderRadius: 8, border: showAdd ? "1.5px solid #E0E3E9" : "1.5px solid #3B82F6", background: showAdd ? "#fff" : "#EFF6FF", color: showAdd ? "#5F6577" : "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          {showAdd ? "취소" : "➕ 부동산 추가"}
        </button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 16, border: "2px solid #3B82F6" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", marginBottom: 12 }}>새 부동산 등록</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>부동산명 *</div>
              <input value={newBroker.name} onChange={e => setNewBroker(p => ({ ...p, name: e.target.value }))} placeholder="OO공인중개사" style={{ ...inputStyle, padding: "8px 12px" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>연락처 *</div>
              <input value={newBroker.phone} onChange={e => setNewBroker(p => ({ ...p, phone: e.target.value }))} placeholder="02-0000-0000" style={{ ...inputStyle, padding: "8px 12px" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>담당 지역/건물</div>
              <input value={newBroker.area} onChange={e => setNewBroker(p => ({ ...p, area: e.target.value }))} placeholder="관악구" style={{ ...inputStyle, padding: "8px 12px" }} />
            </div>
          </div>
          <button onClick={addBroker} style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: newBroker.name && newBroker.phone ? "#2563EB" : "#D1D5DB", color: "#fff", fontWeight: 800, fontSize: 13, cursor: newBroker.name && newBroker.phone ? "pointer" : "default", fontFamily: "inherit" }}>등록</button>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {brokerList.map(b => (
          <Card key={b.id} style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#EC489915", border: "2px solid #EC4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏠</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2 }}>
                    <a href={`tel:${b.phone}`} style={{ color: "#3B82F6", textDecoration: "none" }}>{b.phone}</a>
                    {b.area && <span style={{ marginLeft: 8, color: "#9CA3AF" }}>{b.area}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {editingId !== b.id && <>
                  <button onClick={() => startEdit(b)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>수정</button>
                  <button onClick={() => removeBroker(b.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
                </>}
              </div>
            </div>
            {editingId === b.id && editBroker && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px solid #EC4899" }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>부동산명 *</div>
                    <input value={editBroker.name} onChange={e => setEditBroker(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, padding: "8px 12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>연락처</div>
                    <input value={editBroker.phone} onChange={e => setEditBroker(p => ({ ...p, phone: e.target.value }))} style={{ ...inputStyle, padding: "8px 12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>담당 지역</div>
                    <input value={editBroker.area} onChange={e => setEditBroker(p => ({ ...p, area: e.target.value }))} style={{ ...inputStyle, padding: "8px 12px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#EC4899", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
                  <button onClick={() => { setEditingId(null); setEditBroker(null); }} style={{ padding: "8px 24px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {brokerList.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>등록된 부동산이 없습니다. 위에서 추가하거나 계약 이력에서 가져오세요.</div>
        )}
      </div>
    </div>
  );
};
