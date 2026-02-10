import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { GetQuestInputStub } from '../../../contracts/get-quest-input/get-quest-input.stub';
import { questGetBroker } from './quest-get-broker';
import { questGetBrokerProxy } from './quest-get-broker.proxy';

describe('questGetBroker', () => {
  describe('successful retrieval', () => {
    it('VALID: {questId exists} => returns quest', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
      });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('add-auth');
      expect(result.quest?.title).toBe('Add Authentication');
    });

    it('VALID: {questId with different folder} => returns quest', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'fix-bug', folder: '002-fix-bug', title: 'Fix Bug' });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'fix-bug' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('fix-bug');
      expect(result.quest?.title).toBe('Fix Bug');
    });
  });

  describe('stage filtering', () => {
    it('VALID: {stage: "spec"} => returns quest with only spec sections populated', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
          },
        ],
        steps: [
          {
            id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'CreateLoginBroker',
            description: 'Create login broker',
            observablesSatisfied: [],
            dependsOn: [],
            filesToCreate: [],
            filesToModify: [],
            status: 'pending',
          },
        ],
      });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(true);
      expect(result.quest?.requirements).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Auth',
          description: 'User auth',
          scope: 'packages/api',
          status: 'approved',
        },
      ]);
      expect(result.quest?.observables).toStrictEqual([
        {
          id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
          contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
          trigger: 'User submits login form',
          dependsOn: [],
          outcomes: [],
        },
      ]);
      expect(result.quest?.steps).toStrictEqual([]);
      expect(result.quest?.executionLog).toStrictEqual([]);
    });

    it('VALID: {stage: "implementation"} => returns quest with only steps and contracts', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        steps: [
          {
            id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'CreateLoginBroker',
            description: 'Create login broker',
            observablesSatisfied: [],
            dependsOn: [],
            filesToCreate: [],
            filesToModify: [],
            status: 'pending',
          },
        ],
      });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'implementation' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(true);
      expect(result.quest?.requirements).toStrictEqual([]);
      expect(result.quest?.steps).toStrictEqual([
        {
          id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'CreateLoginBroker',
          description: 'Create login broker',
          observablesSatisfied: [],
          dependsOn: [],
          filesToCreate: [],
          filesToModify: [],
          inputContracts: [],
          outputContracts: [],
          status: 'pending',
        },
      ]);
    });

    it('VALID: {stage undefined} => returns full quest unchanged', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
      });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(true);
      expect(result.quest?.requirements).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Auth',
          description: 'User auth',
          scope: 'packages/api',
          status: 'approved',
        },
      ]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'nonexistent' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: nonexistent');
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupEmptyFolder({ startPath });

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });

  describe('graceful folder handling', () => {
    it('VALID: {folder does not exist} => creates folder and returns quest not found', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupEmptyFolder({ startPath });

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });
});
