import { adapterCallerContract } from './adapter-caller-contract';
import { AdapterCallerStub } from './adapter-caller.stub';

describe('adapterCallerContract', () => {
  it('VALID: {defaults} => a caller with a proxy and no composers', () => {
    const result = AdapterCallerStub();

    expect(result).toStrictEqual({
      file: 'packages/example/src/brokers/thing/read/thing-read-broker.ts',
      proxyFile: 'packages/example/src/brokers/thing/read/thing-read-broker.proxy.ts',
      composedBy: [],
      catchAll: [],
    });
  });

  it('VALID: {proxyFile: null} => a caller with no proxy parses', () => {
    const result = AdapterCallerStub({ proxyFile: null });

    expect(result.proxyFile).toBe(null);
  });

  it('INVALID: {composedBy: [""]} => throws a too-small error', () => {
    expect(() => AdapterCallerStub({ composedBy: [''] as never })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = AdapterCallerStub();

    const result = adapterCallerContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
