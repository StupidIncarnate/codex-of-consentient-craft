/**
 * PURPOSE: The `guild-active-suite` recipe — one active guild holding two quests (one in progress,
 * one complete) and a session with subagent chain. Reach for this over other recipes when testing
 * composite environments with concurrent guild, quest, session and subagent artifacts.
 *
 * Both quests' `setRaw` carry `flows`/`packagesAffected` (`questGateContentDefaultsStatics`) — on a
 * live target, `questApiRouteBroker` walks each freshly-minted `created` quest to its requested
 * status through `questReachRouteBroker`, and that walk needs real gate content to clear
 * `flows_approved`/`approved` the same way `guild-mid-execution`'s own header explains (DEF-71).
 * This recipe holds no operations ledger of its own, so the riftcarver operation a live target's
 * real START route auto-seeds on the way to `in_progress`/`complete` is left as-is — nothing here
 * asserts the ledger shape.
 *
 * The session and subagent both carry `set()` content the `session`/`subagent` ingredients
 * document as having "no honest default" (`session-ingredient-broker.ts`'s and
 * `subagent-ingredient-broker.ts`'s own headers): a session's `lines` and a subagent's own
 * `taskPrompt`/`lines`. Neither ingredient declares an `api` route, so both routes through `write`
 * on every target kind, live or not — the gap this recipe shipped with was never about a live vs.
 * write target, only that nothing here ever called `set()` on either row.
 *
 * USAGE:
 * const plan = recipesGuildActiveSuiteBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { subagentFieldsContract } from '../../../contracts/subagent-fields/subagent-fields-contract';
import { questGateContentDefaultsStatics } from '../../../statics/quest-gate-content-defaults/quest-gate-content-defaults-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { sessionFieldsContract } from '../../../contracts/session-fields/session-fields-contract';

const { recipe } = recipesHydrationCreateBroker();

const QUESTS_COUNT = 2;
// `TaskPrompt` brands a LOCAL, unexported schema inside `subagent-fields-contract.ts` — no sibling
// file gets its own `taskPromptContract` the way `taskDescriptionContract` does — so the only way to
// mint a real one from here is through the field contract's own public `subagentFieldsContract`,
// extracting the branded value off a throwaway, otherwise-unused probe object.
const SUBAGENT_TASK_PROMPT = subagentFieldsContract.parse({
  agentId: 'probe-agent',
  toolUseId: 'toolu_probe',
  taskDescription: 'Probe for a branded TaskPrompt',
  taskPrompt: 'Investigate the active development suite',
  lines: [],
  completed: true,
  sessionId: 'probe-session',
  cwd: '/tmp/guild-active-suite-probe',
}).taskPrompt;

// The field schemas' shapes are not exported, so branded `lines` are minted through the public
// field contracts, the same way the task prompt is.
const SESSION_LINES = sessionFieldsContract.parse({
  sessionId: 'probe-session',
  cwd: '/tmp/guild-active-suite-probe',
  lines: [
    '{"type":"user","message":{"role":"user","content":"What is the status of active development?"}}',
    '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Checking the active suite now."}]}}',
  ],
}).lines;

const SUBAGENT_LINES = subagentFieldsContract.parse({
  agentId: 'probe-agent',
  toolUseId: 'toolu_probe',
  taskDescription: 'Probe for branded lines',
  taskPrompt: 'Investigate the active development suite',
  lines: [
    '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Sub-agent investigating the active suite."}]}}',
  ],
  completed: true,
  sessionId: 'probe-session',
  cwd: '/tmp/guild-active-suite-probe',
}).lines;

export const recipesGuildActiveSuiteBroker = recipe(
  {
    name: 'guild-active-suite',
    description:
      'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(QUESTS_COUNT, (q) => [
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('in_progress'),
          title: questFieldsContract.shape.title.parse('Active Development'),
          flows: questFieldsContract.shape.flows.parse(questGateContentDefaultsStatics.flows),
          packagesAffected: questFieldsContract.shape.packagesAffected.parse(
            questGateContentDefaultsStatics.packagesAffected,
          ),
        }),
        q[1].setRaw({
          status: questFieldsContract.shape.status.parse('complete'),
          title: questFieldsContract.shape.title.parse('Base Framework'),
          flows: questFieldsContract.shape.flows.parse(questGateContentDefaultsStatics.flows),
          packagesAffected: questFieldsContract.shape.packagesAffected.parse(
            questGateContentDefaultsStatics.packagesAffected,
          ),
        }),
        q[0].saveRecordAs({ name: 'questActive' }),
        q[1].saveRecordAs({ name: 'questComplete' }),
      ]),
      g[0].sessions.add(1, (s) => [
        s[0].set({
          lines: SESSION_LINES,
        }),
        s[0].subagents.add(1, (a) => [
          a[0].set({
            taskPrompt: SUBAGENT_TASK_PROMPT,
            lines: SUBAGENT_LINES,
          }),
          a[0].saveRecordAs({ name: 'subagent' }),
        ]),
        s[0].saveRecordAs({ name: 'session' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
