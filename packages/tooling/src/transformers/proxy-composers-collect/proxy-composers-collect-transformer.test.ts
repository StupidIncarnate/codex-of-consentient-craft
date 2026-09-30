import { proxyComposersCollectTransformer } from './proxy-composers-collect-transformer';

describe('proxyComposersCollectTransformer', () => {
  const leaf = 'packages/a/src/leaf.proxy.ts';
  const middle = 'packages/a/src/middle.proxy.ts';
  const top = 'packages/a/src/top.proxy.ts';
  const other = 'packages/a/src/other.proxy.ts';

  it('VALID: {a chain leaf <- middle <- top} => middle and top, sorted', () => {
    const result = proxyComposersCollectTransformer({
      proxyFile: leaf,
      composersByProxy: new Map([
        [leaf, [middle]],
        [middle, [top]],
      ]),
    });

    expect(result).toStrictEqual(['packages/a/src/middle.proxy.ts', 'packages/a/src/top.proxy.ts']);
  });

  it('VALID: {two proxies compose the same parent} => the parent is listed once', () => {
    const result = proxyComposersCollectTransformer({
      proxyFile: leaf,
      composersByProxy: new Map([
        [leaf, [middle, other]],
        [middle, [top]],
        [other, [top]],
      ]),
    });

    expect(result).toStrictEqual([
      'packages/a/src/middle.proxy.ts',
      'packages/a/src/other.proxy.ts',
      'packages/a/src/top.proxy.ts',
    ]);
  });

  it('EDGE: {a cycle back to the starting proxy} => the starting proxy is left out', () => {
    const result = proxyComposersCollectTransformer({
      proxyFile: leaf,
      composersByProxy: new Map([
        [leaf, [middle]],
        [middle, [leaf]],
      ]),
    });

    expect(result).toStrictEqual(['packages/a/src/middle.proxy.ts']);
  });

  it('EMPTY: {no proxy composes it} => an empty list', () => {
    const result = proxyComposersCollectTransformer({
      proxyFile: leaf,
      composersByProxy: new Map(),
    });

    expect(result).toStrictEqual([]);
  });
});
