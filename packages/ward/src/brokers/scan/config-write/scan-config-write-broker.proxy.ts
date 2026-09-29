import { mkdtempSyncProxy } from '#gateway/node/fs/mkdtemp-sync/mkdtemp-sync.proxy';
import { writeFileSyncProxy } from '#gateway/node/fs/write-file-sync/write-file-sync.proxy';

import { scanStatics } from '../../../statics/scan/scan-statics';
import { tmpdirFindBrokerProxy } from '../../tmpdir/find/tmpdir-find-broker.proxy';

export const scanConfigWriteBrokerProxy = (): {
  setupTempDir: (params: { directory: string }) => void;
  getWrittenSource: (params: { directory: string }) => unknown;
} => {
  const tmpdirProxy = tmpdirFindBrokerProxy();
  tmpdirProxy.returns({ path: '/tmp' });
  const mkdtempProxy = mkdtempSyncProxy();
  const writeProxy = writeFileSyncProxy();

  return {
    setupTempDir: ({ directory }: { directory: string }): void => {
      mkdtempProxy.returns({ prefix: `/tmp/${scanStatics.config.tempDirPrefix}`, dir: directory });
      writeProxy.succeeds({ path: `${directory}/${scanStatics.config.wrapperName}` });
    },

    getWrittenSource: ({ directory }: { directory: string }): unknown =>
      writeProxy.writtenContents({ path: `${directory}/${scanStatics.config.wrapperName}` }),
  };
};
