import { resetModules } from './reset-modules';
import { doMock } from '../do-mock/do-mock';

describe('#gateway/npm/jest__globals resetModules', () => {
  it('VALID: {} => clears the module registry, so a still-registered doMock factory runs again on the next require', async () => {
    let factoryCallCount = 0;

    doMock({
      moduleName: 'node:path',
      factory: () => {
        factoryCallCount += 1;
        return { __esModule: true, callNumber: factoryCallCount };
      },
    });

    const firstRequire: unknown = await import('node:path');
    const secondRequireBeforeReset: unknown = await import('node:path');

    resetModules();

    const thirdRequireAfterReset: unknown = await import('node:path');

    expect(firstRequire).toStrictEqual({ __esModule: true, callNumber: 1 });
    expect(secondRequireBeforeReset).toStrictEqual({ __esModule: true, callNumber: 1 });
    expect(thirdRequireAfterReset).toStrictEqual({ __esModule: true, callNumber: 2 });
  });
});
