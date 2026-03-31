import React from 'react';

interface TenantSearchBarProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  buildingFilter: string;
  setBuildingFilter: (v: string) => void;
  buildingNames: string[];
}

export const TenantSearchBar: React.FC<TenantSearchBarProps> = ({
  search, setSearch, statusFilter, setStatusFilter, buildingFilter, setBuildingFilter, buildingNames,
}) => {
  return (
    <div className="flex items-center gap-2.5 mb-4 flex-wrap">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 건물, 호실 검색..."
        className="w-[200px] py-[7px] px-3.5 rounded-lg border border-hm-input-border text-xs outline-none font-[inherit] bg-hm-bg-hover focus:border-hm-blue focus:ring-1 focus:ring-hm-blue/30 transition-colors" />
      <select value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}
        className={`py-[7px] px-3 rounded-lg border border-hm-input-border text-xs font-[inherit] transition-colors ${buildingFilter === "전체" ? "text-hm-text-muted" : "text-hm-text"}`}>
        <option value="전체">전체 건물</option>
        {buildingNames.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
      <div className="flex gap-1">
        {["전체", "정상", "연체"].map(s => {
          const isActive = statusFilter === s;
          const bgMap: Record<string, string> = { "연체": "bg-hm-danger-bg", "정상": "bg-hm-success-bg", "전체": "bg-gray-100" };
          const colorMap: Record<string, string> = { "연체": "text-hm-danger", "정상": "text-hm-success", "전체": "text-gray-700" };
          const borderMap: Record<string, string> = { "연체": "border-hm-danger-border", "정상": "border-hm-success-border", "전체": "border-gray-300" };
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-[5px] rounded-md text-[11px] font-bold cursor-pointer font-[inherit] transition-colors ${
                isActive
                  ? `${bgMap[s]} ${colorMap[s]} ${borderMap[s]} border-[1.5px]`
                  : "bg-white text-hm-text-muted border border-hm-input-border hover:bg-hm-bg-hover"
              }`}>
              {s}
            </button>
          );
        })}
      </div>
      {(buildingFilter !== "전체" || statusFilter !== "전체" || search) && (
        <button onClick={() => { setBuildingFilter("전체"); setStatusFilter("전체"); setSearch(""); }}
          className="px-2.5 py-[5px] rounded-md border border-hm-input-border bg-hm-bg-hover text-[10px] font-semibold text-gray-500 cursor-pointer font-[inherit] hover:bg-gray-200 transition-colors">
          초기화
        </button>
      )}
    </div>
  );
};
