import { StartEslintPlugin } from './index';

describe('index', () => {
  it('VALID: {default export} => exports plugin object with rules and configs', () => {
    const plugin = StartEslintPlugin();

    expect(Object.keys(plugin).sort()).toStrictEqual(['configs', 'rules']);
  });

  it('VALID: {default export rules} => includes ban-primitives rule with meta and create', () => {
    const plugin = StartEslintPlugin();

    expect(Object.keys(plugin.rules['ban-primitives']).sort()).toStrictEqual(['create', 'meta']);
    expect(plugin.rules['ban-primitives'].create).toStrictEqual(expect.any(Function));
  });

  it('VALID: {default export configs} => includes dungeonmaster config with expected keys', () => {
    const plugin = StartEslintPlugin();

    expect(Object.keys(plugin.configs.dungeonmaster).sort()).toStrictEqual([
      'fileOverrides',
      'ruleEnforceOn',
      'test',
      'typescript',
    ]);
  });
});
