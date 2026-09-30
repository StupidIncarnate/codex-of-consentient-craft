import { npmPackageNameFromSpecifierTransformer } from './npm-package-name-from-specifier-transformer';

describe('npmPackageNameFromSpecifierTransformer', () => {
  it('VALID: {specifier: "zod"} => returns "zod"', () => {
    expect(npmPackageNameFromSpecifierTransformer({ specifier: 'zod' })).toBe('zod');
  });

  it('VALID: {specifier: "hono/utils/http-status"} => returns "hono"', () => {
    expect(npmPackageNameFromSpecifierTransformer({ specifier: 'hono/utils/http-status' })).toBe(
      'hono',
    );
  });

  it('VALID: {specifier: "@hono/node-server"} => returns "@hono/node-server"', () => {
    expect(npmPackageNameFromSpecifierTransformer({ specifier: '@hono/node-server' })).toBe(
      '@hono/node-server',
    );
  });

  it('VALID: {specifier: "@modelcontextprotocol/sdk/types.js"} => returns "@modelcontextprotocol/sdk"', () => {
    expect(
      npmPackageNameFromSpecifierTransformer({ specifier: '@modelcontextprotocol/sdk/types.js' }),
    ).toBe('@modelcontextprotocol/sdk');
  });
});
