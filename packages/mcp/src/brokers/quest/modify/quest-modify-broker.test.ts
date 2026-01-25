import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questModifyBroker } from './quest-modify-broker';
import { questModifyBrokerProxy } from './quest-modify-broker.proxy';
import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';

describe('questModifyBroker', () => {
  describe('successful modification', () => {
    it('VALID: {questId, contexts: [new]} => adds new context', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', contexts: [] });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contexts: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Admin Page',
            description: 'User admin section',
            locator: { page: '/admin' },
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, contexts: [existing]} => updates existing context', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        contexts: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Old Name',
            description: 'Old description',
            locator: { page: '/old' },
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contexts: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'New Name',
            description: 'New description',
            locator: { page: '/new' },
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, observables: [new]} => adds new observable', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', observables: [] });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        observables: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'Click login button',
            dependsOn: [],
            outcomes: [],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, steps: [new]} => adds new step', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', steps: [] });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        steps: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create API',
            description: 'Create authentication API',
            observablesSatisfied: [],
            dependsOn: [],
            filesToCreate: [],
            filesToModify: [],
            status: 'pending',
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, toolingRequirements: [new]} => adds new requirement', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', toolingRequirements: [] });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        toolingRequirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'PostgreSQL Driver',
            packageName: 'pg',
            reason: 'Database verification',
            requiredByObservables: [],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId only} => updates updatedAt', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        contexts: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Existing',
            description: 'Existing context',
            locator: { page: '/existing' },
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({ questId: 'nonexistent' });
      const result = await questModifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: nonexistent');
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();

      proxy.setupEmptyFolder();

      const input = ModifyQuestInputStub({ questId: 'any-quest' });
      const result = await questModifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });

  describe('graceful folder handling', () => {
    it('VALID: {folder does not exist} => creates folder and returns quest not found', async () => {
      const proxy = questModifyBrokerProxy();

      // With questsFolderEnsureBroker, folder is created automatically
      // Then folder is empty, so quest not found
      proxy.setupEmptyFolder();

      const input = ModifyQuestInputStub({ questId: 'any-quest' });
      const result = await questModifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });
});
