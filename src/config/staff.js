// 담당자 역할 정의
export const staffRoles = [
  { id: "internal", label: "내부팀", icon: "🏢", color: "#3B82F6", desc: "사내 관리 담당" },
  { id: "external", label: "외부팀", icon: "🔧", color: "#10B981", desc: "외부 위탁 담당" },
  { id: "collection", label: "수금팀", icon: "💰", color: "#F59E0B", desc: "수금 전담 담당" },

  { id: "contract", label: "계약팀", icon: "📝", color: "#8B5CF6", desc: "계약·재계약 담당" },
  { id: "general", label: "총괄", icon: "👑", color: "#DC2626", desc: "전체 총괄 책임자" },
];

// 담당자 인원 데이터
export const initialStaffMembers = [
  { id: 1, name: "박종호 대표", phone: "010-5560-8245", pw: "8245", roles: ["general"], assignedBuildings: [] },
  { id: 2, name: "유은혜 부장", phone: "010-2345-6789", pw: "1234", roles: ["internal","collection"], assignedBuildings: [] },
  { id: 3, name: "나호용 차장", phone: "010-1234-5678", pw: "1234", roles: ["collection","external"], assignedBuildings: [] },
  { id: 9, name: "공원식 대리", phone: "010-0000-0000", pw: "1234", roles: ["internal"], assignedBuildings: [] },
  { id: 4, name: "유인식 과장", phone: "010-3456-7890", pw: "1234", roles: ["external"], assignedBuildings: [] },
  { id: 6, name: "이재혁 사원", phone: "010-6789-0123", pw: "1234", roles: ["external"], assignedBuildings: [] },
  { id: 7, name: "이진아 사원", phone: "010-7890-1234", pw: "1234", roles: ["internal"], assignedBuildings: [] },
  { id: 8, name: "조현경 사원", phone: "010-8901-2345", pw: "1234", roles: ["internal"], assignedBuildings: [] },
  { id: 5, name: "이우정 과장", phone: "010-4567-8901", pw: "1234", roles: ["collection"], assignedBuildings: [] },
];
