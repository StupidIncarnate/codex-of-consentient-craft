import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';
import { isCommandWorkItemRoleGuard } from './is-command-work-item-role-guard';

const ROLES = workItemRoleStatics.names;

// Both the case list and the expected subset come from the same static the guard reads, so a role
// added to `names` joins this matrix automatically rather than being silently skipped.
const COMMAND_ROLES = new Set(
  ROLES.filter((role) => workItemRoleStatics.command.some((commandRole) => commandRole === role)),
);

describe('isCommandWorkItemRoleGuard', () => {
  describe('role matrix', () => {
    it.each(ROLES)('VALID: {role: %s} => returns expected flag', (role) => {
      const result = isCommandWorkItemRoleGuard({ role });

      expect(result).toBe(COMMAND_ROLES.has(role));
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {role: undefined} => returns false', () => {
      const result = isCommandWorkItemRoleGuard({});

      expect(result).toBe(false);
    });
  });
});
