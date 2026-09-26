import { isGatewayFileGuard } from './is-gateway-file-guard';

describe('isGatewayFileGuard', () => {
  it('VALID: {filename: a gateway implementation file} => returns true', () => {
    const result = isGatewayFileGuard({
      filename: '/repo/packages/node/src/fs/read-file-sync.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {filename: a gateway test file} => returns true', () => {
    const result = isGatewayFileGuard({
      filename: '/repo/packages/node/src/fs/read-file-sync.test.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {filename: a relative gateway path} => returns true', () => {
    const result = isGatewayFileGuard({
      filename: 'packages/bin/src/git/current-branch.test.ts',
    });

    expect(result).toBe(true);
  });

  it('INVALID: {filename: a workspace package test file} => returns false', () => {
    const result = isGatewayFileGuard({
      filename: '/repo/packages/shared/src/brokers/user/user-broker.test.ts',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {filename: undefined} => returns false', () => {
    const result = isGatewayFileGuard({});

    expect(result).toBe(false);
  });
});
