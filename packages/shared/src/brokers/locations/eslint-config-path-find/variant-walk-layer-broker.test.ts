import { variantWalkLayerBroker } from './variant-walk-layer-broker';
import { variantWalkLayerBrokerProxy } from './variant-walk-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('variantWalkLayerBroker', () => {
  describe('match cases', () => {
    it('VALID: {first variant exists} => returns first AbsoluteFilePath', async () => {
      const proxy = variantWalkLayerBrokerProxy();

      proxy.setupFirstVariantMatches({
        searchPath: '/project',
        configPath: '/project/eslint.config.ts',
      });

      const result = await variantWalkLayerBroker({
        searchPath: '/project',
        variants: ['eslint.config.ts', 'eslint.config.js'],
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/eslint.config.ts' }));
    });

    it('VALID: {first variant missing, second variant exists} => returns second AbsoluteFilePath', async () => {
      const proxy = variantWalkLayerBrokerProxy();

      proxy.setupNthVariantMatches({
        searchPath: '/project',
        missingPaths: ['/project/eslint.config.ts'],
        configPath: '/project/eslint.config.js',
      });

      const result = await variantWalkLayerBroker({
        searchPath: '/project',
        variants: ['eslint.config.ts', 'eslint.config.js'],
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/eslint.config.js' }));
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
          '/project/eslint.config.ts',
          '/project/eslint.config.js',
        ],
      });

      const result = await variantWalkLayerBroker({
        searchPath: '/project',
        variants: ['eslint.config.ts', 'eslint.config.js'],
      });

      expect(result).toBe(null);
    });
  });
});
