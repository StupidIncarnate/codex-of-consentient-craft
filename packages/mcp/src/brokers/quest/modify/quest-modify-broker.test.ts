import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questModifyBroker } from './quest-modify-broker';
import { questModifyBrokerProxy } from './quest-modify-broker.proxy';
import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
import { QuestDatabaseStub } from '../../../contracts/quest-database/quest-database.stub';

describe('questModifyBroker', () => {
  describe('successful modification', () => {
    it('VALID: {questId, contexts: [new]} => adds new context', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', contexts: [] });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

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

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.contexts).toHaveLength(1);
      expect(captured?.quests[0]?.contexts[0]?.name).toBe('Admin Page');
    });

    it('VALID: {questId, contexts: [existing]} => updates existing context', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        contexts: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Old Name',
            description: 'Old description',
            locator: { page: '/old' },
          },
        ],
      });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

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

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.contexts).toHaveLength(1);
      expect(captured?.quests[0]?.contexts[0]?.name).toBe('New Name');
      expect(captured?.quests[0]?.contexts[0]?.description).toBe('New description');
    });

    it('VALID: {questId, tasks: [new]} => adds new task', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', tasks: [] });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        tasks: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create auth service',
            type: 'implementation',
            status: 'pending',
            observableIds: [],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.tasks).toHaveLength(1);
      expect(captured?.quests[0]?.tasks[0]?.name).toBe('Create auth service');
    });

    it('VALID: {questId, observables: [new]} => adds new observable', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', observables: [] });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

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

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.observables).toHaveLength(1);
      expect(captured?.quests[0]?.observables[0]?.trigger).toBe('Click login button');
    });

    it('VALID: {questId, steps: [new]} => adds new step', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', steps: [] });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        steps: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create API',
            description: 'Create authentication API',
            taskLinks: [],
            observablesSatisfied: [],
            dependsOn: [],
            filesToCreate: [],
            filesToModify: [],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.steps).toHaveLength(1);
      expect(captured?.quests[0]?.steps[0]?.name).toBe('Create API');
    });

    it('VALID: {questId, toolingRequirements: [new]} => adds new requirement', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', toolingRequirements: [] });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

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

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.toolingRequirements).toHaveLength(1);
      expect(captured?.quests[0]?.toolingRequirements[0]?.name).toBe('PostgreSQL Driver');
    });

    it('VALID: {questId only} => updates updatedAt without changing arrays', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        contexts: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Existing',
            description: 'Existing context',
            locator: { page: '/existing' },
          },
        ],
      });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.contexts).toHaveLength(1);
      expect(captured?.quests[0]?.contexts[0]?.name).toBe('Existing');
      expect(captured?.quests[0]?.updatedAt).toBeDefined();
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth' });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

      const input = ModifyQuestInputStub({ questId: 'nonexistent' });
      const result = await questModifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: nonexistent');
    });

    it('ERROR: {empty database} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();

      proxy.setupEmptyDatabase();

      const input = ModifyQuestInputStub({ questId: 'any-quest' });
      const result = await questModifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });

  describe('upsert semantics', () => {
    it('VALID: {mixed new and existing items} => updates existing, adds new', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        contexts: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Existing Context',
            description: 'Will be updated',
            locator: { page: '/existing' },
          },
        ],
      });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contexts: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Updated Context',
            description: 'Has been updated',
            locator: { page: '/updated' },
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'New Context',
            description: 'Newly added',
            locator: { page: '/new' },
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.contexts).toHaveLength(2);
      expect(captured?.quests[0]?.contexts[0]?.name).toBe('Updated Context');
      expect(captured?.quests[0]?.contexts[1]?.name).toBe('New Context');
    });

    it('VALID: {existing items not in input} => remain unchanged', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        contexts: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Keep Me',
            description: 'Should remain',
            locator: { page: '/keep' },
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Update Me',
            description: 'Will be updated',
            locator: { page: '/update' },
          },
        ],
      });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ database });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contexts: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Updated',
            description: 'Has been updated',
            locator: { page: '/updated' },
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const captured = proxy.getCapturedDatabase();

      expect(captured?.quests[0]?.contexts).toHaveLength(2);
      expect(captured?.quests[0]?.contexts[0]?.name).toBe('Keep Me');
      expect(captured?.quests[0]?.contexts[1]?.name).toBe('Updated');
    });
  });

  describe('graceful folder handling', () => {
    it('VALID: {folder does not exist} => creates folder and returns quest not found', async () => {
      const proxy = questModifyBrokerProxy();

      // With questsFolderEnsureBroker, folder is created automatically
      // Then database is empty, so quest not found
      proxy.setupEmptyDatabase();

      const input = ModifyQuestInputStub({ questId: 'any-quest' });
      const result = await questModifyBroker({ input });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });
});
