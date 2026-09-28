import { tsconfigCompilerOptionsLocateResultContract } from './tsconfig-compiler-options-locate-result-contract';
import { TsconfigCompilerOptionsLocateResultStub } from './tsconfig-compiler-options-locate-result.stub';

describe('tsconfigCompilerOptionsLocateResultContract', () => {
  it('VALID: {situation: "missingCompilerOptions"} => parses successfully', () => {
    const result = tsconfigCompilerOptionsLocateResultContract.parse({
      situation: 'missingCompilerOptions',
    });

    expect(result).toStrictEqual({ situation: 'missingCompilerOptions' });
  });

  it('VALID: {situation: "hasCompilerOptions", one existing option} => parses successfully', () => {
    const result = tsconfigCompilerOptionsLocateResultContract.parse({
      situation: 'hasCompilerOptions',
      insertPos: 60,
      indent: '    ',
      needsLeadingComma: false,
      existing: [{ key: 'module', valueStart: 30, valueEnd: 40 }],
    });

    expect(result).toStrictEqual({
      situation: 'hasCompilerOptions',
      insertPos: 60,
      indent: '    ',
      needsLeadingComma: false,
      existing: [{ key: 'module', valueStart: 30, valueEnd: 40 }],
    });
  });

  it('INVALID: {insertPos: -1} => throws', () => {
    expect(() =>
      tsconfigCompilerOptionsLocateResultContract.parse({
        situation: 'hasCompilerOptions',
        insertPos: -1,
        indent: '    ',
        needsLeadingComma: false,
        existing: [],
      }),
    ).toThrow(/Too small: expected number to be >=0/u);
  });

  it('VALID: {} => the stub defaults to hasCompilerOptions with no existing options', () => {
    const result = TsconfigCompilerOptionsLocateResultStub();

    expect(result).toStrictEqual({
      situation: 'hasCompilerOptions',
      insertPos: 40,
      indent: '    ',
      needsLeadingComma: true,
      existing: [],
    });
  });

  it('VALID: {situation: "missingCompilerOptions"} => the stub returns that member', () => {
    const result = TsconfigCompilerOptionsLocateResultStub({ situation: 'missingCompilerOptions' });

    expect(result).toStrictEqual({ situation: 'missingCompilerOptions' });
  });
});
