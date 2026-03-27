import { useState } from 'react';
import { staffRoles, initialStaffMembers } from '@/config';
import { useIsMobile } from '@/utils';
import { Card, SectionTitle } from '@/components';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { Input } from '@/components/ui/input';

interface StaffMember {
  id: number;
  name: string;
  phone: string;
  pw: string;
  roles: string[];
}

export const StaffPage = () => {
  const isMobile = useIsMobile();
  const [staffList, setStaffList] = useLocalStorage<StaffMember[]>("hm_staffList", initialStaffMembers);
  const [showAdd, setShowAdd] = useState(false);
  const [newStaff, setNewStaff] = useState<Omit<StaffMember, 'id'>>({ name: "", phone: "", pw: "", roles: [] });
  const [filterRole, setFilterRole] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStaff, setEditStaff] = useState<Omit<StaffMember, 'id'> | null>(null);

  const filteredStaff = filterRole === "all" ? staffList : staffList.filter(s => s.roles.includes(filterRole));
  const roleOf = (id: string) => staffRoles.find(r => r.id === id) || staffRoles[0];

  const addStaff = () => {
    if (!newStaff.name.trim() || newStaff.roles.length === 0) return;
    setStaffList(prev => [...prev, { ...newStaff, id: Date.now() }]);
    setNewStaff({ name: "", phone: "", pw: "", roles: [] });
    setShowAdd(false);
  };
  const removeStaff = (id: number) => setStaffList(prev => prev.filter(s => s.id !== id));
  const startEdit = (s: StaffMember) => { setEditingId(s.id); setEditStaff({ name: s.name, phone: s.phone, pw: s.pw || "", roles: [...s.roles] }); };
  const cancelEdit = () => { setEditingId(null); setEditStaff(null); };
  const saveEdit = () => {
    if (!editStaff || !editStaff.name.trim() || editStaff.roles.length === 0) return;
    setStaffList(prev => prev.map(s => s.id === editingId ? { ...s, ...editStaff } : s));
    cancelEdit();
  };

  const RoleSelector = ({ roles, onToggle }: { roles: string[]; onToggle: (id: string) => void }) => (
    <div className="flex gap-1 flex-wrap">
      {staffRoles.map(r => {
        const sel = roles.includes(r.id);
        return (
          <button key={r.id} onClick={() => onToggle(r.id)}
            className="px-3 py-1.5 rounded-md text-[11px] cursor-pointer transition-all duration-150"
            style={{
              border: sel ? `1.5px solid ${r.color}` : "1px solid #E0E3E9",
              background: sel ? `${r.color}15` : "#fff",
              color: sel ? r.color : "#8F95A3",
              fontWeight: sel ? 700 : 500,
            }}>
            {r.icon} {r.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <SectionTitle sub="담당자를 관리합니다">👥 담당자 관리</SectionTitle>

      {/* 역할별 현황 카드 */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : ''} gap-2.5 mb-5`}
        style={!isMobile ? { gridTemplateColumns: `repeat(${staffRoles.length}, 1fr)` } : undefined}>
        {staffRoles.map(role => {
          const count = staffList.filter(s => s.roles.includes(role.id)).length;
          const isActive = filterRole === role.id;
          return (
            <div key={role.id} onClick={() => setFilterRole(isActive ? "all" : role.id)}
              className="px-3 py-3.5 rounded-xl text-center cursor-pointer transition-all duration-150"
              style={{
                background: isActive ? role.color : "#fff",
                border: `2px solid ${isActive ? role.color : "#E8ECF0"}`,
                boxShadow: isActive ? `0 4px 12px ${role.color}30` : "none",
              }}>
              <div className="text-[22px] mb-1">{role.icon}</div>
              <div className={`text-[13px] font-extrabold ${isActive ? 'text-white' : 'text-[#1A1D23]'}`}>{role.label}</div>
              <div className="text-xl font-black mt-1" style={{ color: isActive ? "#fff" : role.color }}>
                {count}<span className="text-[11px] font-semibold">명</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mb-3">
        <div className="text-[13px] font-bold">
          {filterRole === "all" ? "전체 담당자" : `${roleOf(filterRole).icon} ${roleOf(filterRole).label} 담당자`} ({filteredStaff.length}명)
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className={`px-5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
            showAdd
              ? 'border-[1.5px] border-[#E0E3E9] bg-white text-[#5F6577]'
              : 'border-[1.5px] border-blue-500 bg-blue-50 text-blue-600'
          }`}>
          {showAdd ? "취소" : "➕ 담당자 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <Card className="mb-4 border-2 border-blue-500">
          <div className="text-xs font-extrabold text-blue-600 mb-3">새 담당자 등록</div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">이름 *</div>
              <Input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} placeholder="담당자명" className="h-9" />
            </div>
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">연락처</div>
              <Input value={newStaff.phone} onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" className="h-9" />
            </div>
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">비밀번호</div>
              <Input value={newStaff.pw} onChange={e => setNewStaff(p => ({ ...p, pw: e.target.value }))} placeholder="0000" className="h-9" />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[10px] text-[#8F95A3] mb-1">역할 (복수 선택) *</div>
            <RoleSelector roles={newStaff.roles} onToggle={(id) => setNewStaff(p => ({ ...p, roles: p.roles.includes(id) ? p.roles.filter(x => x !== id) : [...p.roles, id] }))} />
          </div>
          <button onClick={addStaff}
            className={`px-7 py-2.5 rounded-lg border-none text-white font-extrabold text-[13px] ${
              newStaff.name && newStaff.roles.length > 0 ? 'bg-blue-600 cursor-pointer' : 'bg-gray-300 cursor-default'
            }`}>
            등록
          </button>
        </Card>
      )}

      {/* 담당자 목록 */}
      <div className="flex flex-col gap-2">
        {filteredStaff.map(s => {
          const primaryRole = roleOf(s.roles[0]);
          return (
            <Card key={s.id} className="px-[18px] py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg"
                    style={{ background: `${primaryRole.color}15`, border: `2px solid ${primaryRole.color}` }}>
                    {primaryRole.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[15px] font-extrabold text-[#1A1D23]">{s.name}</span>
                      {s.roles.map(rid => {
                        const r = roleOf(rid);
                        return <span key={rid} className="text-[10px] px-2 py-0.5 rounded-[5px] font-bold" style={{ background: `${r.color}15`, color: r.color }}>{r.icon} {r.label}</span>;
                      })}
                    </div>
                    <div className="text-xs text-[#8F95A3] mt-0.5">
                      <a href={`tel:${s.phone}`} className="text-blue-500 no-underline">{s.phone}</a>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startEdit(s)} className="px-3.5 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-600 text-[11px] font-bold cursor-pointer">수정</button>
                  <button onClick={() => removeStaff(s.id)} className="px-3.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 text-[11px] font-bold cursor-pointer">삭제</button>
                </div>
              </div>
              {/* 인라인 수정 폼 */}
              {editingId === s.id && editStaff && (
                <div className="mt-3 pt-3 border-t-2 border-blue-500">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] text-[#8F95A3] mb-0.5">이름 *</div>
                      <Input value={editStaff.name} onChange={e => setEditStaff(p => p ? { ...p, name: e.target.value } : p)} className="h-9" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8F95A3] mb-0.5">연락처</div>
                      <Input value={editStaff.phone} onChange={e => setEditStaff(p => p ? { ...p, phone: e.target.value } : p)} className="h-9" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8F95A3] mb-0.5">비밀번호</div>
                      <Input value={editStaff.pw} onChange={e => setEditStaff(p => p ? { ...p, pw: e.target.value } : p)} className="h-9" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-[10px] text-[#8F95A3] mb-1">역할 (복수 선택) *</div>
                    <RoleSelector roles={editStaff.roles} onToggle={(id) => setEditStaff(p => p ? { ...p, roles: p.roles.includes(id) ? p.roles.filter(x => x !== id) : [...p.roles, id] } : p)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit}
                      className={`px-6 py-2 rounded-lg border-none text-white font-extrabold text-xs ${
                        editStaff.name && editStaff.roles.length > 0 ? 'bg-blue-600 cursor-pointer' : 'bg-gray-300 cursor-default'
                      }`}>
                      저장
                    </button>
                    <button onClick={cancelEdit} className="px-6 py-2 rounded-lg border-[1.5px] border-[#E0E3E9] bg-white text-[#5F6577] font-bold text-xs cursor-pointer">취소</button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
