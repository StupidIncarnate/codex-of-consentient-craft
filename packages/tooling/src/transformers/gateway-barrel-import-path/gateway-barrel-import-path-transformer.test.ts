import { gatewayBarrelImportPathTransformer } from './gateway-barrel-import-path-transformer';

describe('gatewayBarrelImportPathTransformer', () => {
  it('VALID: {a node gateway barrel} => the #gateway import path', () => {
    const file = 'packages/@gateway/node/src/fs__promises/fs__promises.ts';

    expect(gatewayBarrelImportPathTransformer({ file })).toBe('#gateway/node/fs__promises');
  });

  it('VALID: {an npm gateway barrel} => the #gateway import path', () => {
    const file = 'packages/@gateway/npm/src/glob/glob.ts';

    expect(gatewayBarrelImportPathTransformer({ file })).toBe('#gateway/npm/glob');
  });

  it('EMPTY: {a wrapper file inside the module folder} => null', () => {
    const file = 'packages/@gateway/node/src/fs__promises/read-file/read-file.ts';

    expect(gatewayBarrelImportPathTransformer({ file })).toBe(null);
  });

  it('EMPTY: {a file outside the gateway} => null', () => {
    const file = 'packages/a/src/glob/glob.ts';

    expect(gatewayBarrelImportPathTransformer({ file })).toBe(null);
  });
});
