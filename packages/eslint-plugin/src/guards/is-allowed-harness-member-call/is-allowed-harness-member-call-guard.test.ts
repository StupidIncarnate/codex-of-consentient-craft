import { isAllowedHarnessMemberCallGuard } from './is-allowed-harness-member-call-guard';
import { isAllowedHarnessMemberCallGuardProxy } from './is-allowed-harness-member-call-guard.proxy';

describe('isAllowedHarnessMemberCallGuard', () => {
  describe('allowed calls', () => {
    it('VALID: {jest.spyOn} => returns true', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({ objectName: 'jest', propertyName: 'spyOn' });

      expect(result).toBe(true);
    });

    it('VALID: {mock.mockImplementation} => returns true', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({
        objectName: 'mock',
        propertyName: 'mockImplementation',
      });

      expect(result).toBe(true);
    });

    it('VALID: {childHarness.setup} => returns true', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({
        objectName: 'childHarness',
        propertyName: 'setup',
      });

      expect(result).toBe(true);
    });

    it('VALID: {fs.mkdirSync} => returns true', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({
        objectName: 'fs',
        propertyName: 'mkdirSync',
      });

      expect(result).toBe(true);
    });

    it('VALID: {path.join} => returns true', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({ objectName: 'path', propertyName: 'join' });

      expect(result).toBe(true);
    });

    it('VALID: {os.tmpdir} => returns true', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({ objectName: 'os', propertyName: 'tmpdir' });

      expect(result).toBe(true);
    });
  });

  describe('disallowed calls', () => {
    it('INVALID: {database.connect} => returns false', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({
        objectName: 'database',
        propertyName: 'connect',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {logger.log} => returns false', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({ objectName: 'logger', propertyName: 'log' });

      expect(result).toBe(false);
    });

    it('INVALID: {undefined objectName, non-mock property} => returns false', () => {
      isAllowedHarnessMemberCallGuardProxy();

      const result = isAllowedHarnessMemberCallGuard({ propertyName: 'connect' });

      expect(result).toBe(false);
    });
  });
});
