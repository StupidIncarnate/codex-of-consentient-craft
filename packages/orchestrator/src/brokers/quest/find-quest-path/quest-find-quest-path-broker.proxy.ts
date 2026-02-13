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

const setupProjectEntries = ({
  projects,
  projectsDir,
  readdirProxy,
  pathJoinProxy,
  readFileProxy,
}: {
  projects: {
    dirName: FileName;
    questsDirPath: FilePath;
    questFolders: {
      folderName: FileName;
      questFilePath: FilePath;
      questFolderPath: FilePath;
      contents: FileContents;
    }[];
  }[];
  projectsDir: FilePath;
  readdirProxy: ReturnType<typeof fsReaddirWithTypesAdapterProxy>;
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
  readFileProxy: ReturnType<typeof fsReadFileAdapterProxy>;
}): void => {
  const projectDirents = projects.map(({ dirName }) =>
    createMockDirent({ name: dirName, parentPath: projectsDir }),
  );
  readdirProxy.returns({ entries: projectDirents });

  for (const project of projects) {
    pathJoinProxy.returns({ result: project.questsDirPath });

    const questFolderDirents = project.questFolders.map(({ folderName }) =>
      createMockDirent({ name: folderName, parentPath: project.questsDirPath }),
    );
    readdirProxy.returns({ entries: questFolderDirents });

    for (const questFolder of project.questFolders) {
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
    projectsDir: FilePath;
    projects: {
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
  setupNoProjects: (params: { homeDir: string; homePath: FilePath; projectsDir: FilePath }) => void;
  setupQuestNotFound: (params: {
    homeDir: string;
    homePath: FilePath;
    projectsDir: FilePath;
    projects: {
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
    projectsDir: FilePath;
    projectDirName: FileName;
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
      projectsDir,
      projects,
    }: {
      homeDir: string;
      homePath: FilePath;
      projectsDir: FilePath;
      projects: {
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
      pathJoinProxy.returns({ result: projectsDir });
      setupProjectEntries({ projects, projectsDir, readdirProxy, pathJoinProxy, readFileProxy });
    },

    setupNoProjects: ({
      homeDir,
      homePath,
      projectsDir,
    }: {
      homeDir: string;
      homePath: FilePath;
      projectsDir: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: projectsDir });
      readdirProxy.returns({ entries: [] });
    },

    setupQuestNotFound: ({
      homeDir,
      homePath,
      projectsDir,
      projects,
    }: {
      homeDir: string;
      homePath: FilePath;
      projectsDir: FilePath;
      projects: {
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
      pathJoinProxy.returns({ result: projectsDir });
      setupProjectEntries({ projects, projectsDir, readdirProxy, pathJoinProxy, readFileProxy });
    },

    setupQuestsReadError: ({
      homeDir,
      homePath,
      projectsDir,
      projectDirName,
    }: {
      homeDir: string;
      homePath: FilePath;
      projectsDir: FilePath;
      projectDirName: FileName;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: projectsDir });

      const projectDirents = [createMockDirent({ name: projectDirName, parentPath: projectsDir })];
      readdirProxy.returns({ entries: projectDirents });

      pathJoinProxy.returns({ result: projectsDir });
      readdirProxy.throws({ error: new Error('ENOENT: no such file or directory') });
    },
  };
};
