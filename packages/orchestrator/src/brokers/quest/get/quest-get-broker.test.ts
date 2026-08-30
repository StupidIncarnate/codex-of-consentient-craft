import {
  DesignDecisionStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GetQuestInputStub,
  OperationItemStub,
  QuestBlightLedgerEntryStub,
  QuestContractEntryStub,
  QuestStub,
  ToolingRequirementStub,
} from '@dungeonmaster/shared/contracts';

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
      const flow = FlowStub({
        nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
      });
      const designDecision = DesignDecisionStub();
      const tooling = ToolingRequirementStub();
      const contractEntry = QuestContractEntryStub();
      const operation = OperationItemStub();
      const blight = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [flow],
        designDecisions: [designDecision],
        toolingRequirements: [tooling],
        contracts: [contractEntry],
        operations: [operation],
        planningNotes: { blightLedger: [blight] },
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect({
        flows: result.quest?.flows,
        designDecisions: result.quest?.designDecisions,
        toolingRequirements: result.quest?.toolingRequirements,
        contracts: result.quest?.contracts,
        operations: result.quest?.operations,
        planningNotes: result.quest?.planningNotes,
      }).toStrictEqual({
        flows: [flow],
        designDecisions: [designDecision],
        toolingRequirements: [tooling],
        contracts: [contractEntry],
        operations: [operation],
        planningNotes: {
          blightLedger: [],
          questNotes: [],
          operationPlans: [],
        },
      });
    });

    it('VALID: {stage: "planning"} => returns quest with only planningNotes, operations, contracts populated', async () => {
      const proxy = questGetBrokerProxy();
      const flow = FlowStub();
      const designDecision = DesignDecisionStub();
      const tooling = ToolingRequirementStub();
      const contractEntry = QuestContractEntryStub();
      const operation = OperationItemStub();
      const blight = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [flow],
        designDecisions: [designDecision],
        toolingRequirements: [tooling],
        contracts: [contractEntry],
        operations: [operation],
        planningNotes: { blightLedger: [blight] },
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'planning' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect({
        planningNotes: result.quest?.planningNotes,
        operations: result.quest?.operations,
        contracts: result.quest?.contracts,
        flows: result.quest?.flows,
        designDecisions: result.quest?.designDecisions,
        toolingRequirements: result.quest?.toolingRequirements,
      }).toStrictEqual({
        planningNotes: {
          blightLedger: [blight],
          questNotes: [],
          operationPlans: [],
        },
        operations: [operation],
        contracts: [contractEntry],
        flows: [],
        designDecisions: [],
        toolingRequirements: [],
      });
    });

    it('VALID: {stage: "implementation"} => returns the full picture, flows included, so plan-vs-reality is diagnosable', async () => {
      const proxy = questGetBrokerProxy();
      const flow = FlowStub();
      const tooling = ToolingRequirementStub();
      const contractEntry = QuestContractEntryStub();
      const operation = OperationItemStub();
      const blight = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [flow],
        toolingRequirements: [tooling],
        contracts: [contractEntry],
        operations: [operation],
        planningNotes: { blightLedger: [blight] },
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'implementation' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect({
        planningNotes: result.quest?.planningNotes,
        operations: result.quest?.operations,
        contracts: result.quest?.contracts,
        toolingRequirements: result.quest?.toolingRequirements,
        flows: result.quest?.flows,
      }).toStrictEqual({
        planningNotes: {
          blightLedger: [blight],
          questNotes: [],
          operationPlans: [],
        },
        operations: [operation],
        contracts: [contractEntry],
        toolingRequirements: [tooling],
        flows: [flow],
      });
    });

    it('VALID: {stage undefined} => returns full quest unchanged', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [FlowStub()],
        operations: [OperationItemStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input });

      expect(result.success).toBe(true);
      expect(result.quest?.flows).toStrictEqual([FlowStub()]);
      expect(result.quest?.operations).toStrictEqual([OperationItemStub()]);
    });
  });

  describe('flow slicing', () => {
    it('VALID: {flowId} => returns the rendered slice alongside the quest', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [
          FlowStub({
            id: 'login-flow',
            name: 'Log in',
            entryPoint: 'login-page',
            nodes: [FlowNodeStub({ id: 'login-page', label: 'Login page', packages: ['web'] })],
            edges: [],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', flowId: 'login-flow' });
      const result = await questGetBroker({ input });

      expect(
        String(result.flowSlice)
          .split('\n')
          .filter((line) => line.startsWith('## Flow:')),
      ).toStrictEqual(['## Flow: #login-flow — "Log in"']);
    });

    it('VALID: {flowId, packageName} => the slice marks that package’s node', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [
          FlowStub({
            id: 'login-flow',
            name: 'Log in',
            entryPoint: 'login-page',
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login page', packages: ['web', 'server'] }),
            ],
            edges: [],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({
        questId: 'add-auth',
        flowId: 'login-flow',
        packageName: 'server',
      });
      const result = await questGetBroker({ input });

      expect(
        String(result.flowSlice)
          .split('\n')
          .filter((line) => line.startsWith('[#login-page]')),
      ).toStrictEqual(['[#login-page] Login page (state) {web, server} ◀ YOURS']);
    });

    it('VALID: {packageName alone} => returns the foundation view, with no flow graph', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        flows: [
          FlowStub({
            id: 'login-flow',
            name: 'Log in',
            entryPoint: 'login-page',
            nodes: [FlowNodeStub({ id: 'login-page', label: 'Login page', packages: ['web'] })],
            edges: [],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth', packageName: 'web' });
      const result = await questGetBroker({ input });

      expect(
        String(result.flowSlice)
          .split('\n')
          .filter((line) => line.startsWith('## ')),
      ).toStrictEqual([
        '## Flows on this quest — fetch each one you own with get-quest({ questId, flowId })',
      ]);
    });

    // The stage path is a SIBLING entry point: a call that names no flow and no package still gets
    // exactly what it always got, with no rendered slice attached to it.
    it('EMPTY: {no flowId, no packageName} => no flowSlice on the result at all', async () => {
      const proxy = questGetBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input });

      expect(result.flowSlice).toBe(undefined);
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
