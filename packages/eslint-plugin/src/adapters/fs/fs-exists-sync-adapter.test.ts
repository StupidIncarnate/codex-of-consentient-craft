import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { existsSync } from 'fs';
import { FilePathStub } from '@questmaestro/shared/contracts';

jest.mock('fs');

const mockExistsSync = jest.mocked(existsSync);

describe('fsExistsSyncAdapter', () => {
  it('VALID: {filePath: "/exists.ts"} => returns true', () => {
    const filePath = FilePathStub({ value: '/exists.ts' });
    mockExistsSync.mockReturnValue(true);

    const result = fsExistsSyncAdapter({ filePath });

    expect(result).toBe(true);
    expect(mockExistsSync).toHaveBeenCalledTimes(1);
    expect(mockExistsSync).toHaveBeenCalledWith(filePath);
  });

  it('VALID: {filePath: "/not-exists.ts"} => returns false', () => {
    const filePath = FilePathStub({ value: '/not-exists.ts' });
    mockExistsSync.mockReturnValue(false);

    const result = fsExistsSyncAdapter({ filePath });

    expect(result).toBe(false);
    expect(mockExistsSync).toHaveBeenCalledTimes(1);
    expect(mockExistsSync).toHaveBeenCalledWith(filePath);
  });
});
