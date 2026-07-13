import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WardResultStub,
  WardRunIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { DevCommandStub } from '../../contracts/dev-command/dev-command.stub';
import { DevServerUrlStub } from '../../contracts/dev-server-url/dev-server-url.stub';
import { blightwardenDeadCodeMinionStatics } from '../../statics/blightwarden-dead-code-minion/blightwarden-dead-code-minion-statics';
import { blightwardenPromptStatics } from '../../statics/blightwarden-prompt/blightwarden-prompt-statics';
import { blightwardenSecurityMinionStatics } from '../../statics/blightwarden-security-minion/blightwarden-security-minion-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverMinionStatics } from '../../statics/codeweaver-minion/codeweaver-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { lawbringerMinionStatics } from '../../statics/lawbringer-minion/lawbringer-minion-statics';
import { lawbringerPromptStatics } from '../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { workItemToPromptTransformer } from './work-item-to-prompt-transformer';

describe('workItemToPromptTransformer', () => {
  describe('minion path (agent name is not a WorkItemRole)', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion} => substitutes Quest ID + Work Item ID', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {agent: codeweaver-minion, workItem.role: siegemaster} => minimal substitution regardless of workItem.role', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'siegemaster' });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver-minion' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        codeweaverMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {agent: lawbringer-minion} => substitutes Quest ID + Work Item ID', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'lawbringer-minion' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        lawbringerMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('blightwarden minion roles and pesteater (minimal substitution)', () => {
    it('VALID: {agent + role: blightwarden-security-minion} => substitutes Quest ID + Work Item ID', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-6666-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'blightwarden-security-minion' });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'blightwarden-security-minion' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        blightwardenSecurityMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {agent + role: blightwarden-dead-code-minion} => substitutes Quest ID + Work Item ID', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-6666-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'blightwarden-dead-code-minion' });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'blightwarden-dead-code-minion' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        blightwardenDeadCodeMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {agent + role: pesteater} => substitutes Quest ID + Work Item ID (reads quest itself, no operations ref)', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-6666-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'pesteater', relatedDataItems: [] });
      const quest = QuestStub({ id: questId, questType: 'bug-hunt', workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'pesteater' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        pesteaterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('ward role (dispatched via run-ward, not get-agent-prompt)', () => {
    it('ERROR: {workItem.role: ward} => throws run-ward dispatch error', () => {
      const workItem = WorkItemStub({ role: 'ward' });
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        }),
      ).toThrow(/ward work items are dispatched via the run-ward MCP tool/u);
    });
  });

  describe('chat roles (chaoswhisperer/glyphsmith are not served by get-agent-prompt)', () => {
    it('ERROR: {workItem.role: chaoswhisperer} => throws not-served-by-get-agent-prompt error', () => {
      const workItem = WorkItemStub({ role: 'chaoswhisperer' });
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        }),
      ).toThrow(/role chaoswhisperer is not served by get-agent-prompt/u);
    });

    it('ERROR: {workItem.role: glyphsmith} => throws not-served-by-get-agent-prompt error', () => {
      const workItem = WorkItemStub({ role: 'glyphsmith' });
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        }),
      ).toThrow(/role glyphsmith is not served by get-agent-prompt/u);
    });
  });

  describe('operation-context substitution (relay path)', () => {
    it('VALID: {role: codeweaver, one linked operation} => substitutes exact operation-relay $ARGUMENTS', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-2222-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-2222-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'pending',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [codeweaver] core: config load+validate adapter',
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] core: config load+validate adapter  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result.prompt).toBe(
        codeweaverPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: blightwarden, one linked operation} => substitutes exact operation-relay $ARGUMENTS', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-7777-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-7777-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'blightwarden',
        text: 'judge minion reports and clean up',
        status: 'pending',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'blightwarden',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'blightwarden' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [blightwarden] judge minion reports and clean up',
        '',
        'Operations ledger (in order):',
        '1. [ ] [blightwarden] judge minion reports and clean up  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result.prompt).toBe(
        blightwardenPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: lawbringer, ledger with complete/in_progress(wardMode)/pending} => renders ledger markers + YOUR OPERATION ITEM suffix', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-3333-4222-9333-444444444444' });
      const op1Id = OperationItemIdStub({ value: '11111111-3333-4222-9333-444444444444' });
      const op2Id = OperationItemIdStub({ value: '22222222-3333-4222-9333-444444444444' });
      const op3Id = OperationItemIdStub({ value: '33333333-3333-4222-9333-444444444444' });
      const op1 = OperationItemStub({
        id: op1Id,
        role: 'codeweaver',
        text: 'implement broker',
        status: 'complete',
      });
      const op2 = OperationItemStub({
        id: op2Id,
        role: 'ward',
        text: 'run full ward',
        status: 'in_progress',
        wardMode: 'full',
      });
      const op3 = OperationItemStub({
        id: op3Id,
        role: 'lawbringer',
        text: 'review changes',
        status: 'pending',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(op3Id)}` })],
      });
      const quest = QuestStub({
        id: questId,
        operations: [op1, op2, op3],
        workItems: [workItem],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'lawbringer' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(op3Id)}`,
        'Your operation item: [lawbringer] review changes',
        '',
        'Operations ledger (in order):',
        '1. [x] [codeweaver] implement broker',
        '2. [>] [ward full] run full ward',
        '3. [ ] [lawbringer] review changes  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result.prompt).toBe(
        lawbringerPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    describe('dev-server pass-through for flowrider/siegemaster', () => {
      const cases = [
        ['flowrider', flowriderPromptStatics] as const,
        ['siegemaster', siegemasterPromptStatics] as const,
      ];

      it.each(cases)(
        'VALID: {role: %s, devServer provided} => appends Dev Server Command + Dev Server URL lines',
        (role, statics) => {
          const questId = QuestIdStub({ value: 'my-quest' });
          const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-4444-4222-9333-444444444444' });
          const operationId = OperationItemIdStub({
            value: 'ffffffff-4444-4222-9333-444444444444',
          });
          const operation = OperationItemStub({
            id: operationId,
            role,
            text: 'own flows/ + startup/ files',
            status: 'in_progress',
          });
          const workItem = WorkItemStub({
            id: workItemId,
            role,
            relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
          });
          const quest = QuestStub({
            id: questId,
            operations: [operation],
            workItems: [workItem],
          });

          const result = workItemToPromptTransformer({
            quest,
            workItem,
            agentName: AgentPromptNameStub({ value: role }),
            devServer: {
              devCommand: DevCommandStub({ value: 'npm run dev' }),
              devServerUrl: DevServerUrlStub({ value: 'http://localhost:3000' }),
            },
          });

          const expectedArgs = [
            `Quest ID: ${String(questId)}`,
            `Work Item ID: ${String(workItemId)}`,
            `Operation Item ID: ${String(operationId)}`,
            `Your operation item: [${role}] own flows/ + startup/ files`,
            '',
            'Operations ledger (in order):',
            `1. [>] [${role}] own flows/ + startup/ files  <-- YOUR OPERATION ITEM`,
            '',
            'Dev Server Command: npm run dev',
            'Dev Server URL: http://localhost:3000',
          ].join('\n');

          expect(result.prompt).toBe(statics.prompt.template.replace('$ARGUMENTS', expectedArgs));
        },
      );
    });

    it('EDGE: {role: flowrider, no devServer} => omits Dev Server Command/URL lines', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5555-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5555-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'flowrider',
        text: 'own flows/ + startup/ files',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'flowrider',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'flowrider' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [flowrider] own flows/ + startup/ files',
        '',
        'Operations ledger (in order):',
        '1. [>] [flowrider] own flows/ + startup/ files  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result.prompt).toBe(
        flowriderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: spiritmender, latest wardResult failed with runId} => appends Failed ward result + Ward detail blob lines', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8888-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8888-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const wardResult = WardResultStub({
        id: 'cccccccc-8888-4222-9333-444444444444',
        exitCode: 1,
        wardMode: 'changed',
        runId: WardRunIdStub({ value: 'run-123' }),
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
        '',
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
        '',
        'Failed ward result: cccccccc-8888-4222-9333-444444444444 (mode: changed, runId: run-123)',
        'Ward detail blob: <questFolder>/ward-results/cccccccc-8888-4222-9333-444444444444.json',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: spiritmender, multiple wardResults, latest failed has no runId} => uses the latest failed entry and omits the runId segment', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-9999-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-9999-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const wardResultPassing = WardResultStub({
        id: 'dddddddd-9999-4222-9333-444444444444',
        exitCode: 0,
      });
      const wardResultFailedWithRunId = WardResultStub({
        id: 'eeeeeeee-9999-4222-9333-444444444444',
        exitCode: 1,
        wardMode: 'changed',
        runId: WardRunIdStub({ value: 'run-earlier' }),
      });
      const wardResultFailedNoRunId = WardResultStub({
        id: 'ffffffff-9999-4222-9333-444444444444',
        exitCode: 1,
        wardMode: 'full',
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [wardResultPassing, wardResultFailedWithRunId, wardResultFailedNoRunId],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
        '',
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
        '',
        'Failed ward result: ffffffff-9999-4222-9333-444444444444 (mode: full)',
        'Ward detail blob: <questFolder>/ward-results/ffffffff-9999-4222-9333-444444444444.json',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('EDGE: {role: spiritmender, wardResults empty} => omits Failed ward result lines', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1010-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-1010-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
        '',
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('EDGE: {role: spiritmender, all wardResults exitCode 0} => omits Failed ward result lines', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1212-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-1212-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const wardResultPassing = WardResultStub({
        id: 'cccccccc-1212-4222-9333-444444444444',
        exitCode: 0,
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [wardResultPassing],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
        '',
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    describe('missing operations reference', () => {
      it('EDGE: {role: codeweaver, empty relatedDataItems} => throws no-resolvable-operations-ref error', () => {
        const workItem = WorkItemStub({ role: 'codeweaver', relatedDataItems: [] });
        const quest = QuestStub({ workItems: [workItem] });

        expect(() =>
          workItemToPromptTransformer({
            quest,
            workItem,
            agentName: AgentPromptNameStub({ value: 'codeweaver' }),
          }),
        ).toThrow(/has no resolvable operations\/<id> reference/u);
      });

      it('ERROR: {role: codeweaver, relatedDataItems references an operation absent from quest.operations} => throws no-resolvable-operations-ref error', () => {
        const workItem = WorkItemStub({
          role: 'codeweaver',
          relatedDataItems: [
            RelatedDataItemStub({ value: 'operations/aaaaaaaa-1313-4222-9333-444444444444' }),
          ],
        });
        const quest = QuestStub({ operations: [], workItems: [workItem] });

        expect(() =>
          workItemToPromptTransformer({
            quest,
            workItem,
            agentName: AgentPromptNameStub({ value: 'codeweaver' }),
          }),
        ).toThrow(/has no resolvable operations\/<id> reference/u);
      });
    });
  });

  describe('errors', () => {
    it('ERROR: {agent: unknown name} => throws ZodError', () => {
      const workItem = WorkItemStub();
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: 'unknown-agent',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
