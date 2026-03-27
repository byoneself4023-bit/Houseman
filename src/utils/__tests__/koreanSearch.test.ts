import { describe, it, expect } from 'vitest';
import { getChosung, matchKorean } from '../koreanSearch';

describe('getChosung', () => {
  it('extracts initial consonants from Korean text', () => {
    expect(getChosung('한지우')).toBe('ㅎㅈㅇ');
  });

  it('passes through non-Korean characters', () => {
    expect(getChosung('abc')).toBe('abc');
  });
});

describe('matchKorean', () => {
  it('returns true for empty query', () => {
    expect(matchKorean('anything', '')).toBe(true);
  });

  it('matches full text substring', () => {
    expect(matchKorean('스타빌', '스타')).toBe(true);
  });

  it('matches chosung search', () => {
    expect(matchKorean('스타빌', 'ㅅㅌ')).toBe(true);
  });

  it('returns false for non-matching query', () => {
    expect(matchKorean('스타빌', '제이앤')).toBe(false);
  });

  it('is case insensitive for latin', () => {
    expect(matchKorean('ABC', 'abc')).toBe(true);
  });
});
