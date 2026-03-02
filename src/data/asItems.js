export const asItems = [
  { id: 1, date: "2026-02-20", building: "스타빌", room: "403", content: "보일러 소음 발생", detail: "가동 시 '쿵쿵' 소리 발생, 세입자 수면 방해 호소", priority: "높음", assignee: "나호용 차장", status: "진행중", category: "보일러", paid: "무상", cost: 0, vendor: "", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-20", action: "접수", note: "세입자 전화 접수, 보일러 가동 시 소음" },
    { date: "2026-02-21", action: "현장확인", note: "순환펌프 이상 소음 확인, 부품 교체 필요" },
    { date: "2026-02-22", action: "부품발주", note: "순환펌프 발주 완료, 2/24 입고 예정" },
  ]},
  { id: 2, date: "2026-02-19", building: "W하우스", room: "302", content: "화장실 수전 교체 필요", detail: "온수 수전 핸들 헐거움, 물 잠김 불량", priority: "보통", assignee: "나호용 차장", status: "대기", category: "배관/수전", paid: "무상", cost: 0, vendor: "", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-19", action: "접수", note: "세입자 카톡 접수, 수전 핸들 사진 전달받음" },
  ]},
  { id: 3, date: "2026-02-18", building: "아페이론", room: "204", content: "거실 등기구 점등 불량", detail: "LED 등기구 깜빡임 현상, 안정기 불량 추정", priority: "낮음", assignee: "나호용 차장", status: "대기", category: "전기", paid: "무상", cost: 0, vendor: "", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-18", action: "접수", note: "관리팀 정기점검 시 발견" },
  ]},
  { id: 4, date: "2026-02-17", building: "모던라이프", room: "501", content: "비데 고장", detail: "노즐 작동 안됨, 전원은 정상", priority: "보통", assignee: "나호용 차장", status: "진행중", category: "위생설비", paid: "유상", cost: 85000, vendor: "크린워터", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-17", action: "접수", note: "세입자 전화 접수" },
    { date: "2026-02-18", action: "현장확인", note: "노즐 모터 고장, 세입자 과실(이물질 투입) 판단" },
    { date: "2026-02-19", action: "견적전달", note: "크린워터 견적 85,000원 → 세입자 동의 완료" },
  ]},
  { id: 5, date: "2026-02-15", building: "에덴빌", room: "302", content: "주방 등기구 교체", detail: "LED 등 수명 다함, 전체 교체 필요", priority: "낮음", assignee: "나호용 차장", status: "완료", category: "전기", paid: "무상", cost: 35000, vendor: "대림전기", photoBefore: "📷 접수사진", photoAfter: "📷 완료사진", steps: [
    { date: "2026-02-15", action: "접수", note: "세입자 카톡 접수" },
    { date: "2026-02-15", action: "현장확인", note: "LED 등기구 수명 다함 확인" },
    { date: "2026-02-16", action: "수리완료", note: "대림전기 LED 등기구 교체 완료, 35,000원" },
    { date: "2026-02-16", action: "완료확인", note: "세입자 확인 완료, 정상 작동" },
  ]},
  { id: 6, date: "2026-02-14", building: "한스텔", room: "201", content: "현관 도어락 배터리", detail: "도어락 저전압 경고, 배터리 교체 필요", priority: "높음", assignee: "나호용 차장", status: "완료", category: "도어락", paid: "무상", cost: 8000, vendor: "", photoBefore: "", photoAfter: "📷 완료사진", steps: [
    { date: "2026-02-14", action: "접수", note: "세입자 긴급 연락, 외출 중 잠김 위험" },
    { date: "2026-02-14", action: "현장출동", note: "배터리 교체 완료 (9V 건전지 2개)" },
    { date: "2026-02-14", action: "완료확인", note: "정상 작동 확인" },
  ]},
  { id: 7, date: "2026-02-21", building: "다존하우스", room: "301", content: "베란다 배수구 막힘", detail: "배수 역류 현상, 악취 동반", priority: "높음", assignee: "나호용 차장", status: "대기", category: "배관/수전", paid: "무상", cost: 0, vendor: "", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-21", action: "접수", note: "세입자 전화 접수, 베란다 물 안빠짐" },
  ]},
  { id: 8, date: "2026-02-21", building: "모닝빌", room: "201", content: "에어컨 리모컨 고장", detail: "리모컨 버튼 무반응, 본체 수신부 점검 필요", priority: "낮음", assignee: "나호용 차장", status: "대기", category: "냉난방", paid: "무상", cost: 0, vendor: "", photoBefore: "", photoAfter: "", steps: [
    { date: "2026-02-21", action: "접수", note: "세입자 카톡 접수" },
  ]},
  { id: 9, date: "2026-02-22", building: "포유빌", room: "503", content: "화장실 환풍기 소음", detail: "환풍기 모터 소음 심함, 교체 필요 추정", priority: "보통", assignee: "나호용 차장", status: "대기", category: "전기", paid: "무상", cost: 0, vendor: "", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-22", action: "접수", note: "세입자 전화 접수" },
  ]},
  { id: 10, date: "2026-02-22", building: "제이앤제이", room: "201", content: "싱크대 수전 물 떨어짐", detail: "잠가도 물이 똑똑 떨어짐, 패킹 교체 필요", priority: "보통", assignee: "나호용 차장", status: "대기", category: "배관/수전", paid: "무상", cost: 0, vendor: "", photoBefore: "", photoAfter: "", steps: [
    { date: "2026-02-22", action: "접수", note: "세입자 카톡 접수" },
  ]},
  { id: 11, date: "2026-02-22", building: "굿모닝빌", room: "401", content: "방문 잠금장치 고장", detail: "안방 문 잠금 안됨, 래치 불량", priority: "낮음", assignee: "나호용 차장", status: "대기", category: "도어락", paid: "무상", cost: 0, vendor: "", photoBefore: "", photoAfter: "", steps: [
    { date: "2026-02-22", action: "접수", note: "세입자 카톡 접수" },
  ]},
  { id: 12, date: "2026-02-22", building: "와이원빈티지", room: "102", content: "보일러 온수 안나옴", detail: "온수 전환 안됨, 삼방밸브 점검 필요", priority: "높음", assignee: "나호용 차장", status: "진행중", category: "보일러", paid: "무상", cost: 0, vendor: "", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-22", action: "접수", note: "세입자 긴급 전화, 온수 안나옴" },
    { date: "2026-02-22", action: "현장확인", note: "삼방밸브 고착, 부품 교체 필요" },
  ]},
  { id: 13, date: "2026-02-20", building: "토브미하우스", room: "301", content: "거실 벽지 곰팡이", detail: "결로로 인한 곰팡이 발생, 환기 부족", priority: "보통", assignee: "나호용 차장", status: "대기", category: "내장", paid: "무상", cost: 0, vendor: "", photoBefore: "📷 접수사진", photoAfter: "", steps: [
    { date: "2026-02-20", action: "접수", note: "세입자 카톡 사진 접수" },
  ]},
  { id: 14, date: "2026-02-19", building: "모던하우스", room: "202", content: "현관 조명 깜빡임", detail: "센서등 깜빡임, 센서 모듈 불량 추정", priority: "낮음", assignee: "나호용 차장", status: "대기", category: "전기", paid: "무상", cost: 0, vendor: "", photoBefore: "", photoAfter: "", steps: [
    { date: "2026-02-19", action: "접수", note: "순회 중 발견" },
  ]},
];
