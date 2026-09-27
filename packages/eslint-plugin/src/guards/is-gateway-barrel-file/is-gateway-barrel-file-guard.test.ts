import { isGatewayBarrelFileGuard } from './is-gateway-barrel-file-guard';

describe('isGatewayBarrelFileGuard', () => {
  it('VALID: {filename: a subpath barrel} => returns true', () => {
    const result = isGatewayBarrelFileGuard({
      filename: '/repo/packages/@gateway/node/src/fs/fs.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {filename: a flattened nested subpath barrel} => returns true', () => {
    const result = isGatewayBarrelFileGuard({
      filename: '/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {filename: a .tsx barrel} => returns true', () => {
    const result = isGatewayBarrelFileGuard({
      filename: '/repo/packages/@gateway/npm/src/react/react.tsx',
    });

    expect(result).toBe(true);
  });

  it('INVALID: {filename: a wrapper named after its own subpath} => returns false', () => {
    const result = isGatewayBarrelFileGuard({
      filename: '/repo/packages/@gateway/npm/src/glob/glob/glob.ts',
    });

    expect(result).toBe(false);
  });

  it('INVALID: {filename: a wrapper file} => returns false', () => {
    const result = isGatewayBarrelFileGuard({
      filename: '/repo/packages/@gateway/node/src/fs/exists-sync/exists-sync.ts',
    });

    expect(result).toBe(false);
  });

  it('INVALID: {filename: the subpath _test_ barrel} => returns false', () => {
    const result = isGatewayBarrelFileGuard({
      filename: '/repo/packages/@gateway/node/src/fs/fs.proxy.ts',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {filename: undefined} => returns false', () => {
    const result = isGatewayBarrelFileGuard({});

    expect(result).toBe(false);
  });
});
