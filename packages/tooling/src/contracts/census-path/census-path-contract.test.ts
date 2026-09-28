import { censusPathContract } from './census-path-contract';
import { CensusPathStub } from './census-path.stub';

describe('censusPathContract', () => {
  it('VALID: {value: "packages/a/src/x.ts"} => parses to the same text', () => {
    const result = CensusPathStub({ value: 'packages/a/src/x.ts' });

    expect(result).toBe('packages/a/src/x.ts');
  });

  it('VALID: {value: "packages/@gateway/node/src/fs/fs.ts"} => parses to the same text', () => {
    const result = CensusPathStub({ value: 'packages/@gateway/node/src/fs/fs.ts' });

    expect(result).toBe('packages/@gateway/node/src/fs/fs.ts');
  });

  it('INVALID: {value: ""} => throws a too-small error', () => {
    expect(() => CensusPathStub({ value: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('INVALID: {value: 123} => throws an expected-string error', () => {
    expect(() => CensusPathStub({ value: 123 as never })).toThrow(
      /^[\s\S]*expected string[\s\S]*$/iu,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = CensusPathStub();

    const result = censusPathContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
