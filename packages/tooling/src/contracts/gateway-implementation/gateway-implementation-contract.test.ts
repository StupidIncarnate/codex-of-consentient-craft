import { gatewayImplementationContract } from './gateway-implementation-contract';
import { GatewayImplementationStub } from './gateway-implementation.stub';

describe('gatewayImplementationContract', () => {
  it('VALID: {defaults} => parses the default wrapper', () => {
    const result = GatewayImplementationStub();

    expect(result).toStrictEqual({
      importPath: '#gateway/node/fs__promises',
      name: 'readFile',
      moduleDir: 'fs__promises',
      outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
    });
  });

  it('EMPTY: {outsideCalls: []} => a wrapper with no outside call still parses', () => {
    const result = GatewayImplementationStub({ outsideCalls: [] });

    expect(result.outsideCalls).toStrictEqual([]);
  });

  it('INVALID: {moduleDir: ""} => throws a too-small error', () => {
    expect(() => GatewayImplementationStub({ moduleDir: '' as never })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = GatewayImplementationStub();

    const result = gatewayImplementationContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
