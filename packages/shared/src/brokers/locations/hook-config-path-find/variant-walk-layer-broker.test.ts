import { variantWalkLayerBroker } from './variant-walk-layer-broker';
import { variantWalkLayerBrokerProxy } from './variant-walk-layer-broker.proxy';

describe('variantWalkLayerBroker', () => {
  describe('match cases', () => {
    it('VALID: {first variant exists} => returns first AbsoluteFilePath', async () => {
      const proxy = variantWalkLayerBrokerProxy();

      proxy.setupFirstVariantMatches({
        searchPath: '/project',
        configPath: '/project/.dungeonmaster-hooks.config.ts',
      });

      const result = await variantWalkLayerBroker({
        searchPath: '/project',
        variants: ['.dungeonmaster-hooks.config.ts', '.dungeonmaster-hooks.config.js'],
      });

      expect(result).toBe(
        '/project/.dungeonmaster-hooks.config.ts',
      );
    });

    it('VALID: {first variant missing, second variant exists} => returns second AbsoluteFilePath', async () => {
      const proxy = variantWalkLayerBrokerProxy();

      proxy.setupNthVariantMatches({
        searchPath: '/project',
        missingPaths: ['/project/.dungeonmaster-hooks.config.ts'],
        configPath: '/project/.dungeonmaster-hooks.config.js',
      });

      const result = await variantWalkLayerBroker({
        searchPath: '/project',
        variants: ['.dungeonmaster-hooks.config.ts', '.dungeonmaster-hooks.config.js'],
      });

      expect(result).toBe(
        '/project/.dungeonmaster-hooks.config.js',
      );
    });
  });

  describe('no-match cases', () => {
    it('EMPTY: {variants: []} => returns null', async () => {
      variantWalkLayerBrokerProxy();

      const result = await variantWalkLayerBroker({
        searchPath: '/project',
        variants: [],
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {all variants missing} => returns null', async () => {
      const proxy = variantWalkLayerBrokerProxy();

      proxy.setupAllVariantsMissing({
        searchPath: '/project',
        missingPaths: [
          '/project/.dungeonmaster-hooks.config.ts',
          '/project/.dungeonmaster-hooks.config.js',
        ],
      });

      const result = await variantWalkLayerBroker({
        searchPath: '/project',
        variants: ['.dungeonmaster-hooks.config.ts', '.dungeonmaster-hooks.config.js'],
      });

      expect(result).toBe(null);
    });
  });
});
