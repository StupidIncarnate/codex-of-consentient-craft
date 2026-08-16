import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, environmentStatics } from '@dungeonmaster/shared/statics';

import { chaoswhispererGapMinionStatics } from '../../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { disciplineBelowBrowserStatics } from '../../../statics/discipline-below-browser/discipline-below-browser-statics';
import { disciplineImplementationStatics } from '../../../statics/discipline-implementation/discipline-implementation-statics';
import { disciplineManualQaStatics } from '../../../statics/discipline-manual-qa/discipline-manual-qa-statics';
import { operationOrchestratorPromptStatics } from '../../../statics/operation-orchestrator-prompt/operation-orchestrator-prompt-statics';
import { plannerMinionStatics } from '../../../statics/planner-minion/planner-minion-statics';
import { reviewerMinionStatics } from '../../../statics/reviewer-minion/reviewer-minion-statics';
import { workerMinionStatics } from '../../../statics/worker-minion/worker-minion-statics';

import { agentPromptGetBroker } from './agent-prompt-get-broker';
import { agentPromptGetBrokerProxy } from './agent-prompt-get-broker.proxy';

// One template serves all five operation-owning roles; only the pack at `$DISCIPLINE` and the bare
// discipline id at `$MY_DISCIPLINE` differ. Function-form replacement, never the string form: pack
// markdown can carry `$&` / `` $` `` / `$'`.
const IMPLEMENTATION_ORCHESTRATOR_TEMPLATE = operationOrchestratorPromptStatics.prompt.template
  .replace('$DISCIPLINE', () => disciplineImplementationStatics.orchestratorMarkdown)
  .replace('$MY_DISCIPLINE', () => 'implementation');
const BELOW_BROWSER_ORCHESTRATOR_TEMPLATE = operationOrchestratorPromptStatics.prompt.template
  .replace('$DISCIPLINE', () => disciplineBelowBrowserStatics.orchestratorMarkdown)
  .replace('$MY_DISCIPLINE', () => 'below-browser');
const MANUAL_QA_ORCHESTRATOR_TEMPLATE = operationOrchestratorPromptStatics.prompt.template
  .replace('$DISCIPLINE', () => disciplineManualQaStatics.orchestratorMarkdown)
  .replace('$MY_DISCIPLINE', () => 'manual-qa');

