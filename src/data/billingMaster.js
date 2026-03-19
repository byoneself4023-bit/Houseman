// 전기 고객번호 → 호실 매핑 (공과금청구 시트 F열 기반)
// 스타빌: 2호실이 1개 고객번호 공유 (스타빌전기 시트 기반)
export const elecCustomerMap = {
  // 제이앤제이
  "01-1331-7839": [{ b: "제이앤제이", r: "B01" }],
  "01-1331-7840": [{ b: "제이앤제이", r: "201" }],
  "01-1331-7841": [{ b: "제이앤제이", r: "301" }],
  "01-1331-7842": [{ b: "제이앤제이", r: "401" }],
  // 스타빌 — 2호실 공유
  "01-1015-7856": [{ b: "스타빌", r: "101", share: 0.5 }, { b: "스타빌", r: "102", share: 0.5 }],
  "01-1015-7857": [{ b: "스타빌", r: "103", share: 0.5 }, { b: "스타빌", r: "105", share: 0.5 }],
  "01-1015-7858": [{ b: "스타빌", r: "201", share: 0.5 }, { b: "스타빌", r: "202", share: 0.5 }],
  "01-1015-7859": [{ b: "스타빌", r: "203", share: 0.5 }, { b: "스타빌", r: "205", share: 0.5 }],
  "01-1015-7860": [{ b: "스타빌", r: "301", share: 0.5 }, { b: "스타빌", r: "302", share: 0.5 }],
  "01-1015-7861": [{ b: "스타빌", r: "303", share: 0.5 }, { b: "스타빌", r: "305", share: 0.5 }],
  "01-1015-7862": [{ b: "스타빌", r: "401", share: 0.5 }, { b: "스타빌", r: "402", share: 0.5 }],
  "01-1015-7863": [{ b: "스타빌", r: "403", share: 0.5 }, { b: "스타빌", r: "405", share: 0.5 }],
  // 아페이론
  "02-3110-5501": [{ b: "아페이론", r: "101" }],
  "02-3110-5502": [{ b: "아페이론", r: "102" }],
  "02-3110-5503": [{ b: "아페이론", r: "103" }],
  "02-3110-5504": [{ b: "아페이론", r: "104" }],
  "02-3110-5505": [{ b: "아페이론", r: "105" }],
  "02-3110-5506": [{ b: "아페이론", r: "201" }],
  "02-3110-5507": [{ b: "아페이론", r: "202" }],
  "02-3110-5508": [{ b: "아페이론", r: "203" }],
  "02-3110-5509": [{ b: "아페이론", r: "204" }],
  "02-3110-5510": [{ b: "아페이론", r: "205" }],
};

