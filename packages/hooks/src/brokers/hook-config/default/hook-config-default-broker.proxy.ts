import { dungeonmasterEslintPluginGetPreEditRulesAdapterProxy } from '../../../adapters/dungeonmaster-eslint-plugin/get-pre-edit-rules/dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.proxy';

export const hookConfigDefaultBrokerProxy = (): Record<PropertyKey, never> => {
  dungeonmasterEslintPluginGetPreEditRulesAdapterProxy();

  return {};
};
