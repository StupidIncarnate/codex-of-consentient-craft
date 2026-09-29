import { gatewayExportContract } from './gateway-export-contract';
import { GatewayExportStub } from './gateway-export.stub';

describe('gatewayExportContract', () => {
  it('VALID: {defaults} => parses the default exact match', () => {
    const result = GatewayExportStub();

    expect(result).toStrictEqual({
      importPath: '#gateway/node/fs__promises',
      name: 'readFile',
      match: 'exact',
    });
  });

  it('VALID: {match: "related"} => keeps the match kind', () => {
    const result = GatewayExportStub({ match: 'related' });

    expect(result.match).toBe('related');
  });

  it('INVALID: {match: "close"} => throws an invalid-option error', () => {
    expect(() => GatewayExportStub({ match: 'close' })).toThrow(/^[\s\S]*Invalid option[\s\S]*$/u);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = GatewayExportStub();

    const result = gatewayExportContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
