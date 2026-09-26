import { TsconfigPathsLocateResultStub } from '../../contracts/tsconfig-paths-locate-result/tsconfig-paths-locate-result.stub';
import { TsconfigPathsMapStub } from '../../contracts/tsconfig-paths-map/tsconfig-paths-map.stub';
import { tsconfigPathsInsertTextTransformer } from './tsconfig-paths-insert-text-transformer';

describe('tsconfigPathsInsertTextTransformer', () => {
  it('EMPTY: {descriptor: missingCompilerOptions} => returns the text unchanged', () => {
    const tsconfigText = '{\n  "extends": "./base.json"\n}\n';

    const result = tsconfigPathsInsertTextTransformer({
      tsconfigText,
      descriptor: TsconfigPathsLocateResultStub({ situation: 'missingCompilerOptions' }),
      entries: TsconfigPathsMapStub(),
    });

    expect(result).toBe(tsconfigText);
  });

  it('VALID: {descriptor: hasPaths, every entry already present} => returns the text unchanged', () => {
    const tsconfigText = `{
  "compilerOptions": {
    "paths": {
      "#gateway/npm/*": ["../npm"]
    }
  }
}
`;

    const result = tsconfigPathsInsertTextTransformer({
      tsconfigText,
      descriptor: TsconfigPathsLocateResultStub({
        situation: 'hasPaths',
        insertPos: tsconfigText.indexOf('["../npm"]') + '["../npm"]'.length,
        indent: '      ',
        needsLeadingComma: true,
        existingKeys: ['#gateway/npm/*'],
      }),
      entries: TsconfigPathsMapStub({ '#gateway/npm/*': ['../npm'] }),
    });

    expect(result).toBe(tsconfigText);
  });

  it('VALID: {descriptor: hasPaths, one missing entry, needsLeadingComma: true} => splices one entry in after the existing one', () => {
    const tsconfigText = `{
  "compilerOptions": {
    "paths": {
      "#gateway/node/*": ["../node"]
    }
  }
}
`;

    const result = tsconfigPathsInsertTextTransformer({
      tsconfigText,
      descriptor: TsconfigPathsLocateResultStub({
        situation: 'hasPaths',
        insertPos: tsconfigText.indexOf('["../node"]') + '["../node"]'.length,
        indent: '      ',
        needsLeadingComma: true,
        existingKeys: ['#gateway/node/*'],
      }),
      entries: TsconfigPathsMapStub({ '#gateway/npm/*': ['../npm'] }),
    });

    expect(result).toBe(`{
  "compilerOptions": {
    "paths": {
      "#gateway/node/*": ["../node"],
      "#gateway/npm/*": ["../npm"]
    }
  }
}
`);
  });

  it('VALID: {descriptor: hasPaths, two missing entries} => splices both in, comma-joined, after the existing one', () => {
    const tsconfigText = `{
  "compilerOptions": {
    "paths": {
      "#gateway/bin/*": ["../bin"]
    }
  }
}
`;

    const result = tsconfigPathsInsertTextTransformer({
      tsconfigText,
      descriptor: TsconfigPathsLocateResultStub({
        situation: 'hasPaths',
        insertPos: tsconfigText.indexOf('["../bin"]') + '["../bin"]'.length,
        indent: '      ',
        needsLeadingComma: true,
        existingKeys: ['#gateway/bin/*'],
      }),
      entries: TsconfigPathsMapStub({
        '#gateway/npm/*': ['../npm'],
        '#gateway/node/*': ['../node'],
      }),
    });

    expect(result).toBe(`{
  "compilerOptions": {
    "paths": {
      "#gateway/bin/*": ["../bin"],
      "#gateway/npm/*": ["../npm"],
      "#gateway/node/*": ["../node"]
    }
  }
}
`);
  });

  it('VALID: {descriptor: missingPaths, needsLeadingComma: true, two entries} => wraps both in a new "paths" block after the existing property', () => {
    const tsconfigText = `{
  "compilerOptions": {
    "noEmit": true
  }
}
`;

    const result = tsconfigPathsInsertTextTransformer({
      tsconfigText,
      descriptor: TsconfigPathsLocateResultStub({
        situation: 'missingPaths',
        insertPos: tsconfigText.indexOf('"noEmit": true') + '"noEmit": true'.length,
        indent: '    ',
        needsLeadingComma: true,
      }),
      entries: TsconfigPathsMapStub({
        '#gateway/npm/*': ['../npm'],
        '#gateway/node/*': ['../node'],
      }),
    });

    expect(result).toBe(`{
  "compilerOptions": {
    "noEmit": true,
    "paths": {
      "#gateway/npm/*": ["../npm"],
      "#gateway/node/*": ["../node"]
    }
  }
}
`);
  });

  it('VALID: {descriptor: hasPaths, entry value has two candidates} => formats the array with a space after the comma', () => {
    const tsconfigText = `{
  "compilerOptions": {
    "paths": {
      "#gateway/bin/*": ["../bin"]
    }
  }
}
`;

    const result = tsconfigPathsInsertTextTransformer({
      tsconfigText,
      descriptor: TsconfigPathsLocateResultStub({
        situation: 'hasPaths',
        insertPos: tsconfigText.indexOf('["../bin"]') + '["../bin"]'.length,
        indent: '      ',
        needsLeadingComma: true,
        existingKeys: ['#gateway/bin/*'],
      }),
      entries: TsconfigPathsMapStub({
        '#gateway/npm/*': [
          './packages/@gateway/npm/src/*/index.ts',
          './packages/@gateway/npm/src/*',
        ],
      }),
    });

    expect(result).toBe(`{
  "compilerOptions": {
    "paths": {
      "#gateway/bin/*": ["../bin"],
      "#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts", "./packages/@gateway/npm/src/*"]
    }
  }
}
`);
  });
});
