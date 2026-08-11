import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';
import { isPostQuestChatWorkItemRoleGuard } from './is-post-quest-chat-work-item-role-guard';

const ROLES = workItemRoleStatics.names;

// Both the case list and the expected subset come from the same static the guard reads, so a role
// added to `names` joins this matrix automatically rather than being silently skipped.
const POST_QUEST_CHAT_ROLES = new Set(
  ROLES.filter((role) => workItemRoleStatics.postQuestChat.some((pqcRole) => pqcRole === role)),
);

describe('isPostQuestChatWorkItemRoleGuard', () => {
  describe('role matrix', () => {
    it.each(ROLES)('VALID: {role: %s} => returns expected flag', (role) => {
      const result = isPostQuestChatWorkItemRoleGuard({ role });

      expect(result).toBe(POST_QUEST_CHAT_ROLES.has(role));
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {role: undefined} => returns false', () => {
      const result = isPostQuestChatWorkItemRoleGuard({});

      expect(result).toBe(false);
    });
  });
});
