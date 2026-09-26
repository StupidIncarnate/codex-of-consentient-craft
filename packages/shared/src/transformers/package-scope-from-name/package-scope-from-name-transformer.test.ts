import { packageScopeFromNameTransformer } from './package-scope-from-name-transformer';

describe('packageScopeFromNameTransformer', () => {
  it('VALID: {rootPackageName: "dungeonmaster"} => returns "@dungeonmaster"', () => {
    const result = packageScopeFromNameTransformer({ rootPackageName: 'dungeonmaster' });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {rootPackageName: "@foo/bar"} => returns "@foo"', () => {
    const result = packageScopeFromNameTransformer({ rootPackageName: '@foo/bar' });

    expect(result).toBe('@foo');
  });

  it('EDGE: {rootPackageName: "@foo"} => returns "@foo" unchanged', () => {
    const result = packageScopeFromNameTransformer({ rootPackageName: '@foo' });

    expect(result).toBe('@foo');
  });

  it('EDGE: {rootPackageName: "some-tool"} => returns "@some-tool"', () => {
    const result = packageScopeFromNameTransformer({ rootPackageName: 'some-tool' });

    expect(result).toBe('@some-tool');
  });
});
