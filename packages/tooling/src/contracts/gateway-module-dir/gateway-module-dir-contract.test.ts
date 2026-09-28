import { gatewayModuleDirContract } from './gateway-module-dir-contract';
import { GatewayModuleDirStub } from './gateway-module-dir.stub';

describe('gatewayModuleDirContract', () => {
  it('VALID: {value: "fs__promises"} => parses to the same text', () => {
    const result = GatewayModuleDirStub({ value: 'fs__promises' });

    expect(result).toBe('fs__promises');
  });

  it('VALID: {value: "mantine__core"} => parses to the same text', () => {
    const result = GatewayModuleDirStub({ value: 'mantine__core' });

    expect(result).toBe('mantine__core');
  });

  it('INVALID: {value: ""} => throws a too-small error', () => {
    expect(() => GatewayModuleDirStub({ value: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('INVALID: {value: 123} => throws an expected-string error', () => {
    expect(() => GatewayModuleDirStub({ value: 123 as never })).toThrow(
      /^[\s\S]*expected string[\s\S]*$/iu,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = GatewayModuleDirStub();

    const result = gatewayModuleDirContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
