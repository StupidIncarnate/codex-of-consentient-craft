import { isolateModulesAsync } from './isolate-modules-async';
import { doMock } from '../do-mock/do-mock';

describe('#gateway/npm/jest__globals isolateModulesAsync', () => {
  it('VALID: {fn} => runs the callback for real, against a fresh isolated module registry each call', async () => {
    let factoryCallCount = 0;
    const seenInSandbox: unknown[] = [];

    await isolateModulesAsync({
      fn: async () => {
        doMock({
          moduleName: 'node:path',
          factory: () => {
            factoryCallCount += 1;
            return { __esModule: true, callNumber: factoryCallCount };
          },
        });
        seenInSandbox.push(await import('node:path'));
      },
    });

    await isolateModulesAsync({
      fn: async () => {
        doMock({
          moduleName: 'node:path',
          factory: () => {
            factoryCallCount += 1;
            return { __esModule: true, callNumber: factoryCallCount };
          },
        });
        seenInSandbox.push(await import('node:path'));
      },
    });

    expect(seenInSandbox).toStrictEqual([
      { __esModule: true, callNumber: 1 },
      { __esModule: true, callNumber: 2 },
    ]);
  });
});
