import { describe, it, expect } from 'vitest';
import { getStatusAt } from '../src/lookup';
import type { StatusList } from '../src/types';

function listFromBytes(bytes: number[], bitsPerStatus: number): StatusList {
  return {
    format: 'jwt',
    issuer: 'https://issuer.example',
    statusListBits: new Uint8Array(bytes),
    bitsPerStatus,
  };
}

describe('getStatusAt (1-bit)', () => {
  // 0xA0 = 1010 0000 → indices 0..7 → 1,0,1,0, 0,0,0,0
  const list = listFromBytes([0xa0], 1);

  it.each([
    [0, 1],
    [1, 0],
    [2, 1],
    [3, 0],
    [7, 0],
  ])('index %i returns %i', (index, expected) => {
    expect(getStatusAt(list, index)).toBe(expected);
  });

  it('throws on out-of-bounds index', () => {
    expect(() => getStatusAt(list, 8)).toThrow(/out of range/);
  });

  it('throws on negative index', () => {
    expect(() => getStatusAt(list, -1)).toThrow(/non-negative integer/);
  });
});

describe('getStatusAt (2-bit)', () => {
  // 0x6C = 01 10 11 00 → indices 0..3 → 1, 2, 3, 0
  const list = listFromBytes([0x6c], 2);

  it.each([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ])('index %i returns %i', (index, expected) => {
    expect(getStatusAt(list, index)).toBe(expected);
  });
});

describe('getStatusAt (8-bit)', () => {
  it('returns the byte directly', () => {
    const list = listFromBytes([0x05, 0xff, 0x00], 8);
    expect(getStatusAt(list, 0)).toBe(0x05);
    expect(getStatusAt(list, 1)).toBe(0xff);
    expect(getStatusAt(list, 2)).toBe(0x00);
  });
});

describe('getStatusAt (invalid bitsPerStatus)', () => {
  it('rejects bitsPerStatus = 3', () => {
    const list = listFromBytes([0x00], 3);
    expect(() => getStatusAt(list, 0)).toThrow(/bitsPerStatus/);
  });
});
