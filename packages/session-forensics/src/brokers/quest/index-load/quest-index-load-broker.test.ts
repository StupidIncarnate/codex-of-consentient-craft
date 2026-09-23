import {
  QuestIdStub,
  WorkItemStub,
  OperationItemStub,
  WardResultStub,
  RiftcarverResultStub,
} from '@dungeonmaster/shared/contracts';

import { questIndexLoadBroker } from './quest-index-load-broker';
import { questIndexLoadBrokerProxy } from './quest-index-load-broker.proxy';

describe('questIndexLoadBroker', () => {
  describe('quest found with every collection', () => {
    it('VALID: {quest with userRequest, workItems, operations, wardResults, riftcarverResults} => returns all five', () => {
      const proxy = questIndexLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'full-quest' });
      const workItem = WorkItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const operation = OperationItemStub({ id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });
      const wardResult = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const riftcarverResult = RiftcarverResultStub({ id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' });
      proxy.setupQuest({
        questId,
        questJson: {
          userRequest: 'Add real-time notifications',
          workItems: [workItem],
          operations: [operation],
          wardResults: [wardResult],
          riftcarverResults: [riftcarverResult],
        },
      });

      const result = questIndexLoadBroker({ questId });

      expect(result).toStrictEqual({
        userRequest: 'Add real-time notifications',
        workItems: [workItem],
        operations: [operation],
        wardResults: [wardResult],
        riftcarverResults: [riftcarverResult],
      });
    });
  });

  describe('quest not found', () => {
    it('EMPTY: {questFindBroker finds nothing} => returns empty/undefined for all five', () => {
      const proxy = questIndexLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'ghost-quest' });
      proxy.setupMissingQuest();

      const result = questIndexLoadBroker({ questId });

      expect(result).toStrictEqual({
        userRequest: undefined,
        workItems: [],
        operations: [],
        wardResults: [],
        riftcarverResults: [],
      });
    });
  });

  describe('quest document missing individual keys', () => {
    it('EMPTY: {quest document has none of the five keys} => returns empty/undefined for all five', () => {
      const proxy = questIndexLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'no-keys-quest' });
      proxy.setupQuest({ questId, questJson: { someOtherField: 'value' } });

      const result = questIndexLoadBroker({ questId });

      expect(result).toStrictEqual({
        userRequest: undefined,
        workItems: [],
        operations: [],
        wardResults: [],
        riftcarverResults: [],
      });
    });

    it('EDGE: {a workItems entry fails the contract} => workItems is [], the other keys still load', () => {
      const proxy = questIndexLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-work-item-quest' });
      const operation = OperationItemStub({ id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupQuest({
        questId,
        questJson: {
          userRequest: 'Fix the bug',
          workItems: [{ id: 'incomplete-work-item' }],
          operations: [operation],
        },
      });

      const result = questIndexLoadBroker({ questId });

      expect(result).toStrictEqual({
        userRequest: 'Fix the bug',
        workItems: [],
        operations: [operation],
        wardResults: [],
        riftcarverResults: [],
      });
    });

    it('EDGE: {userRequest is not a string} => userRequest is undefined, the other keys still load', () => {
      const proxy = questIndexLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-user-request-quest' });
      const workItem = WorkItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupQuest({
        questId,
        questJson: { userRequest: 42, workItems: [workItem] },
      });

      const result = questIndexLoadBroker({ questId });

      expect(result).toStrictEqual({
        userRequest: undefined,
        workItems: [workItem],
        operations: [],
        wardResults: [],
        riftcarverResults: [],
      });
    });
  });

  describe('unparsable quest content', () => {
    it('EDGE: {file is not valid JSON} => returns empty/undefined for all five, no throw', () => {
      const proxy = questIndexLoadBrokerProxy();
      const questId = QuestIdStub({ value: 'invalid-json-quest' });
      proxy.setupQuestRawContent({ questId, content: '{ this is not json' });

      const result = questIndexLoadBroker({ questId });

      expect(result).toStrictEqual({
        userRequest: undefined,
        workItems: [],
        operations: [],
        wardResults: [],
        riftcarverResults: [],
      });
    });
  });
});
