import { banDirectIoInTestScenariosStatics } from './ban-direct-io-in-test-scenarios-statics';

describe('banDirectIoInTestScenariosStatics', () => {
  it('VALID: {} => exposes correct bannedFsModules array', () => {
    expect(banDirectIoInTestScenariosStatics.bannedFsModules).toStrictEqual([
      'fs',
      'node:fs',
      'fs/promises',
      'node:fs/promises',
    ]);
  });

  it('VALID: {} => exposes correct bannedNamedImports array', () => {
    expect(banDirectIoInTestScenariosStatics.bannedNamedImports).toStrictEqual([
      'dmRegistryBroker',
      'recipesHydrationCreateBroker',
    ]);
  });
});
