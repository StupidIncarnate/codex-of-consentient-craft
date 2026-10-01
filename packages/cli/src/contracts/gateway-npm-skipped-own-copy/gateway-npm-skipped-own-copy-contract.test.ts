import { gatewayNpmSkippedOwnCopyContract } from './gateway-npm-skipped-own-copy-contract';
import { GatewayNpmSkippedOwnCopyStub } from './gateway-npm-skipped-own-copy.stub';

describe('gatewayNpmSkippedOwnCopyContract', () => {
  it('EMPTY: {} => stub holds a version skip with neither version', () => {
    expect(GatewayNpmSkippedOwnCopyStub()).toStrictEqual({ name: 'zod', reason: 'version' });
  });

  it('VALID: {installed, ours} => parses both versions', () => {
    const result = gatewayNpmSkippedOwnCopyContract.parse(
      GatewayNpmSkippedOwnCopyStub({ installed: '3.23.8', ours: '^4.6.5' }),
    );

    expect(result).toStrictEqual({
      name: 'zod',
      reason: 'version',
      installed: '3.23.8',
      ours: '^4.6.5',
    });
  });

  it('INVALID: {reason: "network"} => throws a validation error', () => {
    expect(() =>
      gatewayNpmSkippedOwnCopyContract.parse({ name: 'zod', reason: 'network' }),
    ).toThrow(/Invalid option/u);
  });

  it('INVALID: {installed: ""} => throws a validation error', () => {
    expect(() =>
      gatewayNpmSkippedOwnCopyContract.parse({ name: 'zod', reason: 'version', installed: '' }),
    ).toThrow(/Too small/u);
  });
});
