import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemRoleStub } from '@dungeonmaster/shared/contracts/work-item-role/work-item-role.stub';

import { linkedQuestInfoContract } from './linked-quest-info-contract';
import { LinkedQuestInfoStub as _LinkedQuestInfoStub } from './linked-quest-info.stub';

describe('linkedQuestInfoContract', () => {
  describe('full payload', () => {
    it('VALID: {questId, workItemId, role} => parses to all three fields', () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });

      const result = linkedQuestInfoContract.parse({ questId, workItemId, role });

      expect(result).toStrictEqual({ questId, workItemId, role });
    });
  });

  describe('quest-only payload', () => {
    it('VALID: {questId} => parses with no workItemId or role', () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = linkedQuestInfoContract.parse({ questId });

      expect(result).toStrictEqual({ questId });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing questId} => throws', () => {
      expect(() => linkedQuestInfoContract.parse({})).toThrow(
        /Invalid input: expected string, received undefined/iu,
      );
    });
  });
});
