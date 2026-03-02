import { useState } from 'react';
import { staffRoles, initialStaffMembers } from '../config';
import { useIsMobile } from '../utils';
import { Card, SectionTitle } from '../components';
import { inputStyle } from '../components/Field';
import { useLocalStorage } from '../utils/useLocalStorage';

export const StaffPage = () => {
  const isMobile = useIsMobile();
  const [staffList, setStaffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const [showAdd, setShowAdd] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", phone: "", pw: "", roles: [] });
  const [filterRole, setFilterRole] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editStaff, setEditStaff] = useState(null);

  const filteredStaff = filterRole === "all" ? staffList : staffList.filter(s => s.roles.includes(filterRole));
  const roleOf = (id) => staffRoles.find(r => r.id === id) || staffRoles[0];

  const addStaff = () => {
    if (!newStaff.name.trim() || newStaff.roles.length === 0) return;
    setStaffList(prev => [...prev, { ...newStaff, id: Date.now() }]);
    setNewStaff({ name: "", phone: "", pw: "", roles: [] });
    setShowAdd(false);
  };
  const removeStaff = (id) => setStaffList(prev => prev.filter(s => s.id !== id));
  const startEdit = (s) => { setEditingId(s.id); setEditStaff({ name: s.name, phone: s.phone, pw: s.pw || "", roles: [...s.roles] }); };
  const cancelEdit = () => { setEditingId(null); setEditStaff(null); };
  const saveEdit = () => {
    if (!editStaff.name.trim() || editStaff.roles.length === 0) return;
    setStaffList(prev => prev.map(s => s.id === editingId ? { ...s, ...editStaff } : s));
    cancelEdit();
  };

  return (
    <div>
      <SectionTitle sub="담당자를 관리합니다">👥 담당자 관리</SectionTitle>

      {/* ========== 담당자 ========== */}
        <div>
          {/* 역할별 현황 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : `repeat(${staffRoles.length}, 1fr)`, gap: 10, marginBottom: 20 }}>
            {staffRoles.map(role => {
              const count = staffList.filter(s => s.roles.includes(role.id)).length;
              return (
                <div key={role.id} onClick={() => setFilterRole(filterRole === role.id ? "all" : role.id)}
                  style={{ padding: "14px 12px", borderRadius: 12, textAlign: "center", cursor: "pointer", transition: "all 0.15s",
                    background: filterRole === role.id ? role.color : "#fff",
                    border: `2px solid ${filterRole === role.id ? role.color : "#E8ECF0"}`,
                    boxShadow: filterRole === role.id ? `0 4px 12px ${role.color}30` : "none" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{role.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: filterRole === role.id ? "#fff" : "#1A1D23" }}>{role.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: filterRole === role.id ? "#fff" : role.color, marginTop: 4 }}>{count}<span style={{ fontSize: 11, fontWeight: 600 }}>명</span></div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{filterRole === "all" ? "전체 담당자" : `${roleOf(filterRole).icon} ${roleOf(filterRole).label} 담당자`} ({filteredStaff.length}명)</div>
            <button onClick={() => setShowAdd(!showAdd)}
              style={{ padding: "8px 20px", borderRadius: 8, border: showAdd ? "1.5px solid #E0E3E9" : "1.5px solid #3B82F6", background: showAdd ? "#fff" : "#EFF6FF", color: showAdd ? "#5F6577" : "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {showAdd ? "취소" : "➕ 담당자 추가"}
            </button>
          </div>

          {/* 추가 폼 */}
          {showAdd && (
            <Card style={{ marginBottom: 16, border: "2px solid #3B82F6" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", marginBottom: 12 }}>새 담당자 등록</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>이름 *</div>
                  <input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} placeholder="담당자명" style={{ ...inputStyle, padding: "8px 12px" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>연락처</div>
                  <input value={newStaff.phone} onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" style={{ ...inputStyle, padding: "8px 12px" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>비밀번호</div>
                  <input value={newStaff.pw} onChange={e => setNewStaff(p => ({ ...p, pw: e.target.value }))} placeholder="0000" style={{ ...inputStyle, padding: "8px 12px" }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>역할 (복수 선택) *</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {staffRoles.map(r => {
                    const sel = newStaff.roles.includes(r.id);
                    return <button key={r.id} onClick={() => setNewStaff(p => ({ ...p, roles: sel ? p.roles.filter(x => x !== r.id) : [...p.roles, r.id] }))}
                      style={{ padding: "6px 12px", borderRadius: 6, border: sel ? `1.5px solid ${r.color}` : "1px solid #E0E3E9", background: sel ? `${r.color}15` : "#fff", color: sel ? r.color : "#8F95A3", fontSize: 11, fontWeight: sel ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                      {r.icon} {r.label}
                    </button>;
                  })}
                </div>
              </div>
              <button onClick={addStaff} style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: newStaff.name && newStaff.roles.length > 0 ? "#2563EB" : "#D1D5DB", color: "#fff", fontWeight: 800, fontSize: 13, cursor: newStaff.name && newStaff.roles.length > 0 ? "pointer" : "default", fontFamily: "inherit" }}>등록</button>
            </Card>
          )}

          {/* 담당자 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredStaff.map(s => {
              const primaryRole = roleOf(s.roles[0]);
              return (
                <Card key={s.id} style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${primaryRole.color}15`, border: `2px solid ${primaryRole.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{primaryRole.icon}</div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{s.name}</span>
                          {s.roles.map(rid => {
                            const r = roleOf(rid);
                            return <span key={rid} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, fontWeight: 700, background: `${r.color}15`, color: r.color }}>{r.icon} {r.label}</span>;
                          })}
                        </div>
                        <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2 }}>
                          <a href={`tel:${s.phone}`} style={{ color: "#3B82F6", textDecoration: "none" }}>{s.phone}</a>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => startEdit(s)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>수정</button>
                      <button onClick={() => removeStaff(s.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
                    </div>
                  </div>
                  {/* 인라인 수정 폼 */}
                  {editingId === s.id && editStaff && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px solid #3B82F6" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>이름 *</div>
                          <input value={editStaff.name} onChange={e => setEditStaff(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, padding: "8px 12px" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>연락처</div>
                          <input value={editStaff.phone} onChange={e => setEditStaff(p => ({ ...p, phone: e.target.value }))} style={{ ...inputStyle, padding: "8px 12px" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 3 }}>비밀번호</div>
                          <input value={editStaff.pw} onChange={e => setEditStaff(p => ({ ...p, pw: e.target.value }))} style={{ ...inputStyle, padding: "8px 12px" }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>역할 (복수 선택) *</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {staffRoles.map(r => {
                            const sel = editStaff.roles.includes(r.id);
                            return <button key={r.id} onClick={() => setEditStaff(p => ({ ...p, roles: sel ? p.roles.filter(x => x !== r.id) : [...p.roles, r.id] }))}
                              style={{ padding: "6px 12px", borderRadius: 6, border: sel ? `1.5px solid ${r.color}` : "1px solid #E0E3E9", background: sel ? `${r.color}15` : "#fff", color: sel ? r.color : "#8F95A3", fontSize: 11, fontWeight: sel ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                              {r.icon} {r.label}
                            </button>;
                          })}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEdit} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: editStaff.name && editStaff.roles.length > 0 ? "#2563EB" : "#D1D5DB", color: "#fff", fontWeight: 800, fontSize: 12, cursor: editStaff.name && editStaff.roles.length > 0 ? "pointer" : "default", fontFamily: "inherit" }}>저장</button>
                        <button onClick={cancelEdit} style={{ padding: "8px 24px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
    </div>
  );
};
