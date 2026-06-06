import { blightwardenMinionRolesStatics } from '../../statics/blightwarden-minion-roles/blightwarden-minion-roles-statics';
import { isBlightwardenMinionRoleGuard } from './is-blightwarden-minion-role-guard';

describe('isBlightwardenMinionRoleGuard', () => {
  describe('minion roles', () => {
    it.each(blightwardenMinionRolesStatics.roles)('VALID: {role: %s} => returns true', (role) => {
      const result = isBlightwardenMinionRoleGuard({ role });

      expect(result).toBe(true);
    });
  });

  describe('non-minion roles', () => {
    it('VALID: {role: blightwarden} => returns false (synthesizer, not a minion)', () => {
      const result = isBlightwardenMinionRoleGuard({ role: 'blightwarden' });

      expect(result).toBe(false);
    });

    it('VALID: {role: codeweaver} => returns false', () => {
      const result = isBlightwardenMinionRoleGuard({ role: 'codeweaver' });

      expect(result).toBe(false);
    });

    it('VALID: {role: ward} => returns false', () => {
      const result = isBlightwardenMinionRoleGuard({ role: 'ward' });

      expect(result).toBe(false);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {role: undefined} => returns false', () => {
      const result = isBlightwardenMinionRoleGuard({});

      expect(result).toBe(false);
    });
  });
});
