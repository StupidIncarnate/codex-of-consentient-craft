import { cappedGrepHitsContract } from './capped-grep-hits-contract';
import { CappedGrepHitsStub } from './capped-grep-hits.stub';

describe('cappedGrepHitsContract', () => {
  it('EMPTY: {no overrides} => empty label suffix and no lines', () => {
    const result = CappedGrepHitsStub();

    expect(result).toStrictEqual({ labelSuffix: '', lines: [] });
  });

  it('VALID: {lines: two hit lines} => keeps both lines in order', () => {
    const result = CappedGrepHitsStub({ lines: [':14  if (a) {', ':18  throw new Error();'] });

    expect(result).toStrictEqual({
      labelSuffix: '',
      lines: [':14  if (a) {', ':18  throw new Error();'],
    });
  });

  it('VALID: {labelSuffix carrying a count, no lines} => keeps the suffix alongside the empty list', () => {
    const result = CappedGrepHitsStub({ labelSuffix: '  — 3 matching lines' });

    expect(result).toStrictEqual({ labelSuffix: '  — 3 matching lines', lines: [] });
  });

  it('ERROR: {lines: [7]} => rejects a non-string line', () => {
    const result = cappedGrepHitsContract.safeParse({ labelSuffix: '', lines: [7] });

    expect(result.success).toBe(false);
  });

  it('ERROR: {labelSuffix missing} => rejects', () => {
    const result = cappedGrepHitsContract.safeParse({ lines: [] });

    expect(result.success).toBe(false);
  });
});
