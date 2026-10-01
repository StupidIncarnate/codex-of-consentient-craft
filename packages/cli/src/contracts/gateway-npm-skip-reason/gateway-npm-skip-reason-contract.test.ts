import { gatewayNpmSkipReasonContract } from './gateway-npm-skip-reason-contract';
import { GatewayNpmSkipReasonStub } from './gateway-npm-skip-reason.stub';

describe('gatewayNpmSkipReasonContract', () => {
  it.each(gatewayNpmSkipReasonContract.options)(
    'VALID: {value: %s} => parses to itself',
    (reason) => {
      const result = gatewayNpmSkipReasonContract.parse(
        GatewayNpmSkipReasonStub({ value: reason }),
      );

      expect(result).toBe(reason);
    },
  );

  it('VALID: {} => stub defaults to version', () => {
    expect(GatewayNpmSkipReasonStub()).toBe('version');
  });

  it('INVALID: {value: "network"} => throws a validation error', () => {
    expect(() => gatewayNpmSkipReasonContract.parse('network')).toThrow(/Invalid option/u);
  });
});
