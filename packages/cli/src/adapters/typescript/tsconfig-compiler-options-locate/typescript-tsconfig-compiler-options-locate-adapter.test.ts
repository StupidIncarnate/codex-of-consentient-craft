import { typescriptTsconfigCompilerOptionsLocateAdapter } from './typescript-tsconfig-compiler-options-locate-adapter';
import { typescriptTsconfigCompilerOptionsLocateAdapterProxy } from './typescript-tsconfig-compiler-options-locate-adapter.proxy';

describe('typescriptTsconfigCompilerOptionsLocateAdapter', () => {
  it('EMPTY: {text: tsconfig with no compilerOptions} => returns missingCompilerOptions', () => {
    typescriptTsconfigCompilerOptionsLocateAdapterProxy();

    const result = typescriptTsconfigCompilerOptionsLocateAdapter({
      text: '{\n  "extends": "./base.json"\n}\n',
    });

    expect(result).toStrictEqual({ situation: 'missingCompilerOptions' });
  });

  it('VALID: {text: two options, no trailing comma} => inserts after the last, needs a leading comma, reports each value range', () => {
    typescriptTsconfigCompilerOptionsLocateAdapterProxy();
    const text =
      '{\n  "compilerOptions": {\n    "module": "commonjs",\n    "noEmit": true\n  }\n}\n';

    const result = typescriptTsconfigCompilerOptionsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'hasCompilerOptions',
      insertPos: text.indexOf('true') + 'true'.length,
      indent: '    ',
      needsLeadingComma: true,
      existing: [
        {
          key: 'module',
          valueStart: text.indexOf('"commonjs"'),
          valueEnd: text.indexOf('"commonjs"') + '"commonjs"'.length,
        },
        {
          key: 'noEmit',
          valueStart: text.indexOf('true'),
          valueEnd: text.indexOf('true') + 'true'.length,
        },
      ],
    });
  });

  it('VALID: {text: last option carries a trailing comma and a comment} => inserts after the comma, needs no leading comma', () => {
    typescriptTsconfigCompilerOptionsLocateAdapterProxy();
    const text = '{\n  // project settings\n  "compilerOptions": {\n    "noEmit": true,\n  }\n}\n';

    const result = typescriptTsconfigCompilerOptionsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'hasCompilerOptions',
      insertPos: text.indexOf('true,') + 'true,'.length,
      indent: '    ',
      needsLeadingComma: false,
      existing: [
        {
          key: 'noEmit',
          valueStart: text.indexOf('true'),
          valueEnd: text.indexOf('true') + 'true'.length,
        },
      ],
    });
  });

  it('EMPTY: {text: an empty compilerOptions object} => inserts just inside the brace', () => {
    typescriptTsconfigCompilerOptionsLocateAdapterProxy();
    const text = '{\n  "compilerOptions": {}\n}\n';

    const result = typescriptTsconfigCompilerOptionsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'hasCompilerOptions',
      insertPos: text.indexOf('{}') + 1,
      indent: '    ',
      needsLeadingComma: false,
      existing: [],
    });
  });
});
