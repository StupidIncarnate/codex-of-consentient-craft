import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const questLoadBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
  setupQuestFileReadError: (params: { error: Error }) => void;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();

  return {
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      fsReadFileProxy.resolves({ content: questJson });
    },
    setupQuestFileReadError: ({ error }: { error: Error }): void => {
      fsReadFileProxy.rejects({ error });
    },
  };
};
