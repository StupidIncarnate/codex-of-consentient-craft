import { installResultContract } from './install-result-contract';
import { InstallResultStub as _InstallResultStub } from './install-result.stub';

describe('installResultContract', () => {
  describe('valid results', () => {
    it('VALID: {successful creation with message} => parses successfully', () => {
      const result = installResultContract.parse({
        packageName: '@dungeonmaster/eslint',
        success: true,
        action: 'created',
        message: 'Package installed successfully',
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint',
        success: true,
        action: 'created',
        message: 'Package installed successfully',
      });
    });

    it('VALID: {failed with error} => parses successfully', () => {
      const result = installResultContract.parse({
        packageName: '@dungeonmaster/eslint',
        success: false,
        action: 'failed',
        error: 'File not found',
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint',
        success: false,
        action: 'failed',
        error: 'File not found',
      });
    });

    it('VALID: {skipped without message} => parses successfully', () => {
      const result = installResultContract.parse({
        packageName: '@dungeonmaster/eslint',
        success: true,
        action: 'skipped',
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint',
        success: true,
        action: 'skipped',
      });
    });

    it('VALID: {merged action} => parses successfully', () => {
      const result = installResultContract.parse({
        packageName: '@dungeonmaster/shared',
        success: true,
        action: 'merged',
        message: 'Configuration merged with existing files',
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/shared',
        success: true,
        action: 'merged',
        message: 'Configuration merged with existing files',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing packageName} => throws ZodError', () => {
      expect(() => {
        return installResultContract.parse({
          success: true,
          action: 'created',
        });
      }).toThrow('Required');
    });

    it('INVALID: {missing success} => throws ZodError', () => {
      expect(() => {
        return installResultContract.parse({
          packageName: '@dungeonmaster/eslint',
          action: 'created',
        });
      }).toThrow('Required');
    });

    it('INVALID: {missing action} => throws ZodError', () => {
      expect(() => {
        return installResultContract.parse({
          packageName: '@dungeonmaster/eslint',
          success: true,
        });
      }).toThrow('Required');
    });

    it('INVALID: {invalid action} => throws ZodError', () => {
      expect(() => {
        return installResultContract.parse({
          packageName: '@dungeonmaster/eslint',
          success: true,
          action: 'unknown',
        });
      }).toThrow('Invalid enum value');
    });

    it('INVALID: {success not boolean} => throws ZodError', () => {
      expect(() => {
        return installResultContract.parse({
          packageName: '@dungeonmaster/eslint',
          success: 'true',
          action: 'created',
        });
      }).toThrow('Expected boolean');
    });

    it('INVALID: {empty object} => throws ZodError', () => {
      expect(() => {
        return installResultContract.parse({});
      }).toThrow('Required');
    });
  });
});
