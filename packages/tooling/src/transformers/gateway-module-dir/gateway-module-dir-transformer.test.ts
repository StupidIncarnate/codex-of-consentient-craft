import { gatewayModuleDirTransformer } from './gateway-module-dir-transformer';

describe('gatewayModuleDirTransformer', () => {
  it.each([
    ['fs/promises', 'fs__promises'],
    ['node:fs/promises', 'fs__promises'],
    ['@mantine/core', 'mantine__core'],
    ['@typescript-eslint/utils', 'typescript-eslint__utils'],
    ['glob', 'glob'],
    ['setTimeout', 'setTimeout'],
  ])('VALID: {specifier: %s} => %s', (specifier, expected) => {
    const result = gatewayModuleDirTransformer({ specifier });

    expect(result).toBe(expected);
  });

  it('INVALID: {specifier: ""} => throws a too-small error', () => {
    expect(() => gatewayModuleDirTransformer({ specifier: '' })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });
});
