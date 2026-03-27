// 한글 초성 검색 유틸리티
export const CHOSUNG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

export const getChosung = (str: string): string =>
  [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      return code >= 0 && code <= 11171 ? CHOSUNG[Math.floor(code / 588)] : ch;
    })
    .join('');

export const matchKorean = (target: string, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true; // 일반 포함 검색
  // 초성 검색: query가 모두 자음이면 초성 매칭
  const isChosung = [...q].every((c) => CHOSUNG.includes(c));
  if (isChosung) return getChosung(t).includes(q);
  // 부분 초성: 각 글자별로 초성 또는 글자 매칭
  const tCho = getChosung(t);
  for (let i = 0; i <= t.length - q.length; i++) {
    let match = true;
    for (let j = 0; j < q.length; j++) {
      const qc = q[j],
        tc = t[i + j],
        tcc = tCho[i + j];
      if (qc !== tc && qc !== tcc) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
};
