import { StartEslintPlugin } from './index';

describe('index', () => {
  it('VALID: {default export} => exports plugin object with rules and configs', () => {
    const plugin = StartEslintPlugin();

    expect(plugin).toStrictEqual({
      rules: expect.any(Object),
      configs: expect.any(Object),
    });
  });

  it('VALID: {default export rules} => includes ban-primitives rule with meta and create', () => {
    const plugin = StartEslintPlugin();

    expect(plugin.rules['ban-primitives']).toStrictEqual({
      meta: expect.any(Object),
      create: expect.any(Function),
    });
  });

  it('VALID: {default export configs} => includes dungeonmaster config with expected keys', () => {
    const plugin = StartEslintPlugin();

    expect(plugin.configs.dungeonmaster).toStrictEqual({
      typescript: expect.any(Object),
      test: expect.any(Object),
      fileOverrides: expect.any(Array),
      ruleEnforceOn: expect.any(Object),
    });
  });
});
