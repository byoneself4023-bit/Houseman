import { describe, it, expect } from 'vitest';
import { fmt, feeLabel } from '../helpers';
import type { Building } from '../../types';

describe('fmt', () => {
  it('formats number with Korean locale', () => {
    expect(fmt(1000000)).toBe('1,000,000');
  });

  it('returns "0" for null', () => {
    expect(fmt(null)).toBe('0');
  });

  it('returns "0" for undefined', () => {
    expect(fmt(undefined)).toBe('0');
  });

  it('handles zero', () => {
    expect(fmt(0)).toBe('0');
  });
});

describe('feeLabel', () => {
  it('returns percentage label for pct feeType', () => {
    const building: Building = {
      name: '스타빌',
      rooms: 16,
      occupied: 16,
      type: '단기',
      feeType: 'pct',
      fee: 0.05,
      fixedFee: 0,
      special: null,
      parkingTotal: 8,
    };
    expect(feeLabel(building)).toBe('수수료 5.0%');
  });

  it('returns fixed fee label for fixed feeType', () => {
    const building: Building = {
      name: 'test',
      rooms: 5,
      occupied: 5,
      type: '단기',
      feeType: 'fixed',
      fee: 0,
      fixedFee: 100000,
      special: null,
      parkingTotal: 0,
    };
    expect(feeLabel(building)).toBe('정액 100,000원/월');
  });

  it('returns empty string for zero fee', () => {
    const building: Building = {
      name: 'test',
      rooms: 5,
      occupied: 5,
      type: '단기',
      feeType: 'pct',
      fee: 0,
      fixedFee: 0,
      special: null,
      parkingTotal: 0,
    };
    expect(feeLabel(building)).toBe('');
  });
});
