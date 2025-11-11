import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { FileStatsStub } from '../../../contracts/file-stats/file-stats.stub';

export const sessionIsNewBrokerProxy = (): {
  setupFileExists: ({ size }: { size: number }) => void;
  setupFileNotFound: () => void;
} => {
  const fsProxy = fsStatAdapterProxy();

  return {
    setupFileExists: ({ size }: { size: number }): void => {
      const stats = FileStatsStub({ size });
      fsProxy.returns({ stats });
    },
    setupFileNotFound: (): void => {
      fsProxy.throws({ error: new Error('ENOENT: no such file or directory') });
    },
  };
};
