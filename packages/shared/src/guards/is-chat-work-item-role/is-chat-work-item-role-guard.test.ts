import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';
import { isChatWorkItemRoleGuard } from './is-chat-work-item-role-guard';

const ROLES = workItemRoleStatics.names;

// Both the case list and the expected subset come from the same static the guard reads, so a role
// added to `names` joins this matrix automatically rather than being silently skipped.
const CHAT_ROLES = new Set(
  ROLES.filter((role) => workItemRoleStatics.chat.some((chatRole) => chatRole === role)),
);

describe('isChatWorkItemRoleGuard', () => {
  describe('role matrix', () => {
    it.each(ROLES)('VALID: {role: %s} => returns expected flag', (role) => {
      const result = isChatWorkItemRoleGuard({ role });

      expect(result).toBe(CHAT_ROLES.has(role));
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {role: undefined} => returns false', () => {
      const result = isChatWorkItemRoleGuard({});

      expect(result).toBe(false);
    });
  });
});
