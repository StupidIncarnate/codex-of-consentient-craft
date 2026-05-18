import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const monitorSessionAnnounceBrokerProxy = (): {
  getWrittenContent: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    getWrittenContent: writeProxy.getWrittenContent,
    getAllWrittenFiles: writeProxy.getAllWrittenFiles,
  };
};
