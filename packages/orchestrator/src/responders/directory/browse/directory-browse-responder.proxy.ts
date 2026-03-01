import type { FilePath } from '@dungeonmaster/shared/contracts';

import { directoryBrowseBrokerProxy } from '../../../brokers/directory/browse/directory-browse-broker.proxy';
import { DirectoryBrowseResponder } from './directory-browse-responder';

export const DirectoryBrowseResponderProxy = (): {
  callResponder: typeof DirectoryBrowseResponder;
  setupDirectories: (params: {
    targetPath: string;
    directories: { name: string; joinedPath: FilePath }[];
    files: string[];
    hiddenDirectories: string[];
  }) => void;
  setupDefaultHomedir: (params: {
    homeDir: string;
    directories: { name: string; joinedPath: FilePath }[];
  }) => void;
  setupEmpty: () => void;
} => {
  const brokerProxy = directoryBrowseBrokerProxy();

  return {
    callResponder: DirectoryBrowseResponder,

    setupDirectories: (params: {
      targetPath: string;
      directories: { name: string; joinedPath: FilePath }[];
      files: string[];
      hiddenDirectories: string[];
    }): void => {
      brokerProxy.setupDirectories(params);
    },

    setupDefaultHomedir: (params: {
      homeDir: string;
      directories: { name: string; joinedPath: FilePath }[];
    }): void => {
      brokerProxy.setupDefaultHomedir(params);
    },

    setupEmpty: (): void => {
      brokerProxy.setupEmpty();
    },
  };
};
