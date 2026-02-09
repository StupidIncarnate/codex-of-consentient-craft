import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
import { questModifyBroker } from './quest-modify-broker';
import { questModifyBrokerProxy } from './quest-modify-broker.proxy';

describe('questModifyBroker', () => {
  describe('successful modification', () => {
    it('VALID: {questId, contexts: [new]} => adds new context', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', contexts: [] });

      proxy.setupQuestFound({ quest, startPath });

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

      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, contexts: [existing]} => updates existing context', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
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

      proxy.setupQuestFound({ quest, startPath });

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

      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, steps: [new]} => adds new step', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', steps: [] });

      proxy.setupQuestFound({ quest, startPath });

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

      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, requirements: [new]} => adds new requirement', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', requirements: [] });

      proxy.setupQuestFound({ quest, startPath });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        requirements: [
          {
            id: 'b12ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'CLI Interactive Mode',
            description: 'Support interactive CLI prompts',
            scope: 'packages/cli',
            status: 'proposed',
          },
        ],
      });

      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, contracts: [new]} => adds new contract', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', contracts: [] });

      proxy.setupQuestFound({ quest, startPath });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contracts: [
          {
            id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginCredentials',
            kind: 'data',
            status: 'new',
            properties: [
              {
                name: 'email',
                type: 'EmailAddress',
                description: 'User email for authentication',
              },
            ],
          },
        ],
      });

      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, designDecisions: [new]} => adds new design decision', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', designDecisions: [] });

      proxy.setupQuestFound({ quest, startPath });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        designDecisions: [
          {
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
            relatedRequirements: [],
          },
        ],
      });

      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId only} => updates updatedAt', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
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

      proxy.setupQuestFound({ quest, startPath });

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(true);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest, startPath });

      const input = ModifyQuestInputStub({ questId: 'nonexistent' });
      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: nonexistent');
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupEmptyFolder({ startPath });

      const input = ModifyQuestInputStub({ questId: 'any-quest' });
      const result = await questModifyBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });
});
