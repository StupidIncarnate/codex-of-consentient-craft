import { questmaestroEslintPluginGetPreEditRulesAdapterProxy } from '../../../adapters/questmaestro-eslint-plugin/get-pre-edit-rules/questmaestro-eslint-plugin-get-pre-edit-rules-adapter.proxy';

export const hookConfigDefaultBrokerProxy = (): Record<PropertyKey, never> => {
  questmaestroEslintPluginGetPreEditRulesAdapterProxy();

  return {};
};
