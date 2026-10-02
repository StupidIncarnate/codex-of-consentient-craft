/**
 * PURPOSE: Proxy for lane-provision-batch-broker — composes questFindQuestPathBrokerProxy (the
 * implementation's ONE guildId/questPath resolution for the whole batch), laneRecordInstanceBrokerProxy
 * (the write half, queued once per lane a scenario actually starts), questCwdResolveBrokerProxy
 * (which checkout the quest runs in), moduleResolveBrokerProxy (siegelense resolved FROM that
 * checkout, addressed by its path so a resolution from anywhere else fails loudly) and the ONE
 * `dynamicImport` staging that answers BOTH `capacityReadBroker` and `instanceStartBroker` for the
 * resolved module path — one combined `.resolves()` call, because two separate stagings of the
 * identical path would collide (registerMock addresses purely by argument, and the later stage
 * silently wins).
 *
 * USAGE:
 * const proxy = laneProvisionBatchBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupCheckout({ quest });
 * proxy.setupCapacityAndManifest({ quest, suggested: 1, manifest: LaneManifestReadingStub() });
 * // ...call laneProvisionBatchBroker...
 * const persisted = proxy.getLastPersistedQuest();
 * proxy.getInstanceStartCalls(); // [{ specName, questId, guildId, seed, repoRoot }]
 */

import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { moduleResolveBrokerProxy } from '@dungeonmaster/shared/brokers/module/resolve/module-resolve-broker.proxy';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { questContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { laneRecordInstanceBrokerProxy } from '../record-instance/lane-record-instance-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

// The heaviest scenario in this suite starts three lanes — each running its OWN
// join→load→persist cycle inside laneRecordInstanceBroker, now that questPath is resolved ONCE
// upfront rather than re-resolved per lane. This many queued write cycles covers every scenario
// with margin; an unused one is inert.
const RECORD_CYCLE_COUNT = 3;
const RECORD_CYCLES: readonly undefined[] = new Array<undefined>(RECORD_CYCLE_COUNT).fill(
  undefined,
);

const SIEGELENSE_BROKERS_SPECIFIER = '@dungeonmaster/siegelense/brokers';
const DEFAULT_REPO_ROOT = '/home/testuser';

const modulePathFor = ({ repoRoot }: { repoRoot: string }): string =>
  `${repoRoot}/node_modules/@dungeonmaster/siegelense/dist/brokers.js`;

export const laneProvisionBatchBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupCheckout: (params: { quest: Quest; repoRoot?: string }) => void;
  setupMissingWorktree: (params: { quest: Quest }) => void;
  setupCapacityAndManifest: (params: {
    quest: Quest;
    suggested: number;
    manifest: unknown;
    repoRoot?: string;
  }) => void;
  getLastPersistedQuest: () => Parsed;
  getCapacityCalls: () => readonly unknown[];
  getInstanceStartCalls: () => readonly unknown[];
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const recordInstanceProxy = laneRecordInstanceBrokerProxy();
  const importProxy = dynamicImportProxy();
  const cwdProxy = questCwdResolveBrokerProxy();
  const moduleProxy = moduleResolveBrokerProxy();
  const capacityReadBroker = jest.fn();
  const instanceStartBroker = jest.fn();

  // A quest with a recorded worktree runs there; a quest with none runs at the repo root its
  // guild resolves to. Returns the checkout the broker must resolve siegelense from.
  const checkoutFor = ({ quest, repoRoot }: { quest: Quest; repoRoot: string }): string =>
    quest.worktreePath === undefined ? repoRoot : quest.worktreePath;

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: guildId,
            questsDirPath,
            questFolders: [
              {
                folderName: quest.folder,
                questFilePath,
                questFolderPath,
                contents: JSON.stringify(quest),
              },
            ],
          },
        ],
      });

      // Every lane this scenario actually starts runs its OWN join→load→persist cycle against the
      // SAME resolved questPath; queued once per possible lane, ahead of time. questFolderPath is a
      // FilePath above (the union questFindQuestPathBrokerProxy takes) but is genuinely absolute —
      // built with a leading `/` — so it re-parses into the AbsoluteFilePath
      // laneRecordInstanceBrokerProxy requires, rather than widening either proxy's type.
      const absoluteQuestFolderPath = questFolderPath;
      RECORD_CYCLES.forEach(() => {
        recordInstanceProxy.setupQuestFound({ quest, questPath: absoluteQuestFolderPath });
      });
    },

    setupCheckout: ({
      quest,
      repoRoot = DEFAULT_REPO_ROOT,
    }: {
      quest: Quest;
      repoRoot?: string;
    }): void => {
      if (quest.worktreePath === undefined) {
        cwdProxy.setupLegacyQuest({ quest, repoRoot });
      } else {
        cwdProxy.setupWorktreePresent({ quest });
      }
      const checkout = checkoutFor({ quest, repoRoot });
      moduleProxy.setupResolvesFromRunRoot({
        specifier: SIEGELENSE_BROKERS_SPECIFIER,
        repoRoot: checkout,
        path: modulePathFor({ repoRoot: checkout }),
      });
    },

    setupMissingWorktree: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupWorktreeMissing({ quest });
    },

    setupCapacityAndManifest: ({
      quest,
      suggested,
      manifest,
      repoRoot = DEFAULT_REPO_ROOT,
    }: {
      quest: Quest;
      suggested: number;
      manifest: unknown;
      repoRoot?: string;
    }): void => {
      capacityReadBroker.mockResolvedValue({ suggested });
      instanceStartBroker.mockResolvedValue(manifest);
      importProxy.returns({
        path: modulePathFor({ repoRoot: checkoutFor({ quest, repoRoot }) }),
        module: { capacityReadBroker, instanceStartBroker },
      });
    },

    getLastPersistedQuest: recordInstanceProxy.getLastPersistedQuest,

    getCapacityCalls: (): readonly unknown[] =>
      capacityReadBroker.mock.calls.map((call: readonly [unknown]) => call[0]),

    getInstanceStartCalls: (): readonly unknown[] =>
      instanceStartBroker.mock.calls.map((call: readonly [unknown]) => call[0]),
  };
};
