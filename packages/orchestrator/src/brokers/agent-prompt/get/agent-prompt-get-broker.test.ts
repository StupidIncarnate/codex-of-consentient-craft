import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, environmentStatics } from '@dungeonmaster/shared/statics';

import { chaoswhispererGapMinionStatics } from '../../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPromptStatics } from '../../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../../statics/flowrider-prompt/flowrider-prompt-statics';
import { siegemasterPromptStatics } from '../../../statics/siegemaster-prompt/siegemaster-prompt-statics';

import { agentPromptGetBroker } from './agent-prompt-get-broker';
import { agentPromptGetBrokerProxy } from './agent-prompt-get-broker.proxy';

describe('agentPromptGetBroker', () => {
  describe('full {agent, questId, workItemId} path', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion, questId, workItemId} => returns prompt with $ARGUMENTS substituted', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        packagesAffected: ['orchestrator'],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await agentPromptGetBroker({
        agent: 'chaoswhisperer-gap-minion',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItemId)}`;

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });

    it('ERROR: {agent, questId, workItemId not on quest} => throws workItem-not-found error', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const missingId = QuestWorkItemIdStub({ value: 'ffffffff-1111-4222-9333-444444444444' });

      await expect(
        agentPromptGetBroker({
          agent: 'chaoswhisperer-gap-minion',
          questId: quest.id,
          workItemId: missingId,
        }),
      ).rejects.toThrow(/workItem .* not found on quest/u);
    });
  });

  describe('session id capture path', () => {
    it('VALID: {agent, questId, workItemId} => broker returns substituted prompt WITHOUT persisting sessionId (Fallback B defer-to-line-emit)', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await agentPromptGetBroker({
        agent: 'chaoswhisperer-gap-minion',
        questId: quest.id,
        workItemId,
      });

      // Returned prompt is the chaoswhisperer-gap-minion template with $ARGUMENTS substituted...
      const expectedArgs = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
      // ... and the work item on disk still has no sessionId (broker did not call quest-persist).
      // workItem.sessionId is undefined under Fallback B until chat-line convergence picks it up.
      expect(workItem.sessionId).toBe(undefined);
    });
  });

  describe('operation-context relay path', () => {
    it('VALID: {role: codeweaver, operation linked on loaded quest} => prompt carries the operation-relay context resolved from the loaded quest', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-2020-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-2020-4222-9333-444444444444' });
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
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [operation],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await agentPromptGetBroker({
        agent: 'codeweaver',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = [
        `Quest ID: ${String(quest.id)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [codeweaver] core: config load+validate adapter',
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] core: config load+validate adapter  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result).toStrictEqual({
        name: 'codeweaver',
        model: 'opus',
        prompt: codeweaverPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });

    it('ERROR: {role: codeweaver, relatedDataItems empty} => rejects with no-resolvable-operations-ref error', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-2020-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver', relatedDataItems: [] });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      await expect(
        agentPromptGetBroker({ agent: 'codeweaver', questId: quest.id, workItemId }),
      ).rejects.toThrow(/has no resolvable operations\/<id> reference/u);
    });
  });

  describe('siegemaster dev-server delivery', () => {
    it('VALID: {role: siegemaster, operation linked, devServer config resolves} => prompt includes Dev Server Command and Dev Server URL', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'ffffffff-1111-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'siegemaster',
        text: 'manual QA + review flowrider suite',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [operation],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupDevServer({ devCommand: 'npm run dev', port: 4400 });

      const result = await agentPromptGetBroker({
        agent: 'siegemaster',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = [
        `Quest ID: ${String(quest.id)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [siegemaster] manual QA + review flowrider suite',
        '',
        'Operations ledger (in order):',
        '1. [>] [siegemaster] manual QA + review flowrider suite  <-- YOUR OPERATION ITEM',
        '',
        'Dev Server Command: npm run dev',
        `Dev Server URL: http://${environmentStatics.hostname}:4400`,
      ].join('\n');

      expect(result.prompt).toBe(
        siegemasterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: siegemaster, operation linked} => resolves config from a repo-root config FILE path, not the bare cwd directory', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-2222-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'ffffffff-2222-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'siegemaster',
        text: 'manual QA + review flowrider suite',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [operation],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupDevServer({ devCommand: 'npm run dev', port: 4400 });

      await agentPromptGetBroker({
        agent: 'siegemaster',
        questId: quest.id,
        workItemId,
      });

      // The config-find chain dirname()s startPath on its first iteration (it expects a FILE).
      // Passing the bare cwd directory makes it search from cwd's PARENT and miss the repo-root
      // .dungeonmaster.json, silently dropping the dev-server injection. The broker MUST pass a
      // resolvable file at the repo root: <cwd>/.dungeonmaster.json (cwd mock = '/default/cwd').
      expect(proxy.getDevServerConfigStartPath()).toBe(
        `/default/cwd/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
      );
    });

    it('EDGE: {role: siegemaster, no devServer config resolved} => prompt has NO Dev Server Command or Dev Server URL', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'ffffeeee-1111-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'ffffeeee-2222-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'siegemaster',
        text: 'manual QA + review flowrider suite',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [operation],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await agentPromptGetBroker({
        agent: 'siegemaster',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = [
        `Quest ID: ${String(quest.id)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [siegemaster] manual QA + review flowrider suite',
        '',
        'Operations ledger (in order):',
        '1. [>] [siegemaster] manual QA + review flowrider suite  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result.prompt).toBe(
        siegemasterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('flowrider dev-server delivery', () => {
    it('VALID: {role: flowrider, operation linked, devServer config resolves} => prompt includes Dev Server Command and Dev Server URL', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-3030-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-3030-4222-9333-444444444444' });
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
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [operation],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupDevServer({ devCommand: 'npm run dev', port: 4400 });

      const result = await agentPromptGetBroker({
        agent: 'flowrider',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = [
        `Quest ID: ${String(quest.id)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [flowrider] own flows/ + startup/ files',
        '',
        'Operations ledger (in order):',
        '1. [>] [flowrider] own flows/ + startup/ files  <-- YOUR OPERATION ITEM',
        '',
        'Dev Server Command: npm run dev',
        `Dev Server URL: http://${environmentStatics.hostname}:4400`,
      ].join('\n');

      expect(result.prompt).toBe(
        flowriderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('dev-server resolution scoping', () => {
    it('EDGE: {role: codeweaver} => does not resolve dev-server config', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'dddddddd-3030-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'eeeeeeee-3030-4222-9333-444444444444' });
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
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [operation],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });

      await agentPromptGetBroker({ agent: 'codeweaver', questId: quest.id, workItemId });

      expect(proxy.getDevServerConfigStartPath()).toBe(undefined);
    });
  });

  describe('minion-fetch path (no workItemId)', () => {
    it('VALID: {minion agent, questId, no workItemId} => returns served template with Quest ID substituted', async () => {
      agentPromptGetBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await agentPromptGetBroker({
        agent: 'chaoswhisperer-gap-minion',
        questId,
      });

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template.replace(
          '$ARGUMENTS',
          `Quest ID: ${String(questId)}`,
        ),
      });
    });

    it('ERROR: {role agent, questId, no workItemId} => throws role-requires-workItemId', async () => {
      agentPromptGetBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      await expect(agentPromptGetBroker({ agent: 'codeweaver', questId })).rejects.toThrow(
        /role "codeweaver" requires a workItemId/u,
      );
    });
  });
});
