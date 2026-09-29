import * as eslintPluginJest from '../eslint-plugin-jest';
import { rules } from './rules';
import { rulesProxy } from './rules.proxy';

describe('rules', () => {
  it('VALID: {proxy created} => rules is the replaced package empty rules object', () => {
    rulesProxy();

    expect(rules).toStrictEqual({});
  });

  it('VALID: {proxy created} => the barrel reads the replaced package, empty at every named export', () => {
    rulesProxy();

    expect({
      rules: eslintPluginJest.rules,
      configs: eslintPluginJest.configs,
      environments: eslintPluginJest.environments,
      meta: eslintPluginJest.meta,
    }).toStrictEqual({
      rules: {},
      configs: {},
      environments: {},
      meta: {},
    });
  });
});
