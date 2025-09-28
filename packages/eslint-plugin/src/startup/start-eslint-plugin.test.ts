import { startEslintPlugin } from './start-eslint-plugin';

describe('startEslintPlugin', () => {
  describe('initialize()', () => {
    it('VALID: => returns plugin object with rules and configs', () => {
      const plugin = startEslintPlugin();

      expect(plugin).toStrictEqual({
        rules: {
          'ban-primitives': expect.objectContaining({
            meta: expect.objectContaining({
              type: 'problem',
              docs: expect.objectContaining({
                description: 'Ban raw string and number types in favor of Zod contract types',
              }),
            }),
            create: expect.any(Function),
          }),
          'require-zod-on-primitives': expect.objectContaining({
            meta: expect.objectContaining({
              type: 'problem',
              docs: expect.objectContaining({
                description: 'Require .brand() chaining on z.string() and z.number() calls',
              }),
            }),
            create: expect.any(Function),
          }),
          'explicit-return-types': expect.objectContaining({
            meta: expect.objectContaining({
              type: 'problem',
              docs: expect.objectContaining({
                description:
                  'Require explicit return types on exported functions using Zod contracts',
              }),
            }),
            create: expect.any(Function),
          }),
          'enforce-folder-structure': expect.objectContaining({
            meta: expect.objectContaining({
              type: 'problem',
              docs: expect.objectContaining({
                description: 'Enforce QuestMaestro project folder structure standards',
              }),
            }),
            create: expect.any(Function),
          }),
        },
        configs: {
          questmaestro: expect.objectContaining({
            plugins: {},
            rules: expect.objectContaining({
              '@questmaestro/ban-primitives': 'error',
              '@questmaestro/require-zod-on-primitives': 'error',
              '@questmaestro/explicit-return-types': 'error',
              '@questmaestro/enforce-folder-structure': 'error',
            }),
          }),
        },
      });
    });

    it('VALID: plugin.rules => returns all four custom rules', () => {
      const plugin = startEslintPlugin();

      expect(Object.keys(plugin.rules)).toStrictEqual([
        'ban-primitives',
        'require-zod-on-primitives',
        'explicit-return-types',
        'enforce-folder-structure',
      ]);
    });

    it('VALID: plugin.configs => returns questmaestro configuration', () => {
      const plugin = startEslintPlugin();

      expect(Object.keys(plugin.configs)).toStrictEqual(['questmaestro']);
    });

    it('VALID: questmaestro config includes all rules => includes all architectural enforcement rules', () => {
      const plugin = startEslintPlugin();

      expect(plugin.configs.questmaestro.rules).toHaveProperty(
        '@questmaestro/ban-primitives',
        'error',
      );
      expect(plugin.configs.questmaestro.rules).toHaveProperty(
        '@questmaestro/require-zod-on-primitives',
        'error',
      );
      expect(plugin.configs.questmaestro.rules).toHaveProperty(
        '@questmaestro/explicit-return-types',
        'error',
      );
      expect(plugin.configs.questmaestro.rules).toHaveProperty(
        '@questmaestro/enforce-folder-structure',
        'error',
      );
    });
  });
});
