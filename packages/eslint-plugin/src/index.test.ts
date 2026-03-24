import { StartEslintPlugin } from './index';

describe('index', () => {
  it('VALID: {default export} => exports plugin object with rules and configs', () => {
    const plugin = StartEslintPlugin();

    expect(typeof plugin.rules).toBe('object');
    expect(typeof plugin.configs).toBe('object');
  });

  it('VALID: {default export rules} => includes expected custom rules', () => {
    const plugin = StartEslintPlugin();

    expect(typeof plugin.rules['ban-primitives']).toBe('object');
    expect(typeof plugin.rules['enforce-contract-usage-in-tests']).toBe('object');
    expect(typeof plugin.rules['explicit-return-types']).toBe('object');
    expect(typeof plugin.rules['enforce-project-structure']).toBe('object');
  });

  it('VALID: {default export configs} => includes dungeonmaster config', () => {
    const plugin = StartEslintPlugin();

    expect(typeof plugin.configs.dungeonmaster).toBe('object');
  });
});
