import { ExecutionRoleStub } from '../../contracts/execution-role/execution-role.stub';

import { roleToConfigIndexTransformer } from './role-to-config-index-transformer';

describe('roleToConfigIndexTransformer', () => {
  describe('known roles', () => {
    it('VALID: {role: chaoswhisperer} => returns 0 (first in config)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'chaoswhisperer' }),
      });

      expect(result).toBe(0);
    });

    it('VALID: {role: glyphsmith} => returns 1', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'glyphsmith' }),
      });

      expect(result).toBe(1);
    });

    it('VALID: {role: pathseeker-surface} => returns 2', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-surface' }),
      });

      expect(result).toBe(2);
    });

    it('VALID: {role: pathseeker-dedup} => returns 3', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-dedup' }),
      });

      expect(result).toBe(3);
    });

    it('VALID: {role: pathseeker-assertion-correctness} => returns 4', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-assertion-correctness' }),
      });

      expect(result).toBe(4);
    });

    it('VALID: {role: pathseeker-walk} => returns 5', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-walk' }),
      });

      expect(result).toBe(5);
    });

    it('VALID: {role: codeweaver} => returns 6', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(6);
    });

    it('VALID: {role: pesteater} => returns 7 (EXTERMINATION floor, after codeweaver)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pesteater' }),
      });

      expect(result).toBe(7);
    });
  });

  describe('legacy fallback', () => {
    it('VALID: {role: pathseeker (legacy, not in config)} => returns floors.length sentinel', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker' }),
      });

      // floors.length sentinel: 14 base floors + 5 blightwarden minion floors = 19.
      expect(result).toBe(19);
    });
  });
});