// 가스 호실고유값 → 건물+호실 매핑 (가스수식.xlsx 기반)
// 형식: "건물명+호실" (예: "W하우스301")
export const gasCodeMap = {
  // W하우스 (15실)
  "W하우스301": { b: "W하우스", r: "301" }, "W하우스302": { b: "W하우스", r: "302" }, "W하우스303": { b: "W하우스", r: "303" },
  "W하우스304": { b: "W하우스", r: "304" }, "W하우스305": { b: "W하우스", r: "305" }, "W하우스401": { b: "W하우스", r: "401" },
  "W하우스402": { b: "W하우스", r: "402" }, "W하우스403": { b: "W하우스", r: "403" }, "W하우스501": { b: "W하우스", r: "501" },
  "W하우스502": { b: "W하우스", r: "502" }, "W하우스503": { b: "W하우스", r: "503" }, "W하우스601": { b: "W하우스", r: "601" },
  "W하우스602": { b: "W하우스", r: "602" }, "W하우스603": { b: "W하우스", r: "603" }, "W하우스7층": { b: "W하우스", r: "7층" },
  // 굿모닝빌 (12실)
  "굿모닝빌201": { b: "굿모닝빌", r: "201" }, "굿모닝빌202": { b: "굿모닝빌", r: "202" }, "굿모닝빌203": { b: "굿모닝빌", r: "203" },
  "굿모닝빌204": { b: "굿모닝빌", r: "204" }, "굿모닝빌301": { b: "굿모닝빌", r: "301" }, "굿모닝빌302": { b: "굿모닝빌", r: "302" },
  "굿모닝빌303": { b: "굿모닝빌", r: "303" }, "굿모닝빌304": { b: "굿모닝빌", r: "304" }, "굿모닝빌401": { b: "굿모닝빌", r: "401" },
  "굿모닝빌402": { b: "굿모닝빌", r: "402" }, "굿모닝빌501": { b: "굿모닝빌", r: "501" }, "굿모닝빌502": { b: "굿모닝빌", r: "502" },
  // 다존하우스 (33실)
  "다존하우스201": { b: "다존하우스", r: "201" }, "다존하우스202": { b: "다존하우스", r: "202" }, "다존하우스203": { b: "다존하우스", r: "203" },
  "다존하우스205": { b: "다존하우스", r: "205" }, "다존하우스206": { b: "다존하우스", r: "206" }, "다존하우스207": { b: "다존하우스", r: "207" },
  "다존하우스208": { b: "다존하우스", r: "208" }, "다존하우스209": { b: "다존하우스", r: "209" }, "다존하우스210": { b: "다존하우스", r: "210" },
  "다존하우스301": { b: "다존하우스", r: "301" }, "다존하우스302": { b: "다존하우스", r: "302" }, "다존하우스303": { b: "다존하우스", r: "303" },
  "다존하우스305": { b: "다존하우스", r: "305" }, "다존하우스306": { b: "다존하우스", r: "306" }, "다존하우스307": { b: "다존하우스", r: "307" },
  "다존하우스308": { b: "다존하우스", r: "308" }, "다존하우스309": { b: "다존하우스", r: "309" }, "다존하우스310": { b: "다존하우스", r: "310" },
  "다존하우스501": { b: "다존하우스", r: "501" }, "다존하우스502": { b: "다존하우스", r: "502" }, "다존하우스503": { b: "다존하우스", r: "503" },
  "다존하우스505": { b: "다존하우스", r: "505" }, "다존하우스506": { b: "다존하우스", r: "506" }, "다존하우스507": { b: "다존하우스", r: "507" },
  "다존하우스508": { b: "다존하우스", r: "508" }, "다존하우스509": { b: "다존하우스", r: "509" }, "다존하우스510": { b: "다존하우스", r: "510" },
  "다존하우스601": { b: "다존하우스", r: "601" }, "다존하우스602": { b: "다존하우스", r: "602" }, "다존하우스603": { b: "다존하우스", r: "603" },
  "다존하우스605": { b: "다존하우스", r: "605" }, "다존하우스606": { b: "다존하우스", r: "606" }, "다존하우스607": { b: "다존하우스", r: "607" },
  // 리트코하우스 (18실)
  "리트코하우스501": { b: "리트코하우스", r: "501" }, "리트코하우스502": { b: "리트코하우스", r: "502" }, "리트코하우스503": { b: "리트코하우스", r: "503" },
  "리트코하우스504": { b: "리트코하우스", r: "504" }, "리트코하우스505": { b: "리트코하우스", r: "505" }, "리트코하우스506": { b: "리트코하우스", r: "506" },
  "리트코하우스601": { b: "리트코하우스", r: "601" }, "리트코하우스602": { b: "리트코하우스", r: "602" }, "리트코하우스603": { b: "리트코하우스", r: "603" },
  "리트코하우스604": { b: "리트코하우스", r: "604" }, "리트코하우스605": { b: "리트코하우스", r: "605" }, "리트코하우스606": { b: "리트코하우스", r: "606" },
  "리트코하우스701": { b: "리트코하우스", r: "701" }, "리트코하우스702": { b: "리트코하우스", r: "702" }, "리트코하우스703": { b: "리트코하우스", r: "703" },
  "리트코하우스704": { b: "리트코하우스", r: "704" }, "리트코하우스705": { b: "리트코하우스", r: "705" }, "리트코하우스706": { b: "리트코하우스", r: "706" },
  // 메종빌 (16실)
  "메종빌101": { b: "메종빌", r: "101" }, "메종빌201": { b: "메종빌", r: "201" }, "메종빌202": { b: "메종빌", r: "202" },
  "메종빌203": { b: "메종빌", r: "203" }, "메종빌301": { b: "메종빌", r: "301" }, "메종빌302": { b: "메종빌", r: "302" },
  "메종빌303": { b: "메종빌", r: "303" }, "메종빌401": { b: "메종빌", r: "401" }, "메종빌402": { b: "메종빌", r: "402" },
  "메종빌403": { b: "메종빌", r: "403" }, "메종빌501": { b: "메종빌", r: "501" }, "메종빌502": { b: "메종빌", r: "502" },
  "메종빌503": { b: "메종빌", r: "503" }, "메종빌601": { b: "메종빌", r: "601" }, "메종빌602": { b: "메종빌", r: "602" },
  "메종빌603": { b: "메종빌", r: "603" },
  // 모닝빌 (14실)
  "모닝빌201": { b: "모닝빌", r: "201" }, "모닝빌202": { b: "모닝빌", r: "202" }, "모닝빌203": { b: "모닝빌", r: "203" },
  "모닝빌204": { b: "모닝빌", r: "204" }, "모닝빌205": { b: "모닝빌", r: "205" }, "모닝빌301": { b: "모닝빌", r: "301" },
  "모닝빌302": { b: "모닝빌", r: "302" }, "모닝빌304": { b: "모닝빌", r: "304" }, "모닝빌305": { b: "모닝빌", r: "305" },
  "모닝빌401": { b: "모닝빌", r: "401" }, "모닝빌402": { b: "모닝빌", r: "402" }, "모닝빌403": { b: "모닝빌", r: "403" },
  "모닝빌404": { b: "모닝빌", r: "404" }, "모닝빌405": { b: "모닝빌", r: "405" },
  // 모던라이프 (16실)
  "모던라이프201": { b: "모던라이프", r: "201" }, "모던라이프202": { b: "모던라이프", r: "202" }, "모던라이프203": { b: "모던라이프", r: "203" },
  "모던라이프204": { b: "모던라이프", r: "204" }, "모던라이프301": { b: "모던라이프", r: "301" }, "모던라이프302": { b: "모던라이프", r: "302" },
  "모던라이프303": { b: "모던라이프", r: "303" }, "모던라이프304": { b: "모던라이프", r: "304" }, "모던라이프401": { b: "모던라이프", r: "401" },
  "모던라이프402": { b: "모던라이프", r: "402" }, "모던라이프403": { b: "모던라이프", r: "403" }, "모던라이프404": { b: "모던라이프", r: "404" },
  "모던라이프501": { b: "모던라이프", r: "501" }, "모던라이프502": { b: "모던라이프", r: "502" }, "모던라이프503": { b: "모던라이프", r: "503" },
  "모던라이프601": { b: "모던라이프", r: "601" },
  // 모던하우스 (19실)
  "모던하우스201": { b: "모던하우스", r: "201" }, "모던하우스202": { b: "모던하우스", r: "202" }, "모던하우스203": { b: "모던하우스", r: "203" },
  "모던하우스204": { b: "모던하우스", r: "204" }, "모던하우스205": { b: "모던하우스", r: "205" }, "모던하우스301": { b: "모던하우스", r: "301" },
  "모던하우스302": { b: "모던하우스", r: "302" }, "모던하우스303": { b: "모던하우스", r: "303" }, "모던하우스304": { b: "모던하우스", r: "304" },
  "모던하우스305": { b: "모던하우스", r: "305" }, "모던하우스401": { b: "모던하우스", r: "401" }, "모던하우스402": { b: "모던하우스", r: "402" },
  "모던하우스403": { b: "모던하우스", r: "403" }, "모던하우스404": { b: "모던하우스", r: "404" }, "모던하우스405": { b: "모던하우스", r: "405" },
  "모던하우스501": { b: "모던하우스", r: "501" }, "모던하우스502": { b: "모던하우스", r: "502" }, "모던하우스503": { b: "모던하우스", r: "503" },
  "모던하우스504": { b: "모던하우스", r: "504" },
  // 미래홈 (23실)
  "미래홈101": { b: "미래홈", r: "101" }, "미래홈102": { b: "미래홈", r: "102" }, "미래홈103": { b: "미래홈", r: "103" },
  "미래홈104": { b: "미래홈", r: "104" }, "미래홈105": { b: "미래홈", r: "105" }, "미래홈106": { b: "미래홈", r: "106" },
  "미래홈107": { b: "미래홈", r: "107" }, "미래홈201": { b: "미래홈", r: "201" }, "미래홈202": { b: "미래홈", r: "202" },
  "미래홈203": { b: "미래홈", r: "203" }, "미래홈204": { b: "미래홈", r: "204" }, "미래홈205": { b: "미래홈", r: "205" },
  "미래홈301": { b: "미래홈", r: "301" }, "미래홈302": { b: "미래홈", r: "302" }, "미래홈303": { b: "미래홈", r: "303" },
  "미래홈304": { b: "미래홈", r: "304" }, "미래홈305": { b: "미래홈", r: "305" }, "미래홈401": { b: "미래홈", r: "401" },
  "미래홈402": { b: "미래홈", r: "402" }, "미래홈403": { b: "미래홈", r: "403" }, "미래홈404": { b: "미래홈", r: "404" },
  "미래홈405": { b: "미래홈", r: "405" }, "미래홈501": { b: "미래홈", r: "501" },
  // 서우하우스 (4실)
  "서우하우스301": { b: "서우하우스", r: "301" }, "서우하우스302": { b: "서우하우스", r: "302" },
  "서우하우스401": { b: "서우하우스", r: "401" }, "서우하우스402": { b: "서우하우스", r: "402" },
  // 스타빌 (16실)
  "스타빌101": { b: "스타빌", r: "101" }, "스타빌102": { b: "스타빌", r: "102" }, "스타빌103": { b: "스타빌", r: "103" },
  "스타빌105": { b: "스타빌", r: "105" }, "스타빌201": { b: "스타빌", r: "201" }, "스타빌202": { b: "스타빌", r: "202" },
  "스타빌203": { b: "스타빌", r: "203" }, "스타빌205": { b: "스타빌", r: "205" }, "스타빌301": { b: "스타빌", r: "301" },
  "스타빌302": { b: "스타빌", r: "302" }, "스타빌303": { b: "스타빌", r: "303" }, "스타빌305": { b: "스타빌", r: "305" },
  "스타빌401": { b: "스타빌", r: "401" }, "스타빌402": { b: "스타빌", r: "402" }, "스타빌403": { b: "스타빌", r: "403" },
  "스타빌405": { b: "스타빌", r: "405" },
  // 아페이론 (10실)
  "아페이론101": { b: "아페이론", r: "101" }, "아페이론102": { b: "아페이론", r: "102" }, "아페이론103": { b: "아페이론", r: "103" },
  "아페이론104": { b: "아페이론", r: "104" }, "아페이론105": { b: "아페이론", r: "105" }, "아페이론201": { b: "아페이론", r: "201" },
  "아페이론202": { b: "아페이론", r: "202" }, "아페이론203": { b: "아페이론", r: "203" }, "아페이론204": { b: "아페이론", r: "204" },
  "아페이론205": { b: "아페이론", r: "205" },
  // 에덴빌 (9실)
  "에덴빌102": { b: "에덴빌", r: "102" }, "에덴빌201": { b: "에덴빌", r: "201" }, "에덴빌202": { b: "에덴빌", r: "202" },
  "에덴빌203": { b: "에덴빌", r: "203" }, "에덴빌204": { b: "에덴빌", r: "204" }, "에덴빌301": { b: "에덴빌", r: "301" },
  "에덴빌302": { b: "에덴빌", r: "302" }, "에덴빌303": { b: "에덴빌", r: "303" }, "에덴빌304": { b: "에덴빌", r: "304" },
  // 옥당빌라 (10실)
  "옥당빌라101": { b: "옥당빌라", r: "101" }, "옥당빌라102": { b: "옥당빌라", r: "102" }, "옥당빌라103": { b: "옥당빌라", r: "103" },
  "옥당빌라201": { b: "옥당빌라", r: "201" }, "옥당빌라202": { b: "옥당빌라", r: "202" }, "옥당빌라203": { b: "옥당빌라", r: "203" },
  "옥당빌라301": { b: "옥당빌라", r: "301" }, "옥당빌라302": { b: "옥당빌라", r: "302" }, "옥당빌라303": { b: "옥당빌라", r: "303" },
  "옥당빌라401": { b: "옥당빌라", r: "401" },
  // 와이원빈티지 (14실)
  "와이원빈티지201": { b: "와이원빈티지", r: "201" }, "와이원빈티지202": { b: "와이원빈티지", r: "202" }, "와이원빈티지203": { b: "와이원빈티지", r: "203" },
  "와이원빈티지204": { b: "와이원빈티지", r: "204" }, "와이원빈티지301": { b: "와이원빈티지", r: "301" }, "와이원빈티지302": { b: "와이원빈티지", r: "302" },
  "와이원빈티지303": { b: "와이원빈티지", r: "303" }, "와이원빈티지304": { b: "와이원빈티지", r: "304" }, "와이원빈티지401": { b: "와이원빈티지", r: "401" },
  "와이원빈티지402": { b: "와이원빈티지", r: "402" }, "와이원빈티지403": { b: "와이원빈티지", r: "403" }, "와이원빈티지404": { b: "와이원빈티지", r: "404" },
  "와이원빈티지501": { b: "와이원빈티지", r: "501" }, "와이원빈티지502": { b: "와이원빈티지", r: "502" },
  // 제이앤제이 (4실)
  "제이앤제이B01": { b: "제이앤제이", r: "B01" }, "제이앤제이201": { b: "제이앤제이", r: "201" },
  "제이앤제이301": { b: "제이앤제이", r: "301" }, "제이앤제이401": { b: "제이앤제이", r: "401" },
  // 제이에스하우스 (6실)
  "제이에스하우스501": { b: "제이에스하우스", r: "501" }, "제이에스하우스502": { b: "제이에스하우스", r: "502" },
  "제이에스하우스503": { b: "제이에스하우스", r: "503" }, "제이에스하우스505": { b: "제이에스하우스", r: "505" },
  "제이에스하우스601": { b: "제이에스하우스", r: "601" }, "제이에스하우스602": { b: "제이에스하우스", r: "602" },
  // 지앤지2 (9실)
  "지앤지2201": { b: "지앤지2", r: "201" }, "지앤지2202": { b: "지앤지2", r: "202" }, "지앤지2203": { b: "지앤지2", r: "203" },
  "지앤지2204": { b: "지앤지2", r: "204" }, "지앤지2301": { b: "지앤지2", r: "301" }, "지앤지2302": { b: "지앤지2", r: "302" },
  "지앤지2303": { b: "지앤지2", r: "303" }, "지앤지2304": { b: "지앤지2", r: "304" }, "지앤지2401": { b: "지앤지2", r: "401" },
  // 토브미하우스 (8실)
  "토브미하우스201": { b: "토브미하우스", r: "201" }, "토브미하우스202": { b: "토브미하우스", r: "202" }, "토브미하우스203": { b: "토브미하우스", r: "203" },
  "토브미하우스301": { b: "토브미하우스", r: "301" }, "토브미하우스302": { b: "토브미하우스", r: "302" }, "토브미하우스303": { b: "토브미하우스", r: "303" },
  "토브미하우스401": { b: "토브미하우스", r: "401" }, "토브미하우스402": { b: "토브미하우스", r: "402" },
  // 포유빌 (9실)
  "포유빌101": { b: "포유빌", r: "101" }, "포유빌201": { b: "포유빌", r: "201" }, "포유빌202": { b: "포유빌", r: "202" },
  "포유빌301": { b: "포유빌", r: "301" }, "포유빌302": { b: "포유빌", r: "302" }, "포유빌401": { b: "포유빌", r: "401" },
  "포유빌402": { b: "포유빌", r: "402" }, "포유빌403": { b: "포유빌", r: "403" }, "포유빌501": { b: "포유빌", r: "501" },
  // 한스텔 (16실)
  "한스텔101": { b: "한스텔", r: "101" }, "한스텔102": { b: "한스텔", r: "102" }, "한스텔103": { b: "한스텔", r: "103" },
  "한스텔104": { b: "한스텔", r: "104" }, "한스텔201": { b: "한스텔", r: "201" }, "한스텔202": { b: "한스텔", r: "202" },
  "한스텔203": { b: "한스텔", r: "203" }, "한스텔204": { b: "한스텔", r: "204" }, "한스텔301": { b: "한스텔", r: "301" },
  "한스텔302": { b: "한스텔", r: "302" }, "한스텔303": { b: "한스텔", r: "303" }, "한스텔304": { b: "한스텔", r: "304" },
  "한스텔B01": { b: "한스텔", r: "B01" }, "한스텔B02": { b: "한스텔", r: "B02" },
  "한스텔B03": { b: "한스텔", r: "B03" }, "한스텔B04": { b: "한스텔", r: "B04" },
};