describe('agentPromptGetBroker', () => {
  describe('full {agent, questId, workItemId} path', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion, questId, workItemId} => returns prompt with $ARGUMENTS substituted', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        packagesAffected: [QuestPackageEntryStub({ name: 'orchestrator' })],
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
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result).toStrictEqual({
        name: 'codeweaver',
        model: 'opus',
        prompt: IMPLEMENTATION_ORCHESTRATOR_TEMPLATE.replace('$ARGUMENTS', expectedArgs),
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
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(
        MANUAL_QA_ORCHESTRATOR_TEMPLATE.replace('$ARGUMENTS', expectedArgs),
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
      proxy.setupNoDevServerConfig();

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
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(
        MANUAL_QA_ORCHESTRATOR_TEMPLATE.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('flowrider dev-server delivery', () => {
    it('EDGE: {role: flowrider, devServer config available} => prompt has NO Dev Server lines (Playwright webServer owns it)', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-3030-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-3030-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'flowrider',
        text: 'author the flow-perspective test suites',
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
        'Your operation item: [flowrider] author the flow-perspective test suites',
        '',
        'Operations ledger (in order):',
        '1. [>] [flowrider] author the flow-perspective test suites  <-- YOUR OPERATION ITEM',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(
        BELOW_BROWSER_ORCHESTRATOR_TEMPLATE.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('EDGE: {role: flowrider} => does not resolve dev-server config at all', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-3131-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-3131-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'flowrider',
        text: 'author the flow-perspective test suites',
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

      await agentPromptGetBroker({ agent: 'flowrider', questId: quest.id, workItemId });

      expect(proxy.getDevServerConfigStartPath()).toBe(undefined);
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

    it.each([
      ['planner-minion', 'opus', plannerMinionStatics, 'plannerMarkdown'] as const,
      ['worker-minion', 'sonnet', workerMinionStatics, 'workerMarkdown'] as const,
      ['reviewer-minion', 'opus', reviewerMinionStatics, 'reviewerMarkdown'] as const,
    ])(
      'VALID: {agent: %s, questId, discipline, no workItemId} => serves the template with that discipline pack substituted, on %s',
      async (agent, model, statics, packKey) => {
        agentPromptGetBrokerProxy();
        const questId = QuestIdStub({ value: 'add-auth' });

        const result = await agentPromptGetBroker({
          agent,
          questId,
          discipline: 'below-browser',
        });

        expect(result).toStrictEqual({
          name: agent,
          model,
          prompt: statics.prompt.template
            .replace('$DISCIPLINE', () => disciplineBelowBrowserStatics[packKey])
            .replace('$ARGUMENTS', () => `Quest ID: ${String(questId)}`),
        });
      },
    );

    // Serving a generic minion without its discipline would hand the agent the literal token
    // `$DISCIPLINE` in place of every instruction it has — a session that runs and does nothing.
    it.each(['planner-minion', 'worker-minion', 'reviewer-minion'])(
      'ERROR: {agent: %s, questId, no discipline} => throws naming every valid discipline',
      async (agent) => {
        agentPromptGetBrokerProxy();
        const questId = QuestIdStub({ value: 'add-auth' });

        await expect(agentPromptGetBroker({ agent, questId })).rejects.toThrow(
          /requires a discipline — one of: implementation \| bug-repro \| below-browser \| browser-e2e \| manual-qa/u,
        );
      },
    );

    it('ERROR: {agent: chaoswhisperer-gap-minion, questId, discipline} => throws takes-no-discipline', async () => {
      agentPromptGetBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      await expect(
        agentPromptGetBroker({
          agent: 'chaoswhisperer-gap-minion',
          questId,
          discipline: 'implementation',
        }),
      ).rejects.toThrow(/minion "chaoswhisperer-gap-minion" takes no discipline/u);
    });

    it('ERROR: {role agent, questId, no workItemId} => throws role-requires-workItemId', async () => {
      agentPromptGetBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      await expect(agentPromptGetBroker({ agent: 'codeweaver', questId })).rejects.toThrow(
        /role "codeweaver" requires a workItemId/u,
      );
    });
  });

  describe('a generic minion may not name a workItemId', () => {
    // The work-item branch ignores `discipline` entirely, so falling through refused these calls
    // for "no discipline" — pointing the caller at the one argument that was not its mistake. The
    // workItemId IS the mistake: it puts the caller inside `subagentStopNeedsBlockGuard`.
    it.each([
      ['planner-minion', 'implementation'] as const,
      ['worker-minion', 'below-browser'] as const,
      ['reviewer-minion', 'manual-qa'] as const,
    ])(
      'ERROR: {agent: %s, workItemId AND discipline} => throws naming the workItemId as the fault',
      async (agent, discipline) => {
        const proxy = agentPromptGetBrokerProxy();
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-7070-4222-9333-444444444444' });
        const quest = QuestStub({
          id: QuestIdStub({ value: 'add-auth' }),
          workItems: [WorkItemStub({ id: workItemId, role: 'codeweaver' })],
        });
        proxy.setupQuestFound({ quest });

        await expect(
          agentPromptGetBroker({ agent, questId: quest.id, workItemId, discipline }),
        ).rejects.toThrow(
          /must NOT be given a workItemId — not even its parent's\. Fetch with \{ agent, questId, discipline \} only: a workItemId puts the minion inside subagentStopNeedsBlockGuard/u,
        );
      },
    );

    it.each(['planner-minion', 'worker-minion', 'reviewer-minion'])(
      'ERROR: {agent: %s, workItemId, no discipline} => throws on the workItemId, not on the missing discipline',
      async (agent) => {
        const proxy = agentPromptGetBrokerProxy();
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-7171-4222-9333-444444444444' });
        const quest = QuestStub({
          id: QuestIdStub({ value: 'add-auth' }),
          workItems: [WorkItemStub({ id: workItemId, role: 'codeweaver' })],
        });
        proxy.setupQuestFound({ quest });

        await expect(
          agentPromptGetBroker({ agent, questId: quest.id, workItemId }),
        ).rejects.toThrow(/must NOT be given a workItemId/u);
      },
    );
  });

  describe('a role may not name its own discipline', () => {
    // A role's discipline is derived from its role. Accepting one off the call would let a
    // dispatched session fetch a sibling discipline's instructions for its own operation item.
    it.each(['codeweaver', 'pesteater', 'flowrider', 'groundstomper', 'siegemaster'])(
      'ERROR: {agent: %s, discipline supplied} => throws must-not-be-given-a-discipline',
      async (agent) => {
        const proxy = agentPromptGetBrokerProxy();
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-9090-4222-9333-444444444444' });
        const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
        const quest = QuestStub({
          id: QuestIdStub({ value: 'add-auth' }),
          workItems: [workItem],
        });
        proxy.setupQuestFound({ quest });

        await expect(
          agentPromptGetBroker({
            agent,
            questId: quest.id,
            workItemId,
            discipline: 'manual-qa',
          }),
        ).rejects.toThrow(/must not be given a discipline/u);
      },
    );
  });
});
