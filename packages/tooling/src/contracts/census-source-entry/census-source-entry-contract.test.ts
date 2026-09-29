import { censusSourceEntryContract } from './census-source-entry-contract';
import { CensusSourceEntryStub } from './census-source-entry.stub';

describe('censusSourceEntryContract', () => {
  it('VALID: {defaults} => parses the default entry', () => {
    const result = CensusSourceEntryStub();

    expect(result).toStrictEqual({
      file: 'packages/example/src/example.ts',
      text: 'export const example = 1;',
    });
  });

  it('EMPTY: {text: ""} => an empty file still parses', () => {
    const result = CensusSourceEntryStub({ text: '' });

    expect(result.text).toBe('');
  });

  it('INVALID: {file: ""} => throws a too-small error', () => {
    expect(() => CensusSourceEntryStub({ file: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = CensusSourceEntryStub();

    const result = censusSourceEntryContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
