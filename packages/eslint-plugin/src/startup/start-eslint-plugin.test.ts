import { startEslintPlugin } from './start-eslint-plugin';

describe('startEslintPlugin', () => {
  describe('initialize()', () => {
    it('VALID: => returns plugin object with rules and configs', () => {
      const plugin = startEslintPlugin();

      expect(plugin).toEqual(
        expect.objectContaining({
          rules: expect.objectContaining({
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
                  description: 'Require explicit return types on exported functions',
                }),
              }),
              create: expect.any(Function),
            }),
            'enforce-project-structure': expect.objectContaining({
              meta: expect.objectContaining({
                type: 'problem',
                docs: expect.objectContaining({
                  description:
                    'Enforce QuestMaestro project structure with hierarchical validation (folder → depth → filename → export)',
                }),
              }),
              create: expect.any(Function),
            }),
            'enforce-import-dependencies': expect.objectContaining({
              create: expect.any(Function),
            }),
            'enforce-object-destructuring-params': expect.objectContaining({
              create: expect.any(Function),
            }),
            'enforce-test-colocation': expect.objectContaining({
              create: expect.any(Function),
            }),
            'enforce-implementation-testing': expect.objectContaining({
              create: expect.any(Function),
            }),
          }),
          configs: expect.objectContaining({
            questmaestro: expect.objectContaining({
              plugins: expect.any(Object),
              rules: expect.objectContaining({
                '@questmaestro/enforce-object-destructuring-params': 'error',
              }),
            }),
          }),
        }),
      );
    });

    it('VALID: plugin.rules => returns all custom rules', () => {
      const plugin = startEslintPlugin();

      expect(Object.keys(plugin.rules)).toStrictEqual([
        'ban-primitives',
        'require-zod-on-primitives',
        'explicit-return-types',
        'enforce-project-structure',
        'enforce-import-dependencies',
        'enforce-object-destructuring-params',
        'enforce-test-colocation',
        'enforce-implementation-testing',
        'forbid-non-exported-functions',
      ]);
    });

    it('VALID: plugin.configs => returns questmaestro configuration', () => {
      const plugin = startEslintPlugin();

      expect(Object.keys(plugin.configs)).toStrictEqual(['questmaestro']);
    });

    it('VALID: questmaestro config includes active rules => includes enforce-object-destructuring-params', () => {
      const plugin = startEslintPlugin();

      expect(plugin.configs.questmaestro.rules).toHaveProperty(
        '@questmaestro/enforce-object-destructuring-params',
        'error',
      );
    });
  });
});
