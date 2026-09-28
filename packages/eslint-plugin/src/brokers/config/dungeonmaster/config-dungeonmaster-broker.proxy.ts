// The real eslint-plugin-jest package calls fs.readdirSync at its own module-load time, which the
// unit-test I/O trap refuses since that call is not made from test infrastructure.
// configDungeonmasterBroker imports '#gateway/npm/eslint-plugin-jest' at its own top level
// unconditionally, and that wrapper re-exports the real 'eslint-plugin-jest' specifier, so every
// test that constructs THIS proxy needs the real package replaced before it ever loads.
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

registerModuleMock({
  module: 'eslint-plugin-jest',
  factory: () => ({
    default: { rules: {}, configs: {} },
  }),
});

// typescript-eslint__eslint-plugin and eslint-plugin-eslint-comments are real pass-throughs with
// no .proxy.ts of their own — exactly as unmocked as the deleted adapters' own empty proxies, so
// there is nothing left to compose for either.
export const configDungeonmasterBrokerProxy = (): Record<PropertyKey, never> => ({});
