import { isIoBoundaryProxyGuard } from './is-io-boundary-proxy-guard';

describe('isIoBoundaryProxyGuard', () => {
  it('VALID: {filename: a gateway node proxy} => returns true', () => {
    const result = isIoBoundaryProxyGuard({
      filename: '/repo/packages/@gateway/node/src/fs/read-file-sync.proxy.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {filename: a gateway npm proxy} => returns true', () => {
    const result = isIoBoundaryProxyGuard({
      filename: '/repo/packages/@gateway/npm/src/zod/index.proxy.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {filename: a relative gateway browser proxy path} => returns true', () => {
    const result = isIoBoundaryProxyGuard({
      filename: 'packages/@gateway/browser/src/fetch/index.proxy.ts',
    });

    expect(result).toBe(true);
  });

  it('INVALID: {filename: a broker proxy} => returns false', () => {
    const result = isIoBoundaryProxyGuard({
      filename: '/repo/packages/shared/src/brokers/user/user-broker.proxy.ts',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {filename: undefined} => returns false', () => {
    const result = isIoBoundaryProxyGuard({});

    expect(result).toBe(false);
  });
});
