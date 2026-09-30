import type { Guild } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

type QuestId = ReturnType<typeof QuestIdStub>;
type FilePath = string;

// A logical candidate root, in the exact precedence questFindBroker searches.
type QuestFindRootKind = 'repoLocal' | 'dev' | 'envHome' | 'userGlobal';

const REPO_CWD = '/repo';
const USER_HOMEDIR = '/home/testuser';
const USER_GLOBAL_ROOT = '/home/testuser/.dungeonmaster';
const ENV_HOME = '/env/dungeonmaster-home';
const DUNGEONMASTER_DIR = '.dungeonmaster';
const DUNGEONMASTER_DEV_DIR = '.dungeonmaster-dev';
const GUILDS_DIR = 'guilds';
const QUESTS_DIR = 'quests';
const QUEST_FILE = 'quest.json';

export const questFindBrokerProxy = (): {
  setupQuestAt: (params: {
    root: QuestFindRootKind;
    guildId: Guild['id'];
    questId: QuestId;
    decoyGuildIds?: string[];
  }) => void;
  setupGuildsWithoutQuest: (params: {
    root: QuestFindRootKind;
    guildIds: string[];
    questId: QuestId;
  }) => void;
  setupHomeEnvEmptyString: () => void;
  setupNoQuestAnywhere: () => void;
} => {
  const existsProxy = existsSyncProxy();
  const readdirProxy = readdirEntriesSyncProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — constructed here only to satisfy
  // enforce-proxy-child-creation, since this broker imports `join` directly. Never staged: the
  // real passthrough default homeFindProxy's own composition already registers on this same
  // '#gateway/node/path' `join` reference covers every join call this broker makes.
  registerMock({ fn: join });
  const cwdStageProxy = cwdProxy();
  cwdStageProxy.setupCwd({ value: REPO_CWD });

  const repoLocalGuildsPath = `${REPO_CWD}/${DUNGEONMASTER_DIR}/${GUILDS_DIR}`;
  const devGuildsPath = `${REPO_CWD}/${DUNGEONMASTER_DEV_DIR}/${GUILDS_DIR}`;
  const envHomeGuildsPath = `${ENV_HOME}/${GUILDS_DIR}`;
  const userGlobalGuildsPath = `${USER_GLOBAL_ROOT}/${GUILDS_DIR}`;

  // existsSyncProxy has no catch-all by design: every one of the four fixed root guildsPath
  // addresses this broker's loop can reach gets an explicit false default here, overridden below
  // by whichever root a test actually stages present (same address, later registration wins).
  existsProxy.returns({ path: repoLocalGuildsPath, exists: false });
  existsProxy.returns({ path: devGuildsPath, exists: false });
  existsProxy.returns({ path: envHomeGuildsPath, exists: false });
  existsProxy.returns({ path: userGlobalGuildsPath, exists: false });

  const stageUserGlobalHomedir = (): void => {
    homeFindProxy.setupHomePath({
      homeDir: USER_HOMEDIR,
      homePath: USER_GLOBAL_ROOT,
    });
  };

  // questFindBroker calls dungeonmasterHomeFindBroker() unconditionally, before the loop even
  // looks at which root a test is targeting, and a leaked DUNGEONMASTER_HOME left set by a PRIOR
  // test (real env, never reset between tests) must not survive into this one. Pinning env to the
  // already-registered ENV_HOME address (rather than clearing it) keeps dungeonmasterHomeFindBroker
  // on its env branch by default, so it never calls the gateway's own homedir() — a zero-argument
  // mock shared with every OTHER composed proxy in the same test (transcriptResolveBrokerProxy
  // among them), which staging it here would silently override for all of them. Only the
  // 'userGlobal' root (guildsPathFor, stageUserGlobalHomedir) or an explicit
  // setupNoQuestAnywhere/setupHomeEnvEmptyString call ever needs the real homedir() branch, and
  // each of those clears env and stages homedir() itself, scoped to the test that asked for it.
  homeFindProxy.setHomeEnv({ value: ENV_HOME });

  const guildsPathFor = ({ root }: { root: QuestFindRootKind }): FilePath => {
    if (root === 'repoLocal') {
      return repoLocalGuildsPath;
    }
    if (root === 'dev') {
      return devGuildsPath;
    }
    if (root === 'envHome') {
      homeFindProxy.setHomeEnv({ value: ENV_HOME });
      return envHomeGuildsPath;
    }
    stageUserGlobalHomedir();
    return userGlobalGuildsPath;
  };

  return {
    setupQuestAt: ({
      root,
      guildId,
      questId,
      decoyGuildIds = [],
    }: {
      root: QuestFindRootKind;
      guildId: Guild['id'];
      questId: QuestId;
      decoyGuildIds?: string[];
    }): void => {
      const guildsPath = guildsPathFor({ root });
      const allGuildIds = [...decoyGuildIds, guildId];

      existsProxy.returns({ path: guildsPath, exists: true });
      readdirProxy.returns({
        path: guildsPath,
        entries: allGuildIds.map((name) => ({ name, kind: 'directory' as const })),
      });
      for (const decoyId of decoyGuildIds) {
        existsProxy.returns({
          path: `${guildsPath}/${decoyId}/${QUESTS_DIR}/${questId}/${QUEST_FILE}`,
          exists: false,
        });
      }
      existsProxy.returns({
        path: `${guildsPath}/${guildId}/${QUESTS_DIR}/${questId}/${QUEST_FILE}`,
        exists: true,
      });
    },

    setupGuildsWithoutQuest: ({
      root,
      guildIds,
      questId,
    }: {
      root: QuestFindRootKind;
      guildIds: string[];
      questId: QuestId;
    }): void => {
      const guildsPath = guildsPathFor({ root });

      existsProxy.returns({ path: guildsPath, exists: true });
      readdirProxy.returns({
        path: guildsPath,
        entries: guildIds.map((name) => ({ name, kind: 'directory' as const })),
      });
      for (const guildId of guildIds) {
        existsProxy.returns({
          path: `${guildsPath}/${guildId}/${QUESTS_DIR}/${questId}/${QUEST_FILE}`,
          exists: false,
        });
      }
    },

    setupHomeEnvEmptyString: (): void => {
      homeFindProxy.setHomeEnv({ value: '' });
    },

    setupNoQuestAnywhere: (): void => {
      homeFindProxy.clearHomeEnv();
      stageUserGlobalHomedir();
    },
  };
};
