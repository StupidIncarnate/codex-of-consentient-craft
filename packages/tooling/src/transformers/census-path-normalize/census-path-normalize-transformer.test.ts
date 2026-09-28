import { censusPathNormalizeTransformer } from './census-path-normalize-transformer';

describe('censusPathNormalizeTransformer', () => {
  it('VALID: {path: "packages/a/src/x/../y/./z.ts"} => folds dot segments', () => {
    const result = censusPathNormalizeTransformer({ path: 'packages/a/src/x/../y/./z.ts' });

    expect(result).toBe('packages/a/src/y/z.ts');
  });

  it('VALID: {path: "packages//a///b.ts"} => drops empty segments', () => {
    const result = censusPathNormalizeTransformer({ path: 'packages//a///b.ts' });

    expect(result).toBe('packages/a/b.ts');
  });

  it('EDGE: {path: "../../x.ts"} => a climb past the root is dropped', () => {
    const result = censusPathNormalizeTransformer({ path: '../../x.ts' });

    expect(result).toBe('x.ts');
  });

  it('INVALID: {path: "./"} => throws, nothing is left to name', () => {
    expect(() => censusPathNormalizeTransformer({ path: './' })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });
});
