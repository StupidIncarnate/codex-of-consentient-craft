import { StartEslintPlugin } from './index';

describe('index', () => {
  it('VALID: {default export} => exports plugin object with rules and configs', () => {
    const plugin = StartEslintPlugin();

    const pluginKeys = Object.keys(plugin);

    expect(pluginKeys).toStrictEqual(['rules', 'configs']);
  });

  it('VALID: {default export rules} => includes ban-primitives rule with meta and create', () => {
    const plugin = StartEslintPlugin();

    const banPrimitivesKeys = Object.keys(plugin.rules['ban-primitives']);

    expect(banPrimitivesKeys).toStrictEqual(['meta', 'create']);
  });

  it('VALID: {default export configs} => includes dungeonmaster config with expected keys', () => {
    const plugin = StartEslintPlugin();

    const dungeonmasterKeys = Object.keys(plugin.configs.dungeonmaster);

    expect(dungeonmasterKeys).toStrictEqual([
      'typescript',
      'test',
      'fileOverrides',
      'ruleEnforceOn',
    ]);
  });
});
