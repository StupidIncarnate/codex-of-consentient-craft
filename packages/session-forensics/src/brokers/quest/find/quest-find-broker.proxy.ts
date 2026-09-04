import { Dirent } from 'fs';
import {
  processCwdAdapterProxy,
  pathJoinAdapterProxy,
  fsExistsSyncAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
  dungeonmasterHomeFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

type QuestId = ReturnType<typeof QuestIdStub>;

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

const direntFor = ({ name }: { name: string }): Dirent =>
  Object.assign(Object.create(Dirent.prototype) as Dirent, { name });

export const questFindBrokerProxy = (): {
  setupQuestAt: (params: {
    root: QuestFindRootKind;
    guildId: string;
    questId: QuestId;
    decoyGuildIds?: string[];
  }) => void;
  setupGuildsWithoutQuest: (params: { root: QuestFindRootKind; guildIds: string[] }) => void;
  setupHomeEnvEmptyString: () => void;
  setupNoQuestAnywhere: () => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  // Not driven directly — questFindBroker imports pathJoinAdapter for its own repo-local/dev
  // joins, which run against the REAL path.join. Instantiating this child keeps
  // enforce-proxy-child-creation satisfied without staging a fake result. Address computation
  // below deliberately uses template-literal concatenation instead of the (mocked) path.join,
  // so staging never steals the one-shot homePath override meant for
  // dungeonmasterHomeFindBroker's own internal join call.
  pathJoinAdapterProxy();

  cwdProxy.returns({ path: REPO_CWD });

  const rootPathFor = ({ root }: { root: QuestFindRootKind }): ReturnType<typeof FilePathStub> => {
    if (root === 'repoLocal') {
      return FilePathStub({ value: `${REPO_CWD}/${DUNGEONMASTER_DIR}` });
    }
    if (root === 'dev') {
      return FilePathStub({ value: `${REPO_CWD}/${DUNGEONMASTER_DEV_DIR}` });
    }
    if (root === 'envHome') {
      homeFindProxy.setHomeEnv({ value: ENV_HOME });
      return FilePathStub({ value: ENV_HOME });
    }
    homeFindProxy.setupHomePath({
      homeDir: USER_HOMEDIR,
      homePath: FilePathStub({ value: USER_GLOBAL_ROOT }),
    });
    return FilePathStub({ value: USER_GLOBAL_ROOT });
  };

  return {
    setupQuestAt: ({
      root,
      guildId,
      questId,
      decoyGuildIds = [],
    }: {
      root: QuestFindRootKind;
      guildId: string;
      questId: QuestId;
      decoyGuildIds?: string[];
    }): void => {
      const rootPath = rootPathFor({ root });
      const guildsPath = `${rootPath}/${GUILDS_DIR}`;
      const allGuildIds = [...decoyGuildIds, guildId];

      existsProxy.returns({ filePath: FilePathStub({ value: guildsPath }), result: true });
      readdirProxy.returns({
        dirPath: AbsoluteFilePathStub({ value: guildsPath }),
        entries: allGuildIds.map((name) => direntFor({ name })),
      });
      existsProxy.returns({
        filePath: FilePathStub({
          value: `${guildsPath}/${guildId}/${QUESTS_DIR}/${questId}/${QUEST_FILE}`,
        }),
        result: true,
      });
    },

    setupGuildsWithoutQuest: ({
      root,
      guildIds,
    }: {
      root: QuestFindRootKind;
      guildIds: string[];
    }): void => {
      const rootPath = rootPathFor({ root });
      const guildsPath = `${rootPath}/${GUILDS_DIR}`;

      existsProxy.returns({ filePath: FilePathStub({ value: guildsPath }), result: true });
      readdirProxy.returns({
        dirPath: AbsoluteFilePathStub({ value: guildsPath }),
        entries: guildIds.map((name) => direntFor({ name })),
      });
    },

    setupHomeEnvEmptyString: (): void => {
      homeFindProxy.setHomeEnv({ value: '' });
    },

    setupNoQuestAnywhere: (): void => {
      homeFindProxy.clearHomeEnv();
    },
  };
};
