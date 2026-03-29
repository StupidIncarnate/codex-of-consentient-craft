import { StartEslintPlugin } from './index';

describe('index', () => {
  it('VALID: {default export} => exports plugin object with rules and configs', () => {
    const plugin = StartEslintPlugin();

    expect(plugin).toStrictEqual({
      rules: expect.any(Object),
      configs: expect.any(Object),
    });
  });

  it('VALID: {default export rules} => includes ban-primitives rule', () => {
    const plugin = StartEslintPlugin();

    expect(plugin.rules['ban-primitives']).toStrictEqual(expect.any(Object));
  });

  it('VALID: {default export configs} => includes dungeonmaster config', () => {
    const plugin = StartEslintPlugin();

    expect(plugin.configs.dungeonmaster).toStrictEqual(expect.any(Object));
  });
});
