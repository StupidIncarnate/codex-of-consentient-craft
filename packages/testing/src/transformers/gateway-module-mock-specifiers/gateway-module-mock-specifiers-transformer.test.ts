import { gatewayModuleMockSpecifiersTransformer } from './gateway-module-mock-specifiers-transformer';

describe('gatewayModuleMockSpecifiersTransformer', () => {
  describe('package name known', () => {
    it('VALID: {unscoped package} => maps the gateway name and the raw name to the mock', () => {
      const result = gatewayModuleMockSpecifiersTransformer({
        folder: 'elkjs',
        packageName: 'elkjs',
        mockPath: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });

      expect(result).toStrictEqual({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
        elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });
    });

    it('VALID: {scoped package} => maps the scoped raw name', () => {
      const result = gatewayModuleMockSpecifiersTransformer({
        folder: 'xyflow__react',
        packageName: '@xyflow/react',
        mockPath: '/repo/packages/@gateway/npm/src/xyflow__react/xyflow__react.jest-mock.cjs',
      });

      expect(result).toStrictEqual({
        '#gateway/npm/xyflow__react':
          '/repo/packages/@gateway/npm/src/xyflow__react/xyflow__react.jest-mock.cjs',
        '@xyflow/react':
          '/repo/packages/@gateway/npm/src/xyflow__react/xyflow__react.jest-mock.cjs',
      });
    });
  });

  describe('package name unknown', () => {
    it('EMPTY: {packageName: null} => maps the gateway name alone', () => {
      const result = gatewayModuleMockSpecifiersTransformer({
        folder: 'elkjs',
        packageName: null,
        mockPath: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });

      expect(result).toStrictEqual({
        '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
      });
    });
  });
});
