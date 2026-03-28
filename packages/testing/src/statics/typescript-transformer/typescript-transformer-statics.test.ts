import { typescriptTransformerStatics } from './typescript-transformer-statics';

describe('typescriptTransformerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(typescriptTransformerStatics).toStrictEqual({
      name: 'jest-proxy-mock-transformer',
      version: 1,
    });
  });
});
