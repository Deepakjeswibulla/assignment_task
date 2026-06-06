import { describe, it, expect } from 'vitest';
import {
  computeEqualSplits,
  computeUnequalSplits,
  computePercentageSplits,
  computeShareSplits,
  computeSplits,
} from '@/lib/splits';

describe('computeEqualSplits', () => {
  it('splits evenly and assigns remainder to payer', () => {
    const result = computeEqualSplits(10, ['a', 'b', 'c'], 'a');
    const sum = result.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBe(10);
    expect(result.find((r) => r.userId === 'a')!.amount).toBe(3.34);
  });
});

describe('computeUnequalSplits', () => {
  it('accepts exact amounts', () => {
    const result = computeUnequalSplits(100, [
      { userId: 'a', value: 60 },
      { userId: 'b', value: 40 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(60);
  });

  it('rejects wrong sum', () => {
    expect(() =>
      computeUnequalSplits(100, [
        { userId: 'a', value: 50 },
        { userId: 'b', value: 40 },
      ])
    ).toThrow();
  });
});

describe('computePercentageSplits', () => {
  it('splits by percentage', () => {
    const result = computePercentageSplits(
      100,
      [
        { userId: 'a', value: 50 },
        { userId: 'b', value: 50 },
      ],
      'a'
    );
    const sum = result.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBe(100);
  });

  it('rejects percentages not summing to 100', () => {
    expect(() =>
      computePercentageSplits(100, [{ userId: 'a', value: 30 }], 'a')
    ).toThrow();
  });
});

describe('computeShareSplits', () => {
  it('splits by share ratio 2:1:1', () => {
    const result = computeShareSplits(
      100,
      [
        { userId: 'a', value: 2 },
        { userId: 'b', value: 1 },
        { userId: 'c', value: 1 },
      ],
      'a'
    );
    const sum = result.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBe(100);
    expect(result.find((r) => r.userId === 'a')!.amount).toBe(50);
  });
});

describe('computeSplits', () => {
  it('dispatches equal mode', () => {
    const result = computeSplits('EQUAL', 30, [{ userId: 'a' }, { userId: 'b' }], 'a');
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(30);
  });
});
