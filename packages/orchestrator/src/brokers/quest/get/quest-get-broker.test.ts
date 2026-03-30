import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { GetQuestInputStub } from '../../../contracts/get-quest-input/get-quest-input.stub';
import { questGetBroker } from './quest-get-broker';
import { questGetBrokerProxy } from './quest-get-broker.proxy';

describe('questGetBroker', () => {
  describe('successful retrieval', () => {
    it('VALID: {questId exists} => returns quest', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('add-auth');
      expect(result.quest?.title).toBe('Add Authentication');
    });

    it('VALID: {questId with different folder} => returns quest', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({ id: 'fix-bug', folder: '002-fix-bug', title: 'Fix Bug' });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'fix-bug' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('fix-bug');
      expect(result.quest?.title).toBe('Fix Bug');
    });
  });

  describe('stage filtering', () => {
    it('VALID: {stage: "spec"} => returns quest with only spec sections populated', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
          }),
        ],
        steps: [
          {
            id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'CreateLoginBroker',
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: {
              path: 'src/brokers/login/create/login-create-broker.ts',
            },
            accompanyingFiles: [],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.flows).toStrictEqual([
        FlowStub({
          nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
        }),
      ]);
      expect(result.quest?.steps).toStrictEqual([]);
      expect(result.quest?.steps).toStrictEqual([]);
    });

    it('VALID: {stage: "implementation"} => returns quest with only steps and contracts', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [FlowStub()],
        steps: [
          {
            id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'CreateLoginBroker',
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: {
              path: 'src/brokers/login/create/login-create-broker.ts',
            },
            accompanyingFiles: [],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'implementation' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.flows).toStrictEqual([]);
      expect(result.quest?.steps).toStrictEqual([
        {
          id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'CreateLoginBroker',
          assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
          observablesSatisfied: [],
          dependsOn: [],
          focusFile: {
            path: 'src/brokers/login/create/login-create-broker.ts',
          },
          accompanyingFiles: [],
          inputContracts: ['Void'],
          outputContracts: ['Void'],
          uses: [],
        },
      ]);
    });

    it('VALID: {stage undefined} => returns full quest unchanged', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [FlowStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.flows).toStrictEqual([FlowStub()]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'nonexistent' });
      const result = await questGetBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/not found in any guild$/u),
      });
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();

      proxy.setupEmptyFolder();

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/not found in any guild$/u),
      });
    });
  });

  describe('graceful folder handling', () => {
    it('VALID: {folder does not exist} => creates folder and returns quest not found', async () => {
      const proxy = questGetBrokerProxy();

      proxy.setupEmptyFolder();

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/not found in any guild$/u),
      });
    });
  });
});
