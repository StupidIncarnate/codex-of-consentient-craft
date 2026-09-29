import { censusArgsContract } from './census-args-contract';
import { CensusArgsStub } from './census-args.stub';

describe('censusArgsContract', () => {
  it('VALID: {defaults} => the table format with no directory and no filter', () => {
    const result = CensusArgsStub();

    expect(result).toStrictEqual({ format: 'table' });
  });

  it('VALID: {every field} => all three kept', () => {
    const result = CensusArgsStub({
      cwd: '/repo',
      format: 'json',
      packageFilter: 'lib',
    });

    expect(result).toStrictEqual({ cwd: '/repo', format: 'json', packageFilter: 'lib' });
  });

  it('INVALID: {format: "xml"} => throws an invalid-option error', () => {
    expect(() => CensusArgsStub({ format: 'xml' })).toThrow(/^[\s\S]*Invalid option[\s\S]*$/u);
  });

  it('INVALID: {packageFilter: ""} => throws a too-small error', () => {
    expect(() => CensusArgsStub({ packageFilter: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = CensusArgsStub({ format: 'json' });

    const result = censusArgsContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
