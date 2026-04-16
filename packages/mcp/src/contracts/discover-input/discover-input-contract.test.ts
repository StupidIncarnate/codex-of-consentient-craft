import { discoverInputContract } from './discover-input-contract';
import { DiscoverInputStub } from './discover-input.stub';

describe('discoverInputContract', () => {
  it('VALID: {} => parses empty object', () => {
    const result = DiscoverInputStub();

    expect(result).toStrictEqual({});
  });

  it('VALID: {glob: "**/*.ts"} => parses glob only', () => {
    const result = DiscoverInputStub({ glob: '**/*.ts' });

    expect(result).toStrictEqual({ glob: '**/*.ts' });
  });

  it('VALID: {grep: "ENOENT"} => parses grep only', () => {
    const result = DiscoverInputStub({ grep: 'ENOENT' });

    expect(result).toStrictEqual({ grep: 'ENOENT' });
  });

  it('VALID: {verbose: true} => parses verbose', () => {
    const result = DiscoverInputStub({ verbose: true });

    expect(result).toStrictEqual({ verbose: true });
  });

  it('VALID: {context: 3} => parses context', () => {
    const result = DiscoverInputStub({ context: 3 });

    expect(result).toStrictEqual({ context: 3 });
  });

  it('VALID: {glob, grep, verbose, context} => parses all params', () => {
    const result = DiscoverInputStub({ glob: 'src/**', grep: 'error', verbose: true, context: 5 });

    expect(result).toStrictEqual({ glob: 'src/**', grep: 'error', verbose: true, context: 5 });
  });

  it('INVALID: {path: "..."} => rejects unknown key with Unrecognized key message', () => {
    expect(() =>
      discoverInputContract.parse({ glob: 'src/**', path: '/some/path' } as never),
    ).toThrow(/Unrecognized key/u);
  });

  it('INVALID: {query: "..."} => rejects unknown key', () => {
    expect(() => discoverInputContract.parse({ query: 'foo' } as never)).toThrow(
      /Unrecognized key/u,
    );
  });
});
