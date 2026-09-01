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

import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { chaoswhispererGapMinionStatics } from '../../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPromptStatics } from '../../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { codeweaverReviewerStatics } from '../../../statics/codeweaver-reviewer/codeweaver-reviewer-statics';
import { flowriderPromptStatics } from '../../../statics/flowrider-prompt/flowrider-prompt-statics';
import { flowriderReviewerStatics } from '../../../statics/flowrider-reviewer/flowrider-reviewer-statics';
import { roleToModelStatics } from '../../../statics/role-to-model/role-to-model-statics';
import { siegemasterPromptStatics } from '../../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { siegemasterReviewerStatics } from '../../../statics/siegemaster-reviewer/siegemaster-reviewer-statics';
import { siegemasterWalkerStatics } from '../../../statics/siegemaster-walker/siegemaster-walker-statics';

import { agentPromptGetBroker } from './agent-prompt-get-broker';
import { agentPromptGetBrokerProxy } from './agent-prompt-get-broker.proxy';

// Every minion name, paired with the model it runs on and the ONE file it is served. The templates
// are READ from each statics rather than transcribed, so a prompt edited in place is compared
// against its new text.
const MINION_PROMPTS = new Map([
  ['chaoswhisperer-gap-minion', ['sonnet', chaoswhispererGapMinionStatics.prompt.template]],
  ['codeweaver-reviewer', ['sonnet', codeweaverReviewerStatics.prompt.template]],
  ['flowrider-reviewer', ['sonnet', flowriderReviewerStatics.prompt.template]],
  ['siegemaster-reviewer', ['sonnet', siegemasterReviewerStatics.prompt.template]],
  ['siegemaster-walker', ['sonnet', siegemasterWalkerStatics.prompt.template]],
]);

// The case LISTS are derived from the classification statics, never transcribed — a prompt added
// there joins every matrix below on the day it is added. A minion added without a row in the map
// above still gets a case here, and fails against an empty expectation rather than being skipped.
const ROLE_NAMES = [...agentPromptClassificationStatics.roleNames];
const MINION_FETCH_CASES = agentPromptClassificationStatics.minionNames.map((name) => [
  name,
  ...(MINION_PROMPTS.get(name) ?? []),
]);

// Every minion the workItemId refusal binds: `minionNames` minus the spec-phase gap minion. That
// one runs before any operation item exists, so there is no relay for a stray workItemId to advance
// and the broker exempts it by name — the case below the matrix.
const OPERATOR_MINION_NAMES = agentPromptClassificationStatics.minionNames.filter(
  (name) => name !== 'chaoswhisperer-gap-minion',
);

// Siegemaster ALONE stands a dev server up, so the honest denominator for "nobody else resolves
// one" is every OTHER role rather than the two the old suite happened to name.
const NON_SIEGEMASTER_ROLE_NAMES = agentPromptClassificationStatics.roleNames.filter(
  (name) => name !== 'siegemaster',
);

// Two DIFFERENT worktree HEADs, so a stamp that moved is distinguishable from one that held.
const FIRST_ROUND_SHA = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
const LATER_ROUND_SHA = 'ffffffffeeeeeeeeddddddddccccccccbbbbbbbb';

