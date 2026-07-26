import { readdirSync, Dirent } from 'fs';

import {
  dungeonmasterHomeFindBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FileContents, FileName, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

const createMockDirent = ({
  name,
  parentPath,
}: {
  name: FileName;
  parentPath: FilePath;
}): Dirent => {
  const dirent = Object.assign(Object.create(Dirent.prototype) as Dirent, {
    name,
    parentPath,
    isDirectory: jest.fn().mockReturnValue(true),
  });
  return dirent;
};

const setupGuildEntries = ({
  guilds,
  guildsDir,
  readdirReturns,
  pathJoinProxy,
  readFileProxy,
}: {
  guilds: {
    dirName: FileName;
    questsDirPath: FilePath;
    questFolders: {
      folderName: FileName;
      questFilePath: FilePath;
      questFolderPath: FilePath;
      contents: FileContents;
    }[];
  }[];
  guildsDir: FilePath;
  readdirReturns: (params: { dirPath: FilePath; entries: Dirent[] }) => void;
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
  readFileProxy: ReturnType<typeof fsReadFileAdapterProxy>;
}): void => {
  const guildDirents = guilds.map(({ dirName }) =>
    createMockDirent({ name: dirName, parentPath: guildsDir }),
  );
  readdirReturns({ dirPath: guildsDir, entries: guildDirents });

  for (const guild of guilds) {
    pathJoinProxy.returns({ result: guild.questsDirPath });

    const questFolderDirents = guild.questFolders.map(({ folderName }) =>
      createMockDirent({ name: folderName, parentPath: guild.questsDirPath }),
    );
    readdirReturns({ dirPath: guild.questsDirPath, entries: questFolderDirents });

    for (const questFolder of guild.questFolders) {
      pathJoinProxy.returns({ result: questFolder.questFilePath });
      pathJoinProxy.returns({ result: questFolder.questFolderPath });
      // Two reads land on this exact path per "get quest" cycle: the find broker's own
      // candidate-match check (inside questFindQuestPathBroker), then the caller's separate
      // questLoadBroker read of the same file. Staging two addressed one-shots (instead of a
      // sticky `resolves`) means a SECOND setupQuestFound/setupQuestNotFound call for this same
      // path (a later generation of the same quest file) queues its own pair after this one,
      // rather than shadowing it for reads that haven't happened yet.
      readFileProxy.resolvesOnceFor({
        filePath: questFolder.questFilePath,
        content: questFolder.contents,
      });
      readFileProxy.resolvesOnceFor({
        filePath: questFolder.questFilePath,
        content: questFolder.contents,
      });
    }
  }
};

export const questFindQuestPathBrokerProxy = (): {
  setupQuestFound: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsDir: FilePath;
    guilds: {
      dirName: FileName;
      questsDirPath: FilePath;
      questFolders: {
        folderName: FileName;
        questFilePath: FilePath;
        questFolderPath: FilePath;
        contents: FileContents;
      }[];
    }[];
  }) => void;
  setupNoGuilds: (params: { homeDir: string; homePath: FilePath; guildsDir: FilePath }) => void;
  setupQuestNotFound: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsDir: FilePath;
    guilds: {
      dirName: FileName;
      questsDirPath: FilePath;
      questFolders: {
        folderName: FileName;
        questFilePath: FilePath;
        questFolderPath: FilePath;
        contents: FileContents;
      }[];
    }[];
  }) => void;
  setupQuestsReadError: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsDir: FilePath;
    guildDirName: FileName;
    questsDirPath: FilePath;
  }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation and to keep its zero-arg catch-all
  // (`calledWith([]).returns([])`) as the fallback for any dirPath this proxy never
  // addresses below. All the staging this proxy actually cares about goes through
  // readdirHandle directly (see the comment above it) — never through this proxy's own
  // `.returns()`/`.throws()`, which cannot describe the second `{ withFileTypes: true }`
  // argument that discriminates this broker's call from fsReaddirAdapterProxy's.
  fsReaddirWithTypesAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  // readdirSync is a SHARED npm function — fsReaddirAdapterProxy (orchestrator's own
  // plain-filename listing, used by questListBroker) also mocks it, addressed by [dirPath]
  // alone. Prefix matching lets a 1-arg description answer ANY call whose first argument is
  // that dirPath, no matter how many more real arguments follow — so without a second-
  // argument address here, two proxies staging the SAME dirPath (e.g. this broker's own
  // guild-scoped questsDirPath colliding with a caller's default-stub guildId used
  // elsewhere) let whichever staged MOST RECENTLY answer BOTH shapes, corrupting the other.
  // questFindQuestPathBroker always calls this as readdirSync(dirPath, { withFileTypes: true })
  // — describing that second argument makes this staging (2 matched args) strictly more
  // specific than fsReaddirAdapterProxy's 1-arg staging for a with-types call, AND makes it
  // structurally unable to match a plain 1-arg call (an arg-count mismatch is an automatic
  // non-match) — each proxy answers only its own call, independent of registration order.
  const readdirHandle: MockHandle = registerMock({ fn: readdirSync });
  const readdirReturns = ({ dirPath, entries }: { dirPath: FilePath; entries: Dirent[] }): void => {
    readdirHandle.calledWith([dirPath, { withFileTypes: true }]).returns(entries as never);
  };
  const readdirThrows = ({ dirPath, error }: { dirPath: FilePath; error: Error }): void => {
    readdirHandle.calledWith([dirPath, { withFileTypes: true }]).throws(error);
  };

  return {
    setupQuestFound: ({
      homeDir,
      homePath,
      guildsDir,
      guilds,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
      guilds: {
        dirName: FileName;
        questsDirPath: FilePath;
        questFolders: {
          folderName: FileName;
          questFilePath: FilePath;
          questFolderPath: FilePath;
          contents: FileContents;
        }[];
      }[];
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });
      setupGuildEntries({ guilds, guildsDir, readdirReturns, pathJoinProxy, readFileProxy });
    },

    setupNoGuilds: ({
      homeDir,
      homePath,
      guildsDir,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });
      readdirReturns({ dirPath: guildsDir, entries: [] });
    },

    setupQuestNotFound: ({
      homeDir,
      homePath,
      guildsDir,
      guilds,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
      guilds: {
        dirName: FileName;
        questsDirPath: FilePath;
        questFolders: {
          folderName: FileName;
          questFilePath: FilePath;
          questFolderPath: FilePath;
          contents: FileContents;
        }[];
      }[];
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });
      setupGuildEntries({ guilds, guildsDir, readdirReturns, pathJoinProxy, readFileProxy });
    },

    setupQuestsReadError: ({
      homeDir,
      homePath,
      guildsDir,
      guildDirName,
      questsDirPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
      guildDirName: FileName;
      questsDirPath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });

      const guildDirents = [createMockDirent({ name: guildDirName, parentPath: guildsDir })];
      readdirReturns({ dirPath: guildsDir, entries: guildDirents });

      // The real broker joins guildsDir + guildDirName + questsDir into a SECOND, DISTINCT
      // directory before reading it — reusing guildsDir here would collide the two readdir
      // stagings on the same dirPath key and the guild-listing call above would throw too.
      pathJoinProxy.returns({ result: questsDirPath });
      readdirThrows({
        dirPath: questsDirPath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },
  };
};