// 청구 유형: A = 단일계좌, B = 이중계좌 (계좌 분리 방식)
// 계좌 라우팅용 — accountConfig.js의 mode와 연동
export const billingTypeMap = {
  "제이앤제이": "A", // 단일계좌
  "스타빌": "B",     // 이중계좌
  "아페이론": "B",   // 이중계좌
  "다존하우스": "A",
  "미래홈": "A",
  "한스텔": "A",
  "모던라이프": "A",
};

// ── 청구 구성 유형 (3가지) ──
// 단기임대: 임대료 + 관리비 + 공과금 (항상 통합 청구, 분리 없음)
// 일반임대: 임대료 + 고정관리비 (기본), 변동관리비 추가 가능
// 근생: 방식A = 임대료+고정관리비+변동관리비 / 방식B = 고정관리비+변동관리비만 (임대료 제외)
export const billingComposition = {
  "단기": {
    items: ["rent", "mgmt", "utility"],
    label: "임대료+관리비+공과금 통합",
    timing: { daysBeforeDue: [7, 12] }, // 월세일 7~12일 전 청구
  },
  "일반임대": {
    items: ["rent", "mgmt"],
    optionalItems: ["variableMgmt"], // 변동관리비 (경우에 따라 추가)
    label: "임대료+고정관리비",
    timing: { daysBeforeDue: [0, 10] },
  },
  "근생": {
    // 방식A: 임대료+고정관리비+변동관리비 / 방식B: 고정관리비+변동관리비만
    methodA: { items: ["rent", "mgmt", "variableMgmt"], label: "임대료+고정관리비+변동관리비" },
    methodB: { items: ["mgmt", "variableMgmt"], label: "고정관리비+변동관리비 (임대료 제외)" },
    timing: { daysBeforeDue: [0, 10] },
  },
};

