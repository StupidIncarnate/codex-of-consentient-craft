// Proxy for config broker - composes child proxies
import { typescriptEslintEslintPluginLoadAdapterProxy } from '../../../adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.proxy';
import { eslintPluginJestLoadAdapterProxy } from '../../../adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.proxy';
import { eslintPluginEslintCommentsLoadAdapterProxy } from '../../../adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.proxy';

export const configDungeonmasterBrokerProxy = (): Record<PropertyKey, never> => {
  // Create child adapter proxies (transformers don't require proxies per folderConfigStatics)
  typescriptEslintEslintPluginLoadAdapterProxy();
  eslintPluginJestLoadAdapterProxy();
  eslintPluginEslintCommentsLoadAdapterProxy();

  return {};
};
