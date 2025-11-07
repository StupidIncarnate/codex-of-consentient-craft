import { StartEslintPlugin } from './index';

describe('index', () => {
  it('VALID: {default export} => exports plugin object with rules and configs', () => {
    const plugin = StartEslintPlugin();

    expect(plugin).toBeDefined();
    expect(plugin.rules).toBeDefined();
    expect(plugin.configs).toBeDefined();
    expect(typeof plugin.rules).toBe('object');
    expect(typeof plugin.configs).toBe('object');
  });

  it('VALID: {default export rules} => includes expected custom rules', () => {
    const plugin = StartEslintPlugin();

    expect(plugin.rules['ban-primitives']).toBeDefined();
    expect(plugin.rules['enforce-contract-usage-in-tests']).toBeDefined();
    expect(plugin.rules['explicit-return-types']).toBeDefined();
    expect(plugin.rules['enforce-project-structure']).toBeDefined();
  });

  it('VALID: {default export configs} => includes questmaestro config', () => {
    const plugin = StartEslintPlugin();

    expect(plugin.configs.questmaestro).toBeDefined();
    expect(typeof plugin.configs.questmaestro).toBe('object');
  });
});
