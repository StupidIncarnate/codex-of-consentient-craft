import { tsExtensionsStatics } from './ts-extensions-statics';

describe('tsExtensionsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(tsExtensionsStatics).toStrictEqual({
      extensions: ['ts', 'tsx'],
      declarationExtensions: ['ts', 'd.ts'],
      allExtensions: ['ts', 'tsx', 'js', 'jsx'],
    });
  });
});
