import { Dirent } from 'fs';

import {
  dungeonmasterHomeFindBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FileContents, FileName, FilePath } from '@dungeonmaster/shared/contracts';

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
  readdirProxy,
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
  readdirProxy: ReturnType<typeof fsReaddirWithTypesAdapterProxy>;
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
  readFileProxy: ReturnType<typeof fsReadFileAdapterProxy>;
}): void => {
  const guildDirents = guilds.map(({ dirName }) =>
    createMockDirent({ name: dirName, parentPath: guildsDir }),
  );
  readdirProxy.returns({ entries: guildDirents });

  for (const guild of guilds) {
    pathJoinProxy.returns({ result: guild.questsDirPath });

    const questFolderDirents = guild.questFolders.map(({ folderName }) =>
      createMockDirent({ name: folderName, parentPath: guild.questsDirPath }),
    );
    readdirProxy.returns({ entries: questFolderDirents });

    for (const questFolder of guild.questFolders) {
      pathJoinProxy.returns({ result: questFolder.questFilePath });
      pathJoinProxy.returns({ result: questFolder.questFolderPath });
      readFileProxy.resolves({ content: questFolder.contents });
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
  }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

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
      setupGuildEntries({ guilds, guildsDir, readdirProxy, pathJoinProxy, readFileProxy });
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
      readdirProxy.returns({ entries: [] });
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
      setupGuildEntries({ guilds, guildsDir, readdirProxy, pathJoinProxy, readFileProxy });
    },

    setupQuestsReadError: ({
      homeDir,
      homePath,
      guildsDir,
      guildDirName,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsDir: FilePath;
      guildDirName: FileName;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildsDir });

      const guildDirents = [createMockDirent({ name: guildDirName, parentPath: guildsDir })];
      readdirProxy.returns({ entries: guildDirents });

      pathJoinProxy.returns({ result: guildsDir });
      readdirProxy.throws({ error: new Error('ENOENT: no such file or directory') });
    },
  };
};