// 미납 판단 기준:
// - 청구 발생 전: 미납 아님 (roomBalances에 잔액 없음)
// - 월세일 이전: 청구됨, 납부 기한 이내
// - 월세일 당일~: 미납 체크 시작 (선불 구조)
// - 모든 청구는 담당자 확인 후 수동 발송 (완전 자동 발송 없음)

// 건물별 계좌 정보
export const buildingAccountMap = {
  _houseman: { bank: "하나", account: "225-910048-15704", holder: "박종호(하우스맨)" },
  "제이앤제이": { owner: null, manager: { bank: "하나", account: "225-910048-15704", holder: "박종호(하우스맨)" } },
  "스타빌": {
    owner: { bank: "국민", account: "012-34-5678901", holder: "스타빌건물주" },
    manager: { bank: "하나", account: "225-910048-15704", holder: "박종호(하우스맨)" },
  },
  "아페이론": {
    owner: { bank: "신한", account: "110-123-456789", holder: "아페이론건물주" },
    manager: { bank: "하나", account: "225-910048-15704", holder: "박종호(하우스맨)" },
  },
};

// 건물별 약어 (입금자명 안내용)
export const buildingAbbr = {
  "제이앤제이": "JJ",
  "스타빌": "SB",
  "아페이론": "AP",
  "다존하우스": "DZ",
  "미래홈": "MR",
  "한스텔": "HS",
  "모던라이프": "ML",
};

