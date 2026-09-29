import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

// Loading the real eslint-plugin-jest calls `fs.readdirSync`, and other proxies in the same graph
// replace `fs` outright, so the package is replaced before it loads. The factory carries every
// name the barrel re-exports explicitly (`rules`, `configs`, `environments`, `meta`) plus the
// `default` it also re-exports; a name missing here reads `undefined` through the barrel.
registerModuleMock({
  module: 'eslint-plugin-jest',
  factory: () => ({
    default: { rules: {}, configs: {} },
    rules: {},
    configs: {},
    environments: {},
    meta: {},
  }),
});

export const rulesProxy = (): Record<PropertyKey, never> => ({});
