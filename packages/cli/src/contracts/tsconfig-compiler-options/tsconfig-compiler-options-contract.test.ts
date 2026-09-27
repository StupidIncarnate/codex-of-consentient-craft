import { tsconfigCompilerOptionsContract } from './tsconfig-compiler-options-contract';
import { TsconfigCompilerOptionsStub } from './tsconfig-compiler-options.stub';

describe('tsconfigCompilerOptionsContract', () => {
  it('VALID: {string and string-list values} => parses successfully', () => {
    const result = tsconfigCompilerOptionsContract.parse({
      module: 'node16',
      customConditions: ['gateway-dist', 'source'],
    });

    expect(result).toStrictEqual({
      module: 'node16',
      customConditions: ['gateway-dist', 'source'],
    });
  });

  it('INVALID: {value: a number} => throws', () => {
    expect(() => tsconfigCompilerOptionsContract.parse({ strict: 1 })).toThrow(/received number/u);
  });

  it('VALID: {} => the stub defaults to a source customConditions entry', () => {
    const result = TsconfigCompilerOptionsStub();

    expect(result).toStrictEqual({ customConditions: ['source'] });
  });
});
