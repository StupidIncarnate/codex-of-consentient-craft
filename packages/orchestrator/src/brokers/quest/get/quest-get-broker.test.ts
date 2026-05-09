import {
  DependencyStepStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestContractEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { GetQuestInputStub } from '@dungeonmaster/shared/contracts';
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
        steps: [DependencyStepStub()],
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
      const step = DependencyStepStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [FlowStub()],
        steps: [step],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'implementation' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.flows).toStrictEqual([]);
      expect(result.quest?.steps).toStrictEqual([step]);
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

  describe('slice filtering', () => {
    it('VALID: {slice: ["backend"], stage: "planning"} => returns only backend slice steps', async () => {
      const proxy = questGetBrokerProxy();
      const backendStep = DependencyStepStub({ id: 'backend-create-foo', slice: 'backend' });
      const frontendStep = DependencyStepStub({ id: 'frontend-render-bar', slice: 'frontend' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        steps: [backendStep, frontendStep],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'planning',
        slice: ['backend'],
      });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.steps).toStrictEqual([backendStep]);
    });

    it('VALID: {slice: ["backend", "frontend"], stage: "planning"} => returns both slice steps', async () => {
      const proxy = questGetBrokerProxy();
      const backendStep = DependencyStepStub({ id: 'backend-create-foo', slice: 'backend' });
      const frontendStep = DependencyStepStub({ id: 'frontend-render-bar', slice: 'frontend' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        steps: [backendStep, frontendStep],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'planning',
        slice: ['backend', 'frontend'],
      });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.steps).toStrictEqual([backendStep, frontendStep]);
    });

    it('VALID: {slice undefined, stage: "planning"} => returns all steps unchanged', async () => {
      const proxy = questGetBrokerProxy();
      const backendStep = DependencyStepStub({ id: 'backend-create-foo', slice: 'backend' });
      const frontendStep = DependencyStepStub({ id: 'frontend-render-bar', slice: 'frontend' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        steps: [backendStep, frontendStep],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'planning' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.steps).toStrictEqual([backendStep, frontendStep]);
    });

    it('EDGE: {slice: [], stage: "planning"} => returns no steps (empty array filter rejects everything)', async () => {
      const proxy = questGetBrokerProxy();
      const backendStep = DependencyStepStub({ id: 'backend-create-foo', slice: 'backend' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        steps: [backendStep],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'planning',
        slice: [],
      });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.steps).toStrictEqual([]);
    });

    it('EDGE: {slice: ["nonexistent"], stage: "planning"} => returns no steps (none match)', async () => {
      const proxy = questGetBrokerProxy();
      const backendStep = DependencyStepStub({ id: 'backend-create-foo', slice: 'backend' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        steps: [backendStep],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'planning',
        slice: ['nonexistent'],
      });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.steps).toStrictEqual([]);
    });

    it('VALID: {slice: ["backend"], stage: "spec"} => no-op for steps (already empty by stage), other sections unaffected', async () => {
      const proxy = questGetBrokerProxy();
      const backendStep = DependencyStepStub({ id: 'backend-create-foo', slice: 'backend' });
      const flow = FlowStub({
        nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        flows: [flow],
        steps: [backendStep],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'spec',
        slice: ['backend'],
      });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.steps).toStrictEqual([]);
      expect(result.quest?.flows).toStrictEqual([flow]);
    });

    it('VALID: {slice: ["backend"], stage: "planning"} => does NOT filter contracts (contracts have no slice field)', async () => {
      const proxy = questGetBrokerProxy();
      const backendStep = DependencyStepStub({ id: 'backend-create-foo', slice: 'backend' });
      const frontendStep = DependencyStepStub({ id: 'frontend-render-bar', slice: 'frontend' });
      const backendContract = QuestContractEntryStub({ id: 'backend-thing', name: 'BackendThing' });
      const frontendContract = QuestContractEntryStub({
        id: 'frontend-thing',
        name: 'FrontendThing',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        steps: [backendStep, frontendStep],
        contracts: [backendContract, frontendContract],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'planning',
        slice: ['backend'],
      });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.steps).toStrictEqual([backendStep]);
      expect(result.quest?.contracts).toStrictEqual([backendContract, frontendContract]);
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
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();

      proxy.setupEmptyFolder();

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest with id "any-quest" not found in any guild',
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
        error: 'Quest with id "any-quest" not found in any guild',
      });
    });
  });
});
