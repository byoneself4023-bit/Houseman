import { tenants } from './tenants';
import { vacancies } from './vacancies';
import { buildings } from './buildings';

export const roomStatusMap = {};
tenants.forEach(t => { roomStatusMap[`${t.building}_${t.room}`] = { status: t.status, name: t.name, overdue: t.overdue }; });
vacancies.forEach(v => { roomStatusMap[`${v.building}_${v.room}`] = { status: "공실", name: "", type: v.type, days: v.days }; });
export const patrolBuildings = buildings.map(b => {
  const freqMap = { "스타빌": 4, "다존하우스": 4, "미래홈": 4, "한스텔": 4, "모던라이프": 4, "에덴빌": 1, "토브미하우스": 1, "풍림빌딩": 1, "신림프리미어": 3, "아페이론": 3, "제이앤제이": 2, "포유빌": 2, "굿모닝빌": 2, "W하우스": 2, "모닝빌": 2, "지앤지2": 2, "서연빌": 1, "어반그레이": 1 };
  const assigneeMap = { "제이앤제이": "나호용 차장", "스타빌": "나호용 차장", "아페이론": "유인식 과장", "다존하우스": "유인식 과장", "W하우스": "나호용 차장", "포유빌": "유인식 과장", "미래홈": "나호용 차장", "굿모닝빌": "유인식 과장", "모닝빌": "나호용 차장", "에덴빌": "이재혁 사원", "와이원빈티지": "나호용 차장", "한스텔": "이재혁 사원", "지앤지2": "나호용 차장", "풍림빌딩": "나호용 차장", "토브미하우스": "이재혁 사원", "모던하우스": "이재혁 사원", "모던라이프": "나호용 차장", "리트코하우스": "유인식 과장", "메종빌": "이재혁 사원", "서우하우스": "유인식 과장", "제이에스하우스": "이재혁 사원", "신림프리미어": "나호용 차장", "더힐하우스101동": "유인식 과장", "더힐하우스102동": "유인식 과장", "더힐하우스103동": "이재혁 사원", "더힐하우스104동": "이재혁 사원", "옥당빌라": "나호용 차장", "우영빌딩": "유인식 과장", "우진빌딩": "유인식 과장", "문화빌딩": "유인식 과장", "어반그레이": "이재혁 사원", "서연빌": "이재혁 사원", "대치칼텍빌딩": "이재혁 사원", "집현전빌딩": "유인식 과장", "이례빌딩": "유인식 과장", "양지빌딩": "나호용 차장", "상건빌딩": "나호용 차장", "미진빌딩": "나호용 차장", "유석빌딩": "이재혁 사원", "에이스빌딩": "이재혁 사원", "KMC코리아": "유인식 과장", "평해빌딩": "이재혁 사원" };
  const doneMap = {
    // 월4회 (7일주기, 3일전=녹색)
    "스타빌": { dates: ["2026-02-03","2026-02-10","2026-02-17"], status: "이상발견" },
    "다존하우스": { dates: ["2026-02-01","2026-02-08","2026-02-14"], status: "정상" },
    "미래홈": { dates: ["2026-02-07","2026-02-17"], status: "이상발견" },
    "한스텔": { dates: ["2026-02-08","2026-02-16"], status: "이상발견" },
    "모던라이프": { dates: ["2026-02-06","2026-02-13","2026-02-20"], status: "정상" },
    // 월3회 (9일주기, 7일전=녹색)
    "신림프리미어": { dates: ["2026-02-04","2026-02-13"], status: "정상" },
    "아페이론": { dates: ["2026-02-08","2026-02-16"], status: "정상" },
    // 월2회 (14일주기, 7일전=녹색)
    "제이앤제이": { dates: ["2026-02-05"], status: "정상" },
    "포유빌": { dates: ["2026-02-12"], status: "정상" },
    "굿모닝빌": { dates: ["2026-02-16"], status: "정상" },
    "W하우스": { dates: ["2026-02-14"], status: "정상" },
    "모닝빌": { dates: ["2026-02-19"], status: "정상" },
    "지앤지2": { dates: ["2026-02-02"], status: "정상" },
    "와이원빈티지": { dates: ["2026-02-18"], status: "정상" },
    "모던하우스": { dates: ["2026-02-09"], status: "정상" },
    "리트코하우스": { dates: ["2026-02-15"], status: "이상발견" },
    // 월1회 (28일주기, 7일전=녹색)
    "에덴빌": { dates: ["2026-02-01"], status: "정상" },
    "토브미하우스": { dates: ["2026-01-28"], status: "정상" },
    "풍림빌딩": { dates: ["2026-01-20"], status: "이상발견" },
    "서연빌": { dates: ["2026-02-10"], status: "정상" },
    "어반그레이": { dates: ["2026-02-20"], status: "정상" },
  };
  const freq = freqMap[b.name] || 1;
  const record = doneMap[b.name];
  const assignee = assigneeMap[b.name] || "미배정";
  return { building: b.name, freq, assignee, doneCount: record ? record.dates.length : 0, lastDate: record ? record.dates[record.dates.length - 1] : null, lastStatus: record ? record.status : null };
});

