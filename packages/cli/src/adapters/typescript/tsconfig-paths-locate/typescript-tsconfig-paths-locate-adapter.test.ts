import { typescriptTsconfigPathsLocateAdapter } from './typescript-tsconfig-paths-locate-adapter';
import { typescriptTsconfigPathsLocateAdapterProxy } from './typescript-tsconfig-paths-locate-adapter.proxy';

describe('typescriptTsconfigPathsLocateAdapter', () => {
  it('EMPTY: {text: tsconfig with no compilerOptions} => returns missingCompilerOptions', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const text = '{\n  "extends": "./base.json"\n}\n';

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({ situation: 'missingCompilerOptions' });
  });

  it('VALID: {text: compilerOptions with no paths, no trailing comma} => returns missingPaths, inserting after the last property, needing a leading comma', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const lastPropertyText = '"typeRoots": ["./node_modules/@types"]';
    const text = `{
  "compilerOptions": {
    "noEmit": true,
    ${lastPropertyText}
  }
}
`;

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'missingPaths',
      insertPos: text.indexOf(lastPropertyText) + lastPropertyText.length,
      indent: '    ',
      needsLeadingComma: true,
    });
  });

  it('VALID: {text: compilerOptions with no paths, WITH a trailing comma} => returns missingPaths, inserting after that comma, needing no leading comma', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const text = `{
  "compilerOptions": {
    "noEmit": true,
  }
}
`;

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'missingPaths',
      insertPos: text.indexOf('"noEmit": true,') + '"noEmit": true,'.length,
      indent: '    ',
      needsLeadingComma: false,
    });
  });

  it('EMPTY: {text: compilerOptions is an empty object} => returns missingPaths, inserting right after the opening brace, needing no leading comma', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const text = `{
  "compilerOptions": {}
}
`;

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'missingPaths',
      insertPos: text.indexOf('"compilerOptions": {') + '"compilerOptions": {'.length,
      indent: '    ',
      needsLeadingComma: false,
    });
  });

  it('VALID: {text: paths already exists, with comments around it} => returns hasPaths with the existing key, comments never disturbing the computed position', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const lastEntryText = '"#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts"]';
    const text = `{
  "compilerOptions": {
    // a comment explaining noEmit
    "noEmit": true,
    "paths": {
      // explains the npm entry
      ${lastEntryText}
    }
  }
}
`;

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'hasPaths',
      insertPos: text.indexOf(lastEntryText) + lastEntryText.length,
      indent: '      ',
      needsLeadingComma: true,
      existingKeys: ['#gateway/npm/*'],
    });
  });

  it('EMPTY: {text: paths already exists but is empty} => returns hasPaths with no existing keys, inserting right after the opening brace', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const text = `{
  "compilerOptions": {
    "paths": {}
  }
}
`;

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'hasPaths',
      insertPos: text.indexOf('"paths": {') + '"paths": {'.length,
      indent: '      ',
      needsLeadingComma: false,
      existingKeys: [],
    });
  });

  it('VALID: {text: paths already exists with a trailing comma after the last entry} => returns hasPaths, inserting after that comma, needing no leading comma', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const text = `{
  "compilerOptions": {
    "paths": {
      "#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts"],
    }
  }
}
`;

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'hasPaths',
      insertPos:
        text.indexOf('"#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts"],') +
        '"#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts"],'.length,
      indent: '      ',
      needsLeadingComma: false,
      existingKeys: ['#gateway/npm/*'],
    });
  });

  it('VALID: {text: paths has two existing keys} => returns both in existingKeys, in file order', () => {
    typescriptTsconfigPathsLocateAdapterProxy();
    const text = `{
  "compilerOptions": {
    "paths": {
      "#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts"],
      "#gateway/node/*": ["./packages/@gateway/node/src/*/index.ts"]
    }
  }
}
`;

    const result = typescriptTsconfigPathsLocateAdapter({ text });

    expect(result).toStrictEqual({
      situation: 'hasPaths',
      insertPos:
        text.indexOf('"#gateway/node/*": ["./packages/@gateway/node/src/*/index.ts"]') +
        '"#gateway/node/*": ["./packages/@gateway/node/src/*/index.ts"]'.length,
      indent: '      ',
      needsLeadingComma: true,
      existingKeys: ['#gateway/npm/*', '#gateway/node/*'],
    });
  });
});
