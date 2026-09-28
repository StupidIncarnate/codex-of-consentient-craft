import { requireActual } from './require-actual';
import { doMock } from '../do-mock/do-mock';
import { resetModules } from '../reset-modules/reset-modules';
import type * as NodePath from 'node:path';

describe('#gateway/npm/jest__globals requireActual', () => {
  it('VALID: {moduleName: "node:path"} => returns the real module even while a mock is registered for it', async () => {
    resetModules();
    doMock({ moduleName: 'node:path', factory: () => ({ __esModule: true, mocked: true }) });

    const mockedImport: unknown = await import('node:path');
    const real = requireActual({ moduleName: 'node:path' }) as typeof NodePath;

    expect(mockedImport).toStrictEqual({ __esModule: true, mocked: true });
    expect(real.join('a', 'b')).toBe('a/b');
  });
});
