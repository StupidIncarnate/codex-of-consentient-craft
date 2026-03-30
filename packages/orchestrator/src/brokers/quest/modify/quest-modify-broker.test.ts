import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
import { questModifyBroker } from './quest-modify-broker';
import { questModifyBrokerProxy } from './quest-modify-broker.proxy';

describe('questModifyBroker', () => {
  describe('successful modification', () => {
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
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: { path: 'src/brokers/auth/create/auth-create-broker.ts' },
            accompanyingFiles: [],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, contracts: [new]} => adds new contract', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', contracts: [] });

      proxy.setupQuestFound({ quest });

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

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, designDecisions: [new]} => adds new design decision', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', designDecisions: [] });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        designDecisions: [
          {
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
            relatedNodeIds: [],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, flows: [new]} => adds new flow', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', flows: [] });

      proxy.setupQuestFound({ quest });

      const flow = FlowStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [flow],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, status: "explore_flows"} with quest at "created" => sets status on quest', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'created',
        flows: [FlowStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'explore_flows',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, status: "explore_observables"} with quest at "flows_approved" with observables in flow nodes => sets status on quest', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'explore_observables',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, title} => updates quest title', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', title: 'Old Title' });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        title: 'New Title',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId only} => updates updatedAt', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
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

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/not found in any guild$/u),
      });
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();

      proxy.setupEmptyFolder();

      const input = ModifyQuestInputStub({ questId: 'any-quest' });
      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/not found in any guild$/u),
      });
    });
  });

  describe('invalid status transitions', () => {
    it('ERROR: {status: "approved"} with quest at "created" => returns invalid transition error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', status: 'created' });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/^Invalid status transition.*$/u),
      });
    });

    it('ERROR: {status: "in_progress"} with quest at "created" => returns invalid transition error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', status: 'created' });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/^Invalid status transition.*$/u),
      });
    });
  });

  describe('missing gate content', () => {
    it('ERROR: {status: "flows_approved"} with empty flows => returns missing content error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_flows',
        flows: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'flows_approved',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(
          /^Missing required content for transition to flows_approved$/u,
        ),
      });
    });

    it('ERROR: {status: "approved"} with empty flows => returns missing content error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_observables',
        flows: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: expect.stringMatching(/^Missing required content for transition to approved$/u),
      });
    });
  });
});
