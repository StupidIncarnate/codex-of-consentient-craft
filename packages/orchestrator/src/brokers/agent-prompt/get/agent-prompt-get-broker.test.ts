import {
  DependencyStepStub,
  FlowStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import {
  dungeonmasterHomeStatics,
  environmentStatics,
  outcomeTypeDescriptionsStatics,
} from '@dungeonmaster/shared/statics';

import { chaoswhispererGapMinionStatics } from '../../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { siegemasterPromptStatics } from '../../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../../statics/spiritmender-prompt/spiritmender-prompt-statics';

import { agentPromptGetBroker } from './agent-prompt-get-broker';
import { agentPromptGetBrokerProxy } from './agent-prompt-get-broker.proxy';

const observableTypeReferenceLines = Object.entries(outcomeTypeDescriptionsStatics).map(
  ([type, desc]) => `  - \`${type}\` — ${desc}`,
);

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

  describe('spiritmender recovery batch delivery', () => {
    it('VALID: {role: spiritmender, sidecar present with filePaths+errors+verificationCommand+contextInstructions} => prompt carries the batch fields', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'spiritmender' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupSpiritmenderBatch({
        batchJson: JSON.stringify({
          filePaths: ['/src/brokers/login/login-broker.ts', '/src/guards/auth/auth-guard.ts'],
          errors: ['TS2339: property foo does not exist', 'lint: missing return type'],
          verificationCommand: 'npm run ward -- -- /src/brokers/login/login-broker.ts',
          contextInstructions: 'Ward failed on these files. Fix the type errors then re-run ward.',
        }),
      });

      const result = await agentPromptGetBroker({
        agent: 'spiritmender',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = [
        'Ward failed on these files. Fix the type errors then re-run ward.',
        '',
        'Files:',
        '  - /src/brokers/login/login-broker.ts',
        '  - /src/guards/auth/auth-guard.ts',
        'Errors:',
        '  - TS2339: property foo does not exist',
        '  - lint: missing return type',
        'Verification Command: npm run ward -- -- /src/brokers/login/login-broker.ts',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('spiritmender step-ref fallback (no sidecar)', () => {
    it('VALID: {role: spiritmender, no sidecar, steps/<id> relatedDataItem} => falls back to step file paths and does not throw', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'dddddddd-1111-4222-9333-444444444444' });
      const step = DependencyStepStub();
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `steps/${String(step.id)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        steps: [step],
        workItems: [workItem],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupNoSpiritmenderBatch();

      const result = await agentPromptGetBroker({
        agent: 'spiritmender',
        questId: quest.id,
        workItemId,
      });

      const expectedArgs = [
        'Files:',
        '  - src/brokers/login/create/login-create-broker.ts',
        '  - src/brokers/login/create/login-create-broker.test.ts',
        '  - src/brokers/login/create/login-create-broker.proxy.ts',
        'Run npm run ward on the files to verify fixes.',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('siegemaster dev-server delivery', () => {
    it('VALID: {role: siegemaster, runtime flow, devServer config resolves} => prompt includes Dev Server URL and Dev Command', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' });
      const flow = FlowStub({ flowType: 'runtime' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        flows: [flow],
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
        `Flow: ${String(flow.name)}`,
        '  flowType: runtime',
        `  entryPoint: ${String(flow.entryPoint)}`,
        `Dev Server URL: http://${environmentStatics.hostname}:4400`,
        'Dev Command: npm run dev',
        '',
        'Observable Type Reference:',
        ...observableTypeReferenceLines,
      ].join('\n');

      expect(result.prompt).toBe(
        siegemasterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: siegemaster, runtime flow} => resolves config from a repo-root config FILE path, not the bare cwd directory', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-2222-4222-9333-444444444444' });
      const flow = FlowStub({ flowType: 'runtime' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        flows: [flow],
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

    it('VALID: {role: siegemaster, operational flow, devServer config resolves} => prompt has NO Dev Server URL or Dev Command', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'ffffeeee-1111-4222-9333-444444444444' });
      const flow = FlowStub({ flowType: 'operational' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        flows: [flow],
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
        `Flow: ${String(flow.name)}`,
        '  flowType: operational',
        `  entryPoint: ${String(flow.entryPoint)}`,
        '',
        'Observable Type Reference:',
        ...observableTypeReferenceLines,
      ].join('\n');

      expect(result.prompt).toBe(
        siegemasterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
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
