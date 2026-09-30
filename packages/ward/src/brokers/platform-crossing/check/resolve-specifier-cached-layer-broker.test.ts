import { resolveSpecifierCachedLayerBroker } from './resolve-specifier-cached-layer-broker';
import { resolveSpecifierCachedLayerBrokerProxy } from './resolve-specifier-cached-layer-broker.proxy';
import type { ResolveSpecifierCache } from './resolve-specifier-cached-layer-broker';

describe('resolveSpecifierCachedLayerBroker', () => {
  describe('same containing file and specifier', () => {
    it('VALID: {called twice with the same key} => resolves once and caches one entry', async () => {
      const proxy = resolveSpecifierCachedLayerBrokerProxy();
      const containingFilePath = '/repo/entry.ts';
      const specifier = './helper';
      proxy.setupFile({
        filePath: '/repo/helper.ts',
        content: 'export const helper = () => 1;',
      });
      const resolveCache: ResolveSpecifierCache = new Map();

      const first = await resolveSpecifierCachedLayerBroker({
        specifier,
        containingFilePath,
        knownPackages: [],
        resolveCache,
      });
      const second = await resolveSpecifierCachedLayerBroker({
        specifier,
        containingFilePath,
        knownPackages: [],
        resolveCache,
      });

      expect(second).toStrictEqual(first);
      expect(resolveCache.size).toBe(1);
    });
  });

  describe('different specifiers on the same containing file', () => {
    it('VALID: {called with two distinct specifiers} => caches two separate entries', async () => {
      const proxy = resolveSpecifierCachedLayerBrokerProxy();
      const containingFilePath = '/repo/entry.ts';
      proxy.setupFile({
        filePath: '/repo/a.ts',
        content: 'export const a = 1;',
      });
      proxy.setupFile({
        filePath: '/repo/b.ts',
        content: 'export const b = 1;',
      });
      const resolveCache: ResolveSpecifierCache = new Map();

      await resolveSpecifierCachedLayerBroker({
        specifier: './a',
        containingFilePath,
        knownPackages: [],
        resolveCache,
      });
      await resolveSpecifierCachedLayerBroker({
        specifier: './b',
        containingFilePath,
        knownPackages: [],
        resolveCache,
      });

      expect(resolveCache.size).toBe(2);
    });
  });
});
