import { doMock } from './do-mock';
import { resetModules } from '../reset-modules/reset-modules';

describe('#gateway/npm/jest__globals doMock', () => {
  it('VALID: {moduleName, factory} => the next real require of that module resolves to the mocked factory result', async () => {
    resetModules();

    doMock({ moduleName: 'node:path', factory: () => ({ __esModule: true, mocked: true }) });

    const mockedModule: unknown = await import('node:path');

    expect(mockedModule).toStrictEqual({ __esModule: true, mocked: true });
  });
});
