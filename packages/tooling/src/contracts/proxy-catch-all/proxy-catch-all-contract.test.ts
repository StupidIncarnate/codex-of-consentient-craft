import { proxyCatchAllContract } from './proxy-catch-all-contract';
import { ProxyCatchAllStub } from './proxy-catch-all.stub';

describe('proxyCatchAllContract', () => {
  it('VALID: {defaults} => one proxy with one site', () => {
    const result = ProxyCatchAllStub();

    expect(result).toStrictEqual({
      file: 'packages/example/src/example.proxy.ts',
      sites: [{ line: 3, kind: 'empty-address', snippet: 'handle.calledWith([])' }],
    });
  });

  it('EMPTY: {sites: []} => parses a proxy with no sites', () => {
    const result = ProxyCatchAllStub({ sites: [] });

    expect(result.sites).toStrictEqual([]);
  });

  it('INVALID: {file: ""} => throws a too-small error', () => {
    expect(() => ProxyCatchAllStub({ file: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = ProxyCatchAllStub();

    const result = proxyCatchAllContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
