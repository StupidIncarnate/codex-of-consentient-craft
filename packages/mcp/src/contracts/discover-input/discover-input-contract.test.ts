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

  it('VALID: {strict: true} => parses strict', () => {
    const result = DiscoverInputStub({ strict: true });

    expect(result).toStrictEqual({ strict: true });
  });

  it('VALID: {glob, grep, verbose, context, strict} => parses all params', () => {
    const result = DiscoverInputStub({
      glob: 'src/**',
      grep: 'error',
      verbose: true,
      context: 5,
      strict: true,
    });

    expect(result).toStrictEqual({
      glob: 'src/**',
      grep: 'error',
      verbose: true,
      context: 5,
      strict: true,
    });
  });

  it('VALID: {verbose: "true"} => coerces stringified verbose to boolean true', () => {
    const result = discoverInputContract.parse({ verbose: 'true' });

    expect(result).toStrictEqual({ verbose: true });
  });

  it('VALID: {verbose: "false"} => coerces stringified verbose to boolean false', () => {
    const result = discoverInputContract.parse({ verbose: 'false' });

    expect(result).toStrictEqual({ verbose: false });
  });

  it('VALID: {strict: "true"} => coerces stringified strict to boolean true', () => {
    const result = discoverInputContract.parse({ strict: 'true' });

    expect(result).toStrictEqual({ strict: true });
  });

  it('VALID: {strict: "false"} => coerces stringified strict to boolean false', () => {
    const result = discoverInputContract.parse({ strict: 'false' });

    expect(result).toStrictEqual({ strict: false });
  });

  it('VALID: {grep, verbose: "true", strict: "true"} => coerces both stringified booleans together', () => {
    const result = discoverInputContract.parse({
      grep: 'OrchestrationEventType',
      verbose: 'true',
      strict: 'true',
    });

    expect(result).toStrictEqual({
      grep: 'OrchestrationEventType',
      verbose: true,
      strict: true,
    });
  });

  it('INVALID: {verbose: "yes"} => rejects non-boolean-shaped string', () => {
    expect(() => discoverInputContract.parse({ verbose: 'yes' })).toThrow(/Expected boolean/u);
  });

  it('INVALID: {strict: "yes"} => rejects non-boolean-shaped string', () => {
    expect(() => discoverInputContract.parse({ strict: 'yes' })).toThrow(/Expected boolean/u);
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
