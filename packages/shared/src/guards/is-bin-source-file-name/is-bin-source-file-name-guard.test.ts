import { isBinSourceFileNameGuard } from './is-bin-source-file-name-guard';

describe('isBinSourceFileNameGuard', () => {
  it('VALID: {name: cli-entry.ts} => returns true', () => {
    expect(isBinSourceFileNameGuard({ name: 'cli-entry.ts' })).toBe(true);
  });

  it('VALID: {name: detect-duplicate-primitives.ts} => returns true', () => {
    expect(isBinSourceFileNameGuard({ name: 'detect-duplicate-primitives.ts' })).toBe(true);
  });

  it('EMPTY: {name: undefined} => returns false', () => {
    expect(isBinSourceFileNameGuard({})).toBe(false);
  });

  it('INVALID: {name: cli-entry.js} => returns false (must end in .ts)', () => {
    expect(isBinSourceFileNameGuard({ name: 'cli-entry.js' })).toBe(false);
  });

  it('INVALID: {name: dungeonmaster.e2e.test.ts} => returns false (e2e test excluded)', () => {
    expect(isBinSourceFileNameGuard({ name: 'dungeonmaster.e2e.test.ts' })).toBe(false);
  });

  it('INVALID: {name: dungeonmaster.test.ts} => returns false (test excluded)', () => {
    expect(isBinSourceFileNameGuard({ name: 'dungeonmaster.test.ts' })).toBe(false);
  });

  it('INVALID: {name: dungeonmaster.proxy.ts} => returns false (proxy excluded)', () => {
    expect(isBinSourceFileNameGuard({ name: 'dungeonmaster.proxy.ts' })).toBe(false);
  });
});
