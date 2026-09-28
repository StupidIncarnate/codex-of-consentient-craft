import { censusArgsParseTransformer } from './census-args-parse-transformer';

describe('censusArgsParseTransformer', () => {
  it('EMPTY: {args: []} => the table format only', () => {
    const result = censusArgsParseTransformer({ args: [] });

    expect(result).toStrictEqual({ format: 'table' });
  });

  it('VALID: {every flag} => all three parsed', () => {
    const result = censusArgsParseTransformer({
      args: ['--cwd=/repo', '--format=json', '--package=lib'],
    });

    expect(result).toStrictEqual({ cwd: '/repo', format: 'json', packageFilter: 'lib' });
  });

  it('VALID: {a repeated flag} => the last one wins', () => {
    const result = censusArgsParseTransformer({ args: ['--format=json', '--format=table'] });

    expect(result).toStrictEqual({ format: 'table' });
  });

  it('VALID: {unknown flags and bare words} => ignored', () => {
    const result = censusArgsParseTransformer({ args: ['--verbose', 'census', '--format=json'] });

    expect(result).toStrictEqual({ format: 'json' });
  });

  it('INVALID: {--format=xml} => throws an invalid-option error', () => {
    expect(() => censusArgsParseTransformer({ args: ['--format=xml'] })).toThrow(
      /^[\s\S]*Invalid option[\s\S]*$/u,
    );
  });

  it('INVALID: {--package=} => throws a too-small error', () => {
    expect(() => censusArgsParseTransformer({ args: ['--package='] })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });
});
