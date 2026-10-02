/**
 * PURPOSE: Proxy for lane-kill-broker — composes questCwdResolveBrokerProxy (which checkout the
 * quest runs in), moduleResolveBrokerProxy (siegelense resolved FROM that checkout, addressed by the
 * checkout path so a resolution from anywhere else fails loudly) and the `dynamicImport` staging
 * that answers the resolved module path.
 *
 * USAGE:
 * const proxy = laneKillBrokerProxy();
 * proxy.setupStopped({ quest, stopped: true });
 * await proxy.callBroker({ questId: quest.id, instanceId });
 * proxy.getKillCalls(); // [{ instanceId, repoRoot }]
 */

import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { moduleResolveBrokerProxy } from '@dungeonmaster/shared/brokers/module/resolve/module-resolve-broker.proxy';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { laneKillBroker } from './lane-kill-broker';

type Quest = ReturnType<typeof QuestStub>;

const SIEGELENSE_BROKERS_SPECIFIER = '@dungeonmaster/siegelense/brokers';
const DEFAULT_REPO_ROOT = '/home/testuser';

const modulePathFor = ({ repoRoot }: { repoRoot: string }): string =>
  `${repoRoot}/node_modules/@dungeonmaster/siegelense/dist/brokers.js`;

export const laneKillBrokerProxy = (): {
  callBroker: typeof laneKillBroker;
  setupStopped: (params: { quest: Quest; stopped: boolean; repoRoot?: string }) => void;
  setupMissingWorktree: (params: { quest: Quest }) => void;
  setupImportFailure: (params: { quest: Quest; error: Error; repoRoot?: string }) => void;
  getKilledInstanceIds: () => readonly unknown[];
  getKillCalls: () => readonly unknown[];
} => {
  const importProxy = dynamicImportProxy();
  const cwdProxy = questCwdResolveBrokerProxy();
  const moduleProxy = moduleResolveBrokerProxy();
  const instanceKillBroker = jest.fn().mockResolvedValue({ stopped: true });

  // A quest with a recorded worktree runs there; a quest with none runs at the repo root the
  // guild resolves to. Returns the checkout the broker is expected to resolve siegelense from.
  const stageCheckout = ({ quest, repoRoot }: { quest: Quest; repoRoot: string }): string => {
    if (quest.worktreePath === undefined) {
      cwdProxy.setupLegacyQuest({ quest, repoRoot });
      moduleProxy.setupResolvesFromRunRoot({
        specifier: SIEGELENSE_BROKERS_SPECIFIER,
        repoRoot,
        path: modulePathFor({ repoRoot }),
      });
      return repoRoot;
    }

    cwdProxy.setupWorktreePresent({ quest });
    moduleProxy.setupResolvesFromRunRoot({
      specifier: SIEGELENSE_BROKERS_SPECIFIER,
      repoRoot: quest.worktreePath,
      path: modulePathFor({ repoRoot: quest.worktreePath }),
    });
    return quest.worktreePath;
  };

  return {
    callBroker: laneKillBroker,

    setupStopped: ({
      quest,
      stopped,
      repoRoot = DEFAULT_REPO_ROOT,
    }: {
      quest: Quest;
      stopped: boolean;
      repoRoot?: string;
    }): void => {
      const checkout = stageCheckout({ quest, repoRoot });
      instanceKillBroker.mockResolvedValue({ stopped });
      importProxy.returns({
        path: modulePathFor({ repoRoot: checkout }),
        module: { instanceKillBroker },
      });
    },

    setupMissingWorktree: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupWorktreeMissing({ quest });
    },

    setupImportFailure: ({
      quest,
      error,
      repoRoot = DEFAULT_REPO_ROOT,
    }: {
      quest: Quest;
      error: Error;
      repoRoot?: string;
    }): void => {
      const checkout = stageCheckout({ quest, repoRoot });
      importProxy.rejects({ path: modulePathFor({ repoRoot: checkout }), error });
    },

    getKilledInstanceIds: (): readonly unknown[] =>
      instanceKillBroker.mock.calls.map(
        (call: readonly [{ instanceId: unknown }]) => call[0].instanceId,
      ),

    getKillCalls: (): readonly unknown[] =>
      instanceKillBroker.mock.calls.map((call: readonly [unknown]) => call[0]),
  };
};
