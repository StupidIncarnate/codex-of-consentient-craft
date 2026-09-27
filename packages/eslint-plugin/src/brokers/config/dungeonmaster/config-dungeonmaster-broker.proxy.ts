// The real eslint-plugin-jest package calls fs.readdirSync at its own module-load time (before
// eslintPluginJestLoadAdapter's own body ever runs), which the unit-test I/O trap refuses since that
// call is not made from test infrastructure. configDungeonmasterBroker imports that adapter at its
// own top level unconditionally, so every test that constructs THIS proxy needs the real package
// replaced before it ever loads — not merely the adapter's own re-export mocked. Scoped to this
// proxy (not the adapter's own, which eslint-plugin-jest-load-adapter.test.ts needs to stay real) so
// that test keeps seeing the genuine plugin.
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

registerModuleMock({
  module: 'eslint-plugin-jest',
  factory: () => ({
    default: { rules: {}, configs: {} },
  }),
});

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
