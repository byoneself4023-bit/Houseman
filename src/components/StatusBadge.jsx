export const StatusBadge = ({ status, label }) => {
  const map = {
    정상: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    연체: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    청구: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
    완료: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    진행중: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
    대기: { bg: "#F0F4FF", color: "#4F46E5", border: "#C7D2FE" },
    도래: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    예정: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
    관심: { bg: "#F0F4FF", color: "#4F46E5", border: "#C7D2FE" },
    높음: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    보통: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
    낮음: { bg: "#F0F4FF", color: "#6366F1", border: "#C7D2FE" },
    임차인연결: { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
  };
  const s = map[status] || map["정상"];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {label || status}
    </span>
  );
};
