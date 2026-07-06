import { tsconfigTemplateStatics } from './tsconfig-template-statics';

describe('tsconfigTemplateStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(tsconfigTemplateStatics).toStrictEqual({
      content: `{
  "extends": "@dungeonmaster/eslint-plugin/tsconfig",
  "compilerOptions": {
    "noEmit": true,
    "typeRoots": ["./node_modules/@types", "./@types"]
  },
  "files": []
}
`,
    });
  });

  it('VALID: content => is valid JSON extending the published base', () => {
    expect(JSON.parse(tsconfigTemplateStatics.content)).toStrictEqual({
      extends: '@dungeonmaster/eslint-plugin/tsconfig',
      compilerOptions: { noEmit: true, typeRoots: ['./node_modules/@types', './@types'] },
      files: [],
    });
  });
});
