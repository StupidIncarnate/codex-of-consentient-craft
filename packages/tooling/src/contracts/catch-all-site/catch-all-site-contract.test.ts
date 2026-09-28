import { catchAllSiteContract } from './catch-all-site-contract';
import { CatchAllSiteStub } from './catch-all-site.stub';

describe('catchAllSiteContract', () => {
  it('VALID: {defaults} => parses the default site', () => {
    const result = CatchAllSiteStub();

    expect(result).toStrictEqual({
      line: 3,
      kind: 'empty-address',
      snippet: 'handle.calledWith([])',
    });
  });

  it('VALID: {kind: "accept-all-predicate"} => keeps the kind', () => {
    const result = CatchAllSiteStub({ kind: 'accept-all-predicate' });

    expect(result.kind).toBe('accept-all-predicate');
  });

  it('INVALID: {line: 0} => throws a too-small error', () => {
    expect(() => CatchAllSiteStub({ line: 0 as never })).toThrow(/^[\s\S]*>0[\s\S]*$/u);
  });

  it('INVALID: {kind: "other"} => throws an invalid-option error', () => {
    expect(() => CatchAllSiteStub({ kind: 'other' as never })).toThrow(
      /^[\s\S]*Invalid option[\s\S]*$/u,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = CatchAllSiteStub();

    const result = catchAllSiteContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
