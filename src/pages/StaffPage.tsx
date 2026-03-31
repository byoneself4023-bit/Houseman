// @ts-nocheck
import { useState } from 'react';
import { staffRoles, initialStaffMembers } from '../config';
import { useIsMobile } from '../utils';
import { Card, SectionTitle } from '../components';
import { inputClassName } from '../components/Field';
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
          <div className={`grid ${isMobile ? 'grid-cols-2' : `grid-cols-${staffRoles.length}`} gap-2.5 mb-5`}>
            {staffRoles.map(role => {
              const count = staffList.filter(s => s.roles.includes(role.id)).length;
              const active = filterRole === role.id;
              return (
                <div key={role.id} onClick={() => setFilterRole(active ? "all" : role.id)}
                  className="py-3.5 px-3 rounded-xl text-center cursor-pointer transition-all duration-150"
                  style={{
                    background: active ? role.color : "#fff",
                    border: `2px solid ${active ? role.color : "#E8ECF0"}`,
                    boxShadow: active ? `0 4px 12px ${role.color}30` : "none",
                  }}>
                  <div className="text-[22px] mb-1">{role.icon}</div>
                  <div className={`text-[13px] font-extrabold ${active ? 'text-white' : 'text-hm-text'}`}>{role.label}</div>
                  <div className="text-xl font-black mt-1" style={{ color: active ? "#fff" : role.color }}>{count}<span className="text-[11px] font-semibold">명</span></div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mb-3">
            <div className="text-[13px] font-bold">{filterRole === "all" ? "전체 담당자" : `${roleOf(filterRole).icon} ${roleOf(filterRole).label} 담당자`} ({filteredStaff.length}명)</div>
            <button onClick={() => setShowAdd(!showAdd)}
              className={`px-5 py-2 rounded-lg font-bold text-xs cursor-pointer font-[inherit] transition-colors ${showAdd ? 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub' : 'border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark'}`}>
              {showAdd ? "취소" : "➕ 담당자 추가"}
            </button>
          </div>

          {/* 추가 폼 */}
          {showAdd && (
            <Card style={{ marginBottom: 16, border: "2px solid #3B82F6" }}>
              <div className="text-xs font-extrabold text-hm-blue-dark mb-3">새 담당자 등록</div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-[3px]">이름 *</div>
                  <input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} placeholder="담당자명" className={`${inputClassName} py-2`} />
                </div>
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-[3px]">연락처</div>
                  <input value={newStaff.phone} onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" className={`${inputClassName} py-2`} />
                </div>
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-[3px]">비밀번호</div>
                  <input value={newStaff.pw} onChange={e => setNewStaff(p => ({ ...p, pw: e.target.value }))} placeholder="0000" className={`${inputClassName} py-2`} />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-[10px] text-hm-text-muted mb-1">역할 (복수 선택) *</div>
                <div className="flex gap-1 flex-wrap">
                  {staffRoles.map(r => {
                    const sel = newStaff.roles.includes(r.id);
                    return <button key={r.id} onClick={() => setNewStaff(p => ({ ...p, roles: sel ? p.roles.filter(x => x !== r.id) : [...p.roles, r.id] }))}
                      className="px-3 py-1.5 rounded-md text-[11px] cursor-pointer font-[inherit] transition-colors"
                      style={{ border: sel ? `1.5px solid ${r.color}` : "1px solid #E0E3E9", background: sel ? `${r.color}15` : "#fff", color: sel ? r.color : "#8F95A3", fontWeight: sel ? 700 : 500 }}>
                      {r.icon} {r.label}
                    </button>;
                  })}
                </div>
              </div>
              <button onClick={addStaff} className={`px-7 py-2.5 rounded-lg border-none text-white font-extrabold text-[13px] font-[inherit] ${newStaff.name && newStaff.roles.length > 0 ? 'bg-hm-blue-dark cursor-pointer hover:bg-blue-700' : 'bg-gray-300 cursor-default'} transition-colors`}>등록</button>
            </Card>
          )}

          {/* 담당자 목록 */}
          <div className="flex flex-col gap-2">
            {filteredStaff.map(s => {
              const primaryRole = roleOf(s.roles[0]);
              return (
                <Card key={s.id} className="!py-3.5 !px-[18px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg" style={{ background: `${primaryRole.color}15`, border: `2px solid ${primaryRole.color}` }}>{primaryRole.icon}</div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[15px] font-extrabold text-hm-text">{s.name}</span>
                          {s.roles.map(rid => {
                            const r = roleOf(rid);
                            return <span key={rid} className="text-[10px] px-2 py-0.5 rounded-[5px] font-bold" style={{ background: `${r.color}15`, color: r.color }}>{r.icon} {r.label}</span>;
                          })}
                        </div>
                        <div className="text-xs text-hm-text-muted mt-0.5">
                          <a href={`tel:${s.phone}`} className="text-hm-blue no-underline hover:underline">{s.phone}</a>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(s)} className="px-3.5 py-1.5 rounded-md border border-blue-200 bg-hm-blue-bg text-hm-blue-dark text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">수정</button>
                      <button onClick={() => removeStaff(s.id)} className="px-3.5 py-1.5 rounded-md border border-hm-danger-border bg-hm-danger-bg text-hm-danger text-[11px] font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">삭제</button>
                    </div>
                  </div>
                  {/* 인라인 수정 폼 */}
                  {editingId === s.id && editStaff && (
                    <div className="mt-3 pt-3 border-t-2 border-hm-blue">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <div className="text-[10px] text-hm-text-muted mb-[3px]">이름 *</div>
                          <input value={editStaff.name} onChange={e => setEditStaff(p => ({ ...p, name: e.target.value }))} className={`${inputClassName} py-2`} />
                        </div>
                        <div>
                          <div className="text-[10px] text-hm-text-muted mb-[3px]">연락처</div>
                          <input value={editStaff.phone} onChange={e => setEditStaff(p => ({ ...p, phone: e.target.value }))} className={`${inputClassName} py-2`} />
                        </div>
                        <div>
                          <div className="text-[10px] text-hm-text-muted mb-[3px]">비밀번호</div>
                          <input value={editStaff.pw} onChange={e => setEditStaff(p => ({ ...p, pw: e.target.value }))} className={`${inputClassName} py-2`} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="text-[10px] text-hm-text-muted mb-1">역할 (복수 선택) *</div>
                        <div className="flex gap-1 flex-wrap">
                          {staffRoles.map(r => {
                            const sel = editStaff.roles.includes(r.id);
                            return <button key={r.id} onClick={() => setEditStaff(p => ({ ...p, roles: sel ? p.roles.filter(x => x !== r.id) : [...p.roles, r.id] }))}
                              className="px-3 py-1.5 rounded-md text-[11px] cursor-pointer font-[inherit] transition-colors"
                              style={{ border: sel ? `1.5px solid ${r.color}` : "1px solid #E0E3E9", background: sel ? `${r.color}15` : "#fff", color: sel ? r.color : "#8F95A3", fontWeight: sel ? 700 : 500 }}>
                              {r.icon} {r.label}
                            </button>;
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className={`px-6 py-2 rounded-lg border-none text-white font-extrabold text-xs font-[inherit] ${editStaff.name && editStaff.roles.length > 0 ? 'bg-hm-blue-dark cursor-pointer hover:bg-blue-700' : 'bg-gray-300 cursor-default'} transition-colors`}>저장</button>
                        <button onClick={cancelEdit} className="px-6 py-2 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
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
