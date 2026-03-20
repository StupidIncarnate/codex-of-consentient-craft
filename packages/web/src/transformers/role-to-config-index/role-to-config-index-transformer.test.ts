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

    it('VALID: {role: codeweaver} => returns 3 (fourth in config)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(3);
    });

    it('VALID: {role: pathseeker} => returns index after glyphsmith', () => {
      const chaosIdx = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'chaoswhisperer' }),
      });
      const psIdx = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker' }),
      });

      expect(psIdx).toBeGreaterThan(chaosIdx);
    });
  });
});
