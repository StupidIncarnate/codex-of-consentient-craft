import { gatewayModuleMockMapContract } from './gateway-module-mock-map-contract';
import { GatewayModuleMockMapStub } from './gateway-module-mock-map.stub';

describe('gatewayModuleMockMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {specifier => path entries} => parses successfully', () => {
      const result = gatewayModuleMockMapContract.parse({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
        elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });

      expect(result).toStrictEqual({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
        elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });
    });

    it('EMPTY: {} => parses an empty map', () => {
      const result = gatewayModuleMockMapContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: number} => throws a Zod validation error', () => {
      expect(() => gatewayModuleMockMapContract.parse({ elkjs: 1 as never })).toThrow(
        /expected string/u,
      );
    });
  });

  describe('GatewayModuleMockMapStub', () => {
    it('VALID: {} => returns the elkjs entries', () => {
      const result = GatewayModuleMockMapStub();

      expect(result).toStrictEqual({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
        elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });
    });
  });
});
