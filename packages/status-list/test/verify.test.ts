import { describe, it, expect } from 'vitest';
import { verifyStatusList } from '../src/verify';
import type { StatusList } from '../src/types';

const list: StatusList = {
  format: 'jwt',
  issuer: 'https://issuer.example',
  statusListBits: new Uint8Array([0x00]),
  bitsPerStatus: 1,
};

describe('verifyStatusList', () => {
  it('passes when no expected issuer is supplied', () => {
    const r = verifyStatusList(list);
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it('passes when the issuer matches', () => {
    const r = verifyStatusList(list, 'https://issuer.example');
    expect(r.ok).toBe(true);
  });

  it('fails when the issuer does not match', () => {
    const r = verifyStatusList(list, 'https://other.example');
    expect(r.ok).toBe(false);
    expect(r.reasons[0]).toContain('does not match expected');
  });
});
