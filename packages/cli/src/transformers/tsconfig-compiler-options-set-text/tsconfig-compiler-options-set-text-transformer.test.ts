import { tsconfigCompilerOptionsSetTextTransformer } from './tsconfig-compiler-options-set-text-transformer';
import { TsconfigCompilerOptionsLocateResultStub } from '../../contracts/tsconfig-compiler-options-locate-result/tsconfig-compiler-options-locate-result.stub';
import { TsconfigCompilerOptionsStub } from '../../contracts/tsconfig-compiler-options/tsconfig-compiler-options.stub';

describe('tsconfigCompilerOptionsSetTextTransformer', () => {
  it('EMPTY: {descriptor: missingCompilerOptions} => returns the text unchanged', () => {
    const tsconfigText = '{\n  "extends": "./base.json"\n}\n';

    const result = tsconfigCompilerOptionsSetTextTransformer({
      tsconfigText,
      descriptor: TsconfigCompilerOptionsLocateResultStub({ situation: 'missingCompilerOptions' }),
      options: TsconfigCompilerOptionsStub({ module: 'node16' }),
    });

    expect(result).toBe(tsconfigText);
  });

  it('VALID: {an option holding another value, one missing} => replaces the value and appends the missing option', () => {
    const tsconfigText =
      '{\n  "compilerOptions": {\n    // resolution\n    "module": "commonjs"\n  }\n}\n';

    const result = tsconfigCompilerOptionsSetTextTransformer({
      tsconfigText,
      descriptor: TsconfigCompilerOptionsLocateResultStub({
        insertPos: tsconfigText.indexOf('"commonjs"') + '"commonjs"'.length,
        indent: '    ',
        needsLeadingComma: true,
        existing: [
          {
            key: 'module',
            valueStart: tsconfigText.indexOf('"commonjs"'),
            valueEnd: tsconfigText.indexOf('"commonjs"') + '"commonjs"'.length,
          },
        ],
      }),
      options: TsconfigCompilerOptionsStub({
        module: 'node16',
        customConditions: ['gateway-dist', 'source'],
      }),
    });

    expect(result).toBe(
      '{\n  "compilerOptions": {\n    // resolution\n    "module": "node16",\n    "customConditions": ["gateway-dist", "source"]\n  }\n}\n',
    );
  });

  it('VALID: {every option already holds the wanted value, spaced differently} => returns the text unchanged', () => {
    const tsconfigText =
      '{\n  "compilerOptions": {\n    "customConditions": [ "source" ]\n  }\n}\n';

    const result = tsconfigCompilerOptionsSetTextTransformer({
      tsconfigText,
      descriptor: TsconfigCompilerOptionsLocateResultStub({
        insertPos: tsconfigText.indexOf(']') + 1,
        indent: '    ',
        needsLeadingComma: true,
        existing: [
          {
            key: 'customConditions',
            valueStart: tsconfigText.indexOf('['),
            valueEnd: tsconfigText.indexOf(']') + 1,
          },
        ],
      }),
      options: TsconfigCompilerOptionsStub({ customConditions: ['source'] }),
    });

    expect(result).toBe(tsconfigText);
  });

  it('EMPTY: {an empty compilerOptions object} => writes the options inside it on their own lines', () => {
    const tsconfigText = '{\n  "compilerOptions": {}\n}\n';

    const result = tsconfigCompilerOptionsSetTextTransformer({
      tsconfigText,
      descriptor: TsconfigCompilerOptionsLocateResultStub({
        insertPos: tsconfigText.indexOf('{}') + 1,
        indent: '    ',
        needsLeadingComma: false,
        existing: [],
      }),
      options: TsconfigCompilerOptionsStub({ module: 'node16' }),
    });

    expect(result).toBe(
      '{\n  "compilerOptions": {\n    "customConditions": ["source"],\n    "module": "node16"\n  }\n}\n',
    );
  });
});
