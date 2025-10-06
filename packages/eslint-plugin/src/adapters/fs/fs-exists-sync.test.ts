import { fsExistsSync } from './fs-exists-sync';
import { existsSync } from 'fs';
import { filePathContract } from '../../contracts/file-path/file-path-contract';

jest.mock('fs');

const mockExistsSync = jest.mocked(existsSync);

describe('fsExistsSync', () => {
  it('VALID: {filePath: "/exists.ts"} => returns true', () => {
    const filePath = filePathContract.parse('/exists.ts');
    mockExistsSync.mockReturnValue(true);

    const result = fsExistsSync({ filePath });

    expect(result).toBe(true);
    expect(mockExistsSync).toHaveBeenCalledTimes(1);
    expect(mockExistsSync).toHaveBeenCalledWith(filePath);
  });

  it('VALID: {filePath: "/not-exists.ts"} => returns false', () => {
    const filePath = filePathContract.parse('/not-exists.ts');
    mockExistsSync.mockReturnValue(false);

    const result = fsExistsSync({ filePath });

    expect(result).toBe(false);
    expect(mockExistsSync).toHaveBeenCalledTimes(1);
    expect(mockExistsSync).toHaveBeenCalledWith(filePath);
  });
});
