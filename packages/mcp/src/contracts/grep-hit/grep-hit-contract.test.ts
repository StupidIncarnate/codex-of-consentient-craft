import { grepHitContract as _grepHitContract } from './grep-hit-contract';
import { GrepHitStub } from './grep-hit.stub';

describe('grepHitContract', () => {
  it('VALID: {line: 1, text: "matched line"} => parses defaults', () => {
    const result = GrepHitStub();

    expect(result).toStrictEqual({ line: 1, text: 'matched line' });
  });

  it('VALID: {line: 14, text: "error line"} => parses custom values', () => {
    const result = GrepHitStub({ line: 14, text: 'if (error.code === "ENOENT") {' });

    expect(result).toStrictEqual({ line: 14, text: 'if (error.code === "ENOENT") {' });
  });

  it('INVALID: {line: 0} => rejects non-positive line', () => {
    expect(() => GrepHitStub({ line: 0 })).toThrow(/too_small/u);
  });

  it('INVALID: {line: -1} => rejects negative line', () => {
    expect(() => GrepHitStub({ line: -1 })).toThrow(/too_small/u);
  });

  it('INVALID: {line: 1.5} => rejects non-integer line', () => {
    expect(() => GrepHitStub({ line: 1.5 })).toThrow(/invalid_type/u);
  });
});