describe('agentPromptGetBroker', () => {
  describe('minion-fetch path — { agent, questId } and nothing else', () => {
    // NOTHING is staged on the proxy here, and that IS the assertion about quest loading: the
    // find-quest-path and quest-load chains throw on an unstaged address, so a broker that loaded
    // the quest could never reach a returned prompt at all. The empty stamp list and the absent
    // git argv say the same thing about the start-ref spawn.
    it.each(MINION_FETCH_CASES)(
      'VALID: {agent: %s, questId, no workItemId} => serves that minion its own template with $ARGUMENTS replaced by the quest id, loading no quest',
      async (agent, model, template) => {
        const proxy = agentPromptGetBrokerProxy();
        const questId = QuestIdStub({ value: 'add-auth' });

        const result = await agentPromptGetBroker({ agent, questId });

        expect({
          result,
          stamped: proxy.getStampedWorkItems(),
          gitArgs: proxy.getGitSpawnedArgs(),
        }).toStrictEqual({
          result: {
            name: agent,
            model,
            prompt: template.replace('$ARGUMENTS', () => `Quest ID: ${String(questId)}`),
          },
          stamped: [],
          gitArgs: undefined,
        });
      },
    );
  });

  // REFUSAL 1. The workItemId is what puts the caller inside `subagentStopNeedsBlockGuard`, which
  // holds its turn open until it calls `signal-back` — and the only item a minion could signal on
  // is its PARENT's, completing the parent's scope mid-round. The message is asserted WHOLE because
  // the wording is the protection: softened to a generic "bad arguments" it would send the minion
  // off to fix the one argument that was not its mistake.
  describe('a minion may not be given a workItemId, not even its parent’s', () => {
    it.each(OPERATOR_MINION_NAMES)(
      'ERROR: {agent: %s, questId, workItemId} => throws naming the workItemId as the fault',
      async (agent) => {
        agentPromptGetBrokerProxy();
        const questId = QuestIdStub({ value: 'add-auth' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-7070-4222-9333-444444444444' });

        await expect(agentPromptGetBroker({ agent, questId, workItemId })).rejects.toThrow(
          `agentPromptGetBroker: minion "${agent}" must NOT be given a workItemId — not even its parent's. Fetch with { agent, questId } only: a workItemId puts the minion inside subagentStopNeedsBlockGuard, which holds its turn open until it calls signal-back, and the only item it could signal on is its parent's operation item — completing the parent's scope while the parent is still working`,
        );
      },
    );

    // The one exemption, and it is a spec-phase fact rather than a leniency: the gap minion runs
    // before any operation item exists, so a workItemId it carries can advance no relay. It is
    // served the work-item context block — Quest ID AND Work Item ID — exactly as it was before the
    // prompts were split per role.
    it('VALID: {agent: chaoswhisperer-gap-minion, questId, workItemId} => is served its template with Quest ID and Work Item ID substituted', async () => {
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

      const expectedArgs = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItemId)}`;

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template.replace(
          '$ARGUMENTS',
          () => expectedArgs,
        ),
      });
    });
  });

  // REFUSAL 2. A role name is dispatched as its own work item by /dumpster-launch; without the id
  // there is no operation item to resolve and no session for the stop guard to hold open.
  describe('a role must supply its workItemId', () => {
    it.each(ROLE_NAMES)(
      'ERROR: {agent: %s, questId, no workItemId} => throws role-requires-a-workItemId naming the role',
      async (agent) => {
        agentPromptGetBrokerProxy();
        const questId = QuestIdStub({ value: 'add-auth' });

        await expect(agentPromptGetBroker({ agent, questId })).rejects.toThrow(
          `agentPromptGetBroker: role "${agent}" requires a workItemId`,
        );
      },
    );
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
      ].join('\n');

      expect(result).toStrictEqual({
        name: 'codeweaver',
        // Read from the role map rather than restated: that map is what the CLI `--model` flag
        // resolves through at spawn time, so a literal here could report one model while the
        // dispatched child ran another.
        model: roleToModelStatics.codeweaver,
        prompt: codeweaverPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });

    it('ERROR: {agent: codeweaver, questId, workItemId not on quest} => throws workItem-not-found error', async () => {
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
          agent: 'codeweaver',
          questId: quest.id,
          workItemId: missingId,
        }),
      ).rejects.toThrow(
        `agentPromptGetBroker: workItem ${String(missingId)} not found on quest ${String(quest.id)}`,
      );
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
        'Dev Server Command: npm run dev',
        `Dev Server URL: http://${environmentStatics.hostname}:4400`,
      ].join('\n');

      expect(result.prompt).toBe(
        siegemasterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: siegemaster, devServer declares webPort} => Dev Server URL carries the WEB port, not the API port', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-3333-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'ffffffff-3333-4222-9333-444444444444' });
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
      proxy.setupDevServer({ devCommand: 'npm run dev', port: 4400, webPort: 4401 });

      const result = await agentPromptGetBroker({
        agent: 'siegemaster',
        questId: quest.id,
        workItemId,
      });

      // 4401, never 4400. This is the one URL a hands-on QA session loads in a BROWSER, and the
      // API origin renders no app — so the whole prompt is compared, which is what proves the
      // API port appears nowhere in it.
      const expectedArgs = [
        `Quest ID: ${String(quest.id)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [siegemaster] manual QA + review flowrider suite',
        '',
        'Dev Server Command: npm run dev',
        `Dev Server URL: http://${environmentStatics.hostname}:4401`,
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
      ].join('\n');

      expect(result.prompt).toBe(
        siegemasterPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  describe('flowrider is served no dev server even when one is configured', () => {
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
      ].join('\n');

      expect(result.prompt).toBe(
        flowriderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });
  });

  // The dev server is Siegemaster's ALONE — it stands one up by hand at its Gate 5 and owns it for
  // the whole session. Every OTHER role is cycled here rather than the two the old suite named, so
  // a role added to `roleNames` cannot quietly start resolving a config nobody meant it to have.
  describe('dev-server resolution scoping', () => {
    it.each(NON_SIEGEMASTER_ROLE_NAMES)(
      'EDGE: {role: %s, devServer config available} => does not resolve dev-server config at all',
      async (agent) => {
        const proxy = agentPromptGetBrokerProxy();
        const workItemId = QuestWorkItemIdStub({ value: 'dddddddd-3030-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'eeeeeeee-3030-4222-9333-444444444444' });
        const operation = OperationItemStub({
          id: operationId,
          role: agent,
          text: 'core: config load+validate adapter',
          status: 'pending',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: agent,
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({
          id: QuestIdStub({ value: 'add-auth' }),
          operations: [operation],
          workItems: [workItem],
        });
        proxy.setupQuestFound({ quest });
        proxy.setupDevServer({ devCommand: 'npm run dev', port: 4400 });

        await agentPromptGetBroker({ agent, questId: quest.id, workItemId });

        expect(proxy.getDevServerConfigStartPath()).toBe(undefined);
      },
    );
  });

  // `startRef` is the fork point of ONE work item's output. `signal-back` rebuilds the standards
  // review checklist over `<startRef>..HEAD`, so a stamp that never lands, or one that moves,
  // silently shrinks what gets reviewed.
  describe('start-ref stamp', () => {
    it('VALID: {work item with no startRef, worktree HEAD readable} => stamps that sha onto the item and reads it with `git rev-parse HEAD`', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5050-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5050-4222-9333-444444444444' });
      const relatedDataItems = [
        RelatedDataItemStub({ value: `operations/${String(operationId)}` }),
      ];
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [OperationItemStub({ id: operationId, role: 'codeweaver' })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems,
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupWorktreeHead({ sha: FIRST_ROUND_SHA });

      await agentPromptGetBroker({ agent: 'codeweaver', questId: quest.id, workItemId });

      // The WHOLE work item is compared, which is what proves the stamp writes `startRef` and
      // nothing else — no sessionId, no agentId. Session identity is captured by the JSONL watcher
      // off the sub-agent's first line, never by this broker.
      expect({
        stamped: proxy.getStampedWorkItems(),
        gitArgs: proxy.getGitSpawnedArgs(),
      }).toStrictEqual({
        stamped: [
          [
            WorkItemStub({
              id: workItemId,
              role: 'codeweaver',
              status: 'in_progress',
              relatedDataItems,
              startRef: FIRST_ROUND_SHA,
            }),
          ],
        ],
        gitArgs: ['rev-parse', 'HEAD'],
      });
    });

    // THE RESUME GUARD. A re-served prompt is routine — orphan recovery resumes the same item, a
    // redelivered fetch repeats it — and by then HEAD already carries this item's own commits. A
    // second stamp would move the base forward past them, so the gate would measure an empty range
    // and pass on a round nobody reviewed.
    it('VALID: {second fetch for a work item that already carries a startRef} => nothing is stamped and git is never read', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5151-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5151-4222-9333-444444444444' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [OperationItemStub({ id: operationId, role: 'codeweaver' })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
            startRef: FIRST_ROUND_SHA,
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupWorktreeHead({ sha: LATER_ROUND_SHA });

      await agentPromptGetBroker({ agent: 'codeweaver', questId: quest.id, workItemId });

      expect({
        stamped: proxy.getStampedWorkItems(),
        gitArgs: proxy.getGitSpawnedArgs(),
      }).toStrictEqual({ stamped: [], gitArgs: undefined });
    });

    // The same guard one layer deeper: two fetches racing on one work item both read `undefined`
    // before either persists, so the pre-check above cannot be the only one. `setupLockedQuest`
    // stages the quest the persist re-reads INSIDE the per-quest lock — already stamped by the
    // fetch that got there first.
    it('VALID: {quest.json already stamped by the time the persist takes the lock} => the update callback returns no change, so git ran but nothing was written', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5252-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5252-4222-9333-444444444444' });
      const relatedDataItems = [
        RelatedDataItemStub({ value: `operations/${String(operationId)}` }),
      ];
      const questAtFetch = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [OperationItemStub({ id: operationId, role: 'codeweaver' })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems,
          }),
        ],
      });
      const questUnderLock = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [OperationItemStub({ id: operationId, role: 'codeweaver' })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems,
            startRef: FIRST_ROUND_SHA,
          }),
        ],
      });
      proxy.setupQuestFound({ quest: questAtFetch });
      // AFTER setupQuestFound, which points the lock at the same quest the fs chain serves.
      proxy.setupLockedQuest({ quest: questUnderLock });
      proxy.setupWorktreeHead({ sha: LATER_ROUND_SHA });

      await agentPromptGetBroker({
        agent: 'codeweaver',
        questId: questAtFetch.id,
        workItemId,
      });

      expect({
        stamped: proxy.getStampedWorkItems(),
        gitArgs: proxy.getGitSpawnedArgs(),
      }).toStrictEqual({ stamped: [], gitArgs: ['rev-parse', 'HEAD'] });
    });

    // A hydrated quest, or one seeded before worktrees, resolves to the repo root — whose HEAD is
    // the developer's own checkout and means nothing for this item. Recording it would hand the
    // gate a range from another branch entirely.
    it('EMPTY: {quest with no worktree of its own} => nothing is stamped and git is never read', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5353-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5353-4222-9333-444444444444' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [OperationItemStub({ id: operationId, role: 'codeweaver' })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await agentPromptGetBroker({ agent: 'codeweaver', questId: quest.id, workItemId });

      expect({
        stamped: proxy.getStampedWorkItems(),
        gitArgs: proxy.getGitSpawnedArgs(),
      }).toStrictEqual({ stamped: [], gitArgs: undefined });
    });

    // The stamp reaches the guild registry and the filesystem, neither of which is this call's
    // subject. A prompt fetch that died here would take the whole dispatch with it, to protect a
    // gate that already treats a missing startRef as a skip.
    it('ERROR: {cwd resolution throws} => nothing is stamped and the prompt still serves', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5555-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5555-4222-9333-444444444444' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [
          OperationItemStub({
            id: operationId,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'pending',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupCwdUnresolvable();

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
      ].join('\n');

      expect({
        stamped: proxy.getStampedWorkItems(),
        prompt: result.prompt,
      }).toStrictEqual({
        stamped: [],
        prompt: codeweaverPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });

    it('EMPTY: {worktree resolves but `git rev-parse HEAD` fails} => nothing is stamped and the prompt still serves', async () => {
      const proxy = agentPromptGetBrokerProxy();
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5454-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5454-4222-9333-444444444444' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'add-auth' }),
        operations: [
          OperationItemStub({
            id: operationId,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'pending',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupWorktreeHeadUnreadable();

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
      ].join('\n');

      expect({
        stamped: proxy.getStampedWorkItems(),
        prompt: result.prompt,
      }).toStrictEqual({
        stamped: [],
        prompt: codeweaverPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });
  });
});