// 10원 단위 절사
export const truncate10 = (amount) => Math.floor(amount / 10) * 10;

// 연체수수료 계산 (납부기한 5일 초과 시 5%)
export const calcLateFee = (amount, dueDay) => {
  const today = new Date().getDate();
  const overdueDays = today - dueDay;
  if (overdueDays > 5) {
    return truncate10(Math.round(amount * 0.05));
  }
  return 0;
};

// ========== 건물주 정산서 마스터 ==========
// type: A=퍼센트형(HM→건물주), S=월급형(건물주→HM), F=월정액형, D=관리비수금형
// feeType: pct=퍼센트, salary=월급, fixed=고정, collection=수금
// direction: hm_to_owner / owner_to_hm
export const settlementMaster = {
  // ── A. 월세 퍼센트형 (HM계좌) ──
  "제이앤제이": { type: "A", feeType: "pct", feeRate: 0, direction: "hm_to_owner", settlementDay: 15, periodType: "mid", vat: false, address: "서울 관악구 제이앤제이빌라", ownerName: "박시현", notes: "수수료 없음. 누나 계좌로 정산." },
  "스타빌":     { type: "A", feeType: "pct", feeRate: 0.05, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 스타빌", notes: "" },
  "아페이론":   { type: "A", feeType: "pct", feeRate: 0.05, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 아페이론", notes: "예치금 별도 보관", frequency: "twice", dates: [22, 29] },
  "다존하우스": { type: "A", feeType: "pct", feeRate: 0.10, direction: "hm_to_owner", settlementDay: 21, periodType: "month", vat: true, address: "서울 관악구 다존하우스", notes: "관리비 분리, 월세만 10%", includeMgmt: false },
  "포유빌":     { type: "A", feeType: "pct", feeRate: 0.06, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 포유빌", notes: "정산계좌 2개", dualAccount: true, frequency: "twice", dates: [1, 15] },
  "미래홈":     { type: "A", feeType: "pct", feeRate: 0.10, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 미래홈", notes: "전세혼합, 중개수수료 캡쳐 필수첨부", includeMgmt: true },
  "메종빌":     { type: "A", feeType: "pct", feeRate: 0.06, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 메종빌", notes: "층별파일분리(1-4/5-6), 예치금 동별 차이", frequency: "twice", dates: [15, "말일"] },
  "리트코하우스": { type: "A", feeType: "pct", feeRate: 0.06, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 리트코하우스", notes: "주차요금 별도 컬럼" },
  "모닝빌":     { type: "A", feeType: "pct", feeRate: 0.063, direction: "hm_to_owner", settlementDay: "말일", periodType: "custom", customPeriod: { startDay: 20, endDay: -1 }, vat: true, address: "서울 관악구 모닝빌", notes: "관리비 없음", frequency: "twice", dates: [20, "말일"] },
  "에덴빌":     { type: "A", feeType: "pct", feeRate: 0.05, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 에덴빌", notes: "전세혼합, 무상AS기록", frequency: "twice", dates: [1, 20] },
  "지앤지2":    { type: "A", feeType: "pct", feeRate: 0.045, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 지앤지2", notes: "7일패널티 컬럼, 정산계좌 2개", dualAccount: true, frequency: "twice", dates: [10, 25] },
  "토브미하우스": { type: "A", feeType: "pct", feeRate: 0.05, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: true, vatMode: "end_of_month_only", address: "서울 관악구 토브미하우스", notes: "관리비 별도열, VAT 말일에만 반영", frequency: "twice", dates: [15, "말일"] },
  "서우하우스":  { type: "A", feeType: "pct", feeRate: 0.06, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 서우하우스", notes: "현금분할수령(비율 전화확인), 공용전기 50%, 예치금 2천만", cashSplit: true },
  "모던라이프": { type: "A", feeType: "pct", feeRate: 0.05, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 모던라이프", notes: "" },
  // ── A. 월세 퍼센트형 (건물주계좌) ──
  "와이원빈티지": { type: "A", feeType: "pct", feeRate: 0.06, direction: "hm_to_owner", accountType: "owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 와이원빈티지", notes: "건물주계좌 직접입금, 수수료만 HM에게" },
  "굿모닝빌":   { type: "A", feeType: "pct", feeRate: 0.06, direction: "hm_to_owner", accountType: "owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 굿모닝빌", notes: "건물주계좌, 수도/KT 별도열, 퇴실정산 건물주부담", includeMgmt: true, moveoutOwnerBurden: true },
  "한스텔":     { type: "A", feeType: "pct", feeRate: 0.05, direction: "hm_to_owner", accountType: "owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 한스텔", notes: "첨부 필수" },
  "모던하우스":  { type: "A", feeType: "pct", feeRate: 0.09, direction: "hm_to_owner", accountType: "owner", settlementDay: 20, periodType: "month", vat: false, address: "서울 관악구 모던하우스", notes: "건물주계좌, 별도퇴실정산서, 오입금처리" },
  // ── A. 혼합형 ──
  "W하우스":    { type: "A", feeType: "pct", feeRate: 0.06, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 강남구 W하우스", notes: "근생+단기 혼합, 층별계좌분리(1-2층 건물주/3-5층 HM)", hasCommercial: true },
  // ── B. 월정액형 ──
  "제이드하우스": { type: "F", feeType: "fixed", feeRate: 0, feeAmount: 1100000, feeAmountIncludesVat: true, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 옥당빌라", notes: "건물운영대행비 110만(VAT포함), 별도 임대현황표, 계산서 발행 필수" },
  "제이에스하우스": { type: "F", feeType: "hybrid", feeRate: 0.06, feeAmount: 400000, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 제이에스하우스", notes: "근생 40만 고정 + 단기 6% 이중구조, 상/하 2단분리", dualSection: true,
    hybridRules: [
      { unitType: "commercial", feeType: "fixed", feeAmount: 400000 },
      { unitType: "short_term", feeType: "pct", feeRate: 0.06 },
    ]
  },
  // ── C. 월급형 (건물주 → HM) ──
  "신림프리미어": { type: "S", feeType: "salary", feeRate: 0, feeAmount: 1500000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 신림프리미어", notes: "주택 월급형 (150만+α), 주차승강기 8만 포함, 주말퇴실정산, 주차전용임차인",
    subItems: [{ name: "주차승강기 관리비", amount: 80000, vendor: "" }]
  },
  "우영빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 600000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 우영빌딩", notes: "근생",
    subItems: [
      { name: "건물 청소비", amount: 220000, vendor: "" },
      { name: "소방안전관리비", amount: 90000, vendor: "" },
      { name: "승강기 유지보수", amount: 180000, vendor: "" },
      { name: "전기안전관리비", amount: 120000, vendor: "" },
    ]
  },
  "우진빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 400000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 우진빌딩", notes: "근생, 청구서 겸용, 공과금 배분비율표",
    subItems: [{ name: "건물 청소비", amount: 454000, vendor: "크린하우스" }]
  },
  "대치칼텍":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 500000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 강남구 대치칼텍빌딩", notes: "근생, 단순" },
  "서연빌":     { type: "S", feeType: "salary", feeRate: 0, feeAmount: 500000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 서연빌", notes: "근생+주거혼합, 전세비중높음, 별도퇴실정산서" },
  "문화빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 900000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 문화빌딩", notes: "근생, 청구서 폴더 있음" },
  "집현전빌딩": { type: "S", feeType: "salary", feeRate: 0, feeAmount: 600000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 집현전빌딩", notes: "근생(학원다수)",
    subItems: [{ name: "건물 청소비", amount: 300000, vendor: "" }]
  },
  "어반그레이":  { type: "S", feeType: "salary", feeRate: 0, feeAmount: 370000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "경기 남양주시 어반그레이", notes: "근생, 입주수에 따라 수수료 변동, 청소 포함", feeVariable: true },
  "이례빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 800000, direction: "owner_to_hm", settlementDay: 5, periodType: "month", vat: true, address: "서울 관악구 이례빌딩", notes: "근생, 옥상통신시설, 미납4컬럼분리, 청구서 있음" },
  "KMC코리아":  { type: "S", feeType: "salary", feeRate: 0, feeAmount: 1200000, direction: "owner_to_hm", settlementDay: 5, periodType: "month", vat: true, address: "서울 마포구 KMC코리아", notes: "근생대형(임대료 8,951만), 증빙자료 필수첨부",
    subItems: [
      { name: "건물 청소비", amount: 500000, vendor: "부자청소" },
      { name: "소방안전관리비", amount: 150000, vendor: "" },
      { name: "전기안전관리비", amount: 140000, vendor: "신한전기기술단" },
      { name: "기계식주차장 유지보수", amount: 220000, vendor: "(주)앱스" },
      { name: "엘리베이터 유지보수", amount: 200000, vendor: "TK엘리베이터" },
    ]
  },
  "양지빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 770000, feeAmountIncludesVat: true, direction: "owner_to_hm", settlementDay: 1, periodType: "month", vat: false, address: "서울 관악구 양지빌딩", notes: "근생, 자동이체(정산서합계 0원)", autoTransfer: true },
  "상건빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 600000, direction: "owner_to_hm", settlementDay: 5, periodType: "month", vat: true, address: "서울 중구 을지로 상건빌딩", notes: "근생대형, 전기/수도 별도 컬럼, 대규모미납",
    subItems: [{ name: "건물 청소비", amount: 250000, vendor: "크린하우스" }]
  },
  "미진빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 650000, direction: "owner_to_hm", settlementDay: 5, periodType: "month", vat: true, address: "서울 중구 을지로 미진빌딩", notes: "근생, 전기/수도 별도 컬럼",
    subItems: [
      { name: "건물 청소비", amount: 200000, vendor: "" },
      { name: "소방안전관리비", amount: 50000, vendor: "" },
    ]
  },
  "유석빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 600000, direction: "owner_to_hm", settlementDay: 5, periodType: "month", vat: true, address: "서울 중구 신당동 유석빌딩", notes: "근생+주거, 영수증시트 별도" },
  "에이스빌딩": { type: "S", feeType: "salary", feeRate: 0, feeAmount: 1400000, direction: "owner_to_hm", settlementDay: 5, periodType: "month", vat: true, address: "서울 구로구 에이스빌딩", notes: "근생대형(보증금15.4억), 관리비 호실별 상이",
    subItems: [
      { name: "건물 청소비", amount: 513000, vendor: "부자청소" },
      { name: "전기안전관리비", amount: 200000, vendor: "신한전기기술단" },
      { name: "승강기 유지보수", amount: 90000, vendor: "서울파킹" },
      { name: "주차장치 유지보수", amount: 120000, vendor: "서울파킹" },
      { name: "소방안전관리비", amount: 200000, vendor: "더세이프" },
    ]
  },
  "평해빌딩":   { type: "S", feeType: "salary", feeRate: 0, feeAmount: 750000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: true, address: "서울 관악구 평해빌딩", notes: "근생, 수도검침표 별도 관리" },
  // ── D. 관리비 수금형 ──
  "더힐하우스":  { type: "D", feeType: "collection", feeRate: 0, mgmtFeePerUnit: 90000, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 더힐하우스", notes: "4개동 44세대, 관리비 수금→비용 차감, 미납 매트릭스",
    costItems: [
      { name: "하우스맨 기본 관리비", amount: 1188000 },
      { name: "건물 청소", amount: 900000 },
      { name: "엘리베이터", amount: 320000 },
      { name: "화재/승강기 보험", amount: 94800 },
      { name: "전기 안전점검", amount: 80000 },
      { name: "CCTV인터넷 요금", amount: 55000 },
      { name: "엘리베이터 통신 요금", amount: 15540 },
    ]
  },
  // ── 기타 ──
  "이브릿지":   { type: "X", feeType: "fixed", feeRate: 0, feeAmount: 275000, direction: "owner_to_hm", settlementDay: "말일", periodType: "month", vat: false, address: "", notes: "시설물점검 대행만, 정산서 없음, 월2회 방문+보고서" },
  "풍림빌딩":   { type: "X", feeType: "none", feeRate: 0, direction: "none", settlementDay: "말일", periodType: "month", vat: false, address: "서울 관악구 풍림빌딩", notes: "청구서 작성 대행만, 임차인별 시트, 공과금 배분비율표" },
};

// 정산기간 계산
export const getSettlementPeriod = (building, year, month) => {
  const cfg = settlementMaster[building];
  if (!cfg) return { start: `${year}-${String(month).padStart(2,"0")}-01`, end: `${year}-${String(month).padStart(2,"0")}-${new Date(year, month, 0).getDate()}` };

  if (cfg.periodType === "mid") {
    // 전월 15일 ~ 당월 14일
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return { start: `${prevYear}-${String(prevMonth).padStart(2,"0")}-${cfg.settlementDay}`, end: `${year}-${String(month).padStart(2,"0")}-${cfg.settlementDay - 1}` };
  }
  if (cfg.periodType === "custom" && cfg.customPeriod) {
    // 모닝빌: 전월 20일 ~ 전월 말일
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    return { start: `${prevYear}-${String(prevMonth).padStart(2,"0")}-${cfg.customPeriod.startDay}`, end: `${prevYear}-${String(prevMonth).padStart(2,"0")}-${lastDay}` };
  }
  // month: 해당 월 전체
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${year}-${String(month).padStart(2,"0")}-01`, end: `${year}-${String(month).padStart(2,"0")}-${lastDay}` };
};

// 수수료 계산 (퍼센트형만 — 월급형은 정액이므로 호실별 계산 불필요)
export const calcFee = (rent, building) => {
  const cfg = settlementMaster[building];
  if (!cfg) return 0;
  if (cfg.feeType === "salary" || cfg.feeType === "fixed" || cfg.feeType === "collection" || cfg.feeType === "none") return 0;
  return Math.round(rent * (cfg.feeRate || 0));
};

// 퇴실 일할 계산
export const calcProRata = (rent, moveOutDay, rentDay, year, month) => {
  const totalDays = new Date(year, month, 0).getDate();
  const residenceDays = moveOutDay - (rentDay || 1) + 1;
  if (residenceDays <= 0 || residenceDays >= totalDays) return rent;
  return Math.round(rent * residenceDays / totalDays);
};

// 부가세 계산 (모닝빌 등)
export const calcVat = (amount, building) => {
  const cfg = settlementMaster[building];
  if (!cfg || !cfg.vat) return { supply: amount, tax: 0, total: amount };
  const supply = Math.round(amount / 1.1);
  const tax = amount - supply;
  return { supply, tax, total: amount };
};
