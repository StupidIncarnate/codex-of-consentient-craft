/**
 * PURPOSE: Proxy for questRouteScopeBroker — two roles:
 *   1) Downstream callers (the dispatch scan) stub the broker via `setupRouted` /
 *      `setupRouterBlocked`, which is all they are answerable for: the scan owns the ORDER the
 *      router runs in, not what it decides.
 *   2) The broker's own test runs the real implementation (`setupPassthrough`) against a quest file
 *      and plan files staged by their exact paths, so the router, every transformer under it, the
 *      real questOperationsUpdateBroker and the real family-mint walk all run against code.
 *
 * USAGE (caller test):
 * const proxy = questRouteScopeBrokerProxy();
 * proxy.setupRouterBlocked();
 *
 * USAGE (broker test):
 * const proxy = questRouteScopeBrokerProxy();
 * proxy.setupPassthrough();
 * proxy.setupQuest({ quest });
 * // ...call the broker...
 * expect(proxy.getPersistedQuest().workItems).toStrictEqual([...]);
 *
 * The broker reads the quest TWICE — once for its own scan, once inside `questOperationsUpdateBroker`'s
 * lock — so the quest file is staged as a sticky read of its exact path, which every read of it
 * gets. Nothing below the broker's own children is mocked here: every fs adapter runs its real
 * body, and a caller's suite that imports this file sees them exactly as if it were not there.
 */

import { randomUUID } from '#gateway/node/crypto';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { Quest, OperationItem } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import type { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkReadBrokerProxy } from '../../planned-work/read/planned-work-read-broker.proxy';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';
import { mintNextFamilyLayerBrokerProxy } from './mint-next-family-layer-broker.proxy';
import { questRouteScopeBroker } from './quest-route-scope-broker';

registerModuleMock({ module: './quest-route-scope-broker' });

type QuestInput = ReturnType<typeof QuestStub>;
type WorkPlan = ReturnType<typeof WorkPlanStub>;
// The halt broker's own parameter object. `callsMatching` hands back `unknown[][]`, which is
// genuinely all the mock knows; naming the shape through the function it recorded is the one place
// that information exists.
type BlockCall = Parameters<typeof questBlockOnFailureBroker>[0];

// The folder `questOperationsUpdateBrokerProxy.setupQuestOnDisk` stages the quest under; a plan
// file lives beside that quest.json, so it is addressed from the same folder.
const QUESTS_DIR = `/home/testuser/.dungeonmaster/guilds/${GuildIdStub()}/quests`;
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const IDLE = { routed: false, blocked: false };

export const questRouteScopeBrokerProxy = (): {
  setupIdle: (params: { questId: Quest['id'] }) => void;
  setupRouted: (params: { questId: Quest['id'] }) => void;
  setupRouterBlocked: (params: { questId: Quest['id'] }) => void;
  setupPassthrough: () => void;
  setupQuest: (params: { quest: QuestInput }) => void;
  setupPlan: (params: {
    quest: QuestInput;
    operationItemId: OperationItem['id'];
    plan: WorkPlan;
  }) => void;
  getPersistedQuest: () => Quest;
  getBlockCalls: () => readonly BlockCall[];
} => {
  const mocked = registerMock({ fn: questRouteScopeBroker });
  // Any `{ questId }` call, for the opt-in `setupPassthrough` whose caller never names the quest.
  const isRouteCall = (call: unknown): boolean =>
    typeof call === 'object' && call !== null && 'questId' in call;

  const blockProxy = questBlockOnFailureBrokerProxy();
  const blockHandle = registerMock({ fn: questBlockOnFailureBroker });

  const planProxy = plannedWorkReadBrokerProxy();
  questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();
  const updateProxy = questOperationsUpdateBrokerProxy();
  mintNextFamilyLayerBrokerProxy();

  const uuidCounter = { value: 0 };

  return {
    // The router found nothing to move for this quest — what a composing scan needs from it when the
    // scenario is about something else.
    setupIdle: ({ questId }: { questId: Quest['id'] }): void => {
      mocked.calledWith([{ questId }]).resolves(IDLE);
    },

    setupRouted: ({ questId }: { questId: Quest['id'] }): void => {
      mocked.onceFor([{ questId }]).resolves({ routed: true, blocked: false });
    },

    setupRouterBlocked: ({ questId }: { questId: Quest['id'] }): void => {
      mocked.onceFor([{ questId }]).resolves({ routed: false, blocked: true });
    },

    setupPassthrough: (): void => {
      const realMod = requireActual<{ questRouteScopeBroker: typeof questRouteScopeBroker }>({
        module: './quest-route-scope-broker',
      });
      mocked.calledWith([isRouteCall]).implement(realMod.questRouteScopeBroker);
      blockProxy.setupBlocked();

      // Sequenced ids and a pinned clock, so a minted scope or work item can be asserted whole.
      // Neither global takes an identifying argument, so `[]` is the honest address for both.
      registerMock({ fn: randomUUID })
        .calledWith([])
        .implement((): ReturnType<typeof randomUUID> => {
          const index = uuidCounter.value;
          uuidCounter.value += 1;
          return `00000000-0000-4000-8000-00000000000${String(index)}`;
        });
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);
    },

    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      updateProxy.setupQuestOnDisk({ quest });

      // No planner has run on any scope until `setupPlan` says one has: every scope's plan file is
      // staged absent at its own path, and `setupPlan` restages one of them (the later wins).
      const questFolderPath = AbsoluteFilePathStub({
        value: `${QUESTS_DIR}/${String(quest.folder)}`,
      });
      for (const operation of quest.operations) {
        planProxy.setupPlanMissing({ questFolderPath, operationItemId: operation.id });
      }
    },

    setupPlan: ({
      quest,
      operationItemId,
      plan,
    }: {
      quest: QuestInput;
      operationItemId: OperationItem['id'];
      plan: WorkPlan;
    }): void => {
      planProxy.setupPlanFound({
        questFolderPath: AbsoluteFilePathStub({ value: `${QUESTS_DIR}/${String(quest.folder)}` }),
        operationItemId,
        plan,
      });
    },

    getPersistedQuest: (): Quest => updateProxy.getLastPersistedQuest(),

    getBlockCalls: (): readonly BlockCall[] =>
      blockHandle.callsMatching([]).map((call) => call[0] as BlockCall),
  };
};