export const patrolRecords = [
  { id: 1, building: "스타빌", date: "2026-02-17", assignee: "나호용 차장", status: "이상발견", comment: "3층 복도 조명 2개 불량, 옥상 방수 균열 발견. 긴급 보수 필요.", photos: Array.from({length:32}, (_,i) => `스타빌_0217_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 7, building: "스타빌", date: "2026-02-10", assignee: "나호용 차장", status: "정상", comment: "전체 순회 완료. 공용부 청소 양호, 엘리베이터 정상 작동. 옥상 배수구 점검 이상 없음.", photos: Array.from({length:25}, (_,i) => `스타빌_0210_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 8, building: "스타빌", date: "2026-02-03", assignee: "나호용 차장", status: "정상", comment: "1~5층 복도, 계단, 옥상 점검 완료. 특이사항 없음. 소화기 점검 정상.", photos: Array.from({length:28}, (_,i) => `스타빌_0203_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 9, building: "스타빌", date: "2026-01-27", assignee: "나호용 차장", status: "이상발견", comment: "지하 주차장 LED 3개 깜빡임 증상. 2층 복도 벽면 페인트 박리 시작. 업체 수리 요청 예정.", photos: Array.from({length:30}, (_,i) => `스타빌_0127_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 10, building: "스타빌", date: "2026-01-20", assignee: "나호용 차장", status: "정상", comment: "전 구역 정상. 지난주 지적사항(5층 비상등) 교체 완료 확인.", photos: Array.from({length:22}, (_,i) => `스타빌_0120_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 11, building: "스타빌", date: "2026-01-13", assignee: "나호용 차장", status: "정상", comment: "동절기 배관 동파 점검. 보일러실 정상, 옥상 물탱크 정상. 공용현관 도어클로저 조정.", photos: Array.from({length:26}, (_,i) => `스타빌_0113_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 2, building: "미래홈", date: "2026-02-17", assignee: "나호용 차장", status: "이상발견", comment: "지하 주차장 배수구 막힘. 외벽 페인트 박리 진행중.", photos: Array.from({length:28}, (_,i) => `미래홈_0217_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 3, building: "한스텔", date: "2026-02-16", assignee: "이재혁 사원", status: "이상발견", comment: "2층 공용화장실 수전 누수. CCTV 3번 카메라 화면 흐림.", photos: Array.from({length:35}, (_,i) => `한스텔_0216_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 4, building: "모던라이프", date: "2026-02-18", assignee: "나호용 차장", status: "정상", comment: "전체적으로 양호. 공용부 청소 상태 깨끗함.", photos: Array.from({length:30}, (_,i) => `모던라이프_0218_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 5, building: "굿모닝빌", date: "2026-02-16", assignee: "유인식 과장", status: "정상", comment: "정상 순회 완료. 특이사항 없음.", photos: Array.from({length:25}, (_,i) => `굿모닝빌_0216_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 6, building: "아페이론", date: "2026-02-16", assignee: "유인식 과장", status: "정상", comment: "정상 순회 완료. 엘리베이터 정기점검 필요 알림.", photos: Array.from({length:22}, (_,i) => `아페이론_0216_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 12, building: "아페이론", date: "2026-02-08", assignee: "유인식 과장", status: "이상발견", comment: "1층 로비 타일 깨짐 2곳. 지하 소화전 호스 노후 교체 필요. CCTV 6번 각도 틀어짐.", photos: Array.from({length:27}, (_,i) => `아페이론_0208_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 13, building: "아페이론", date: "2026-01-31", assignee: "유인식 과장", status: "정상", comment: "전층 순회 완료. 공용부 정상, 주차장 조명 교체 확인.", photos: Array.from({length:24}, (_,i) => `아페이론_0131_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 14, building: "아페이론", date: "2026-01-23", assignee: "유인식 과장", status: "정상", comment: "옥상 방수 상태 양호. 비상계단 손잡이 볼트 조임. 쓰레기 분리수거 상태 양호.", photos: Array.from({length:20}, (_,i) => `아페이론_0123_${String(i+1).padStart(2,"0")}.jpg`) },
  { id: 15, building: "아페이론", date: "2026-01-15", assignee: "유인식 과장", status: "정상", comment: "동절기 점검. 배관 보온재 상태 양호. 보일러실 가스 누출 점검 정상.", photos: Array.from({length:23}, (_,i) => `아페이론_0115_${String(i+1).padStart(2,"0")}.jpg`) },
];
