import { gatewayModuleMockStatics } from './gateway-module-mock-statics';

describe('gatewayModuleMockStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gatewayModuleMockStatics).toStrictEqual({
      locations: {
        npmGatewayDir: 'packages/@gateway/npm',
        srcDir: 'src',
      },
      files: {
        mockSuffix: '.jest-mock.cjs',
        barrelExtension: '.ts',
      },
      specifiers: {
        npmGatewayPrefix: '#gateway/npm/',
      },
    });
  });
});
