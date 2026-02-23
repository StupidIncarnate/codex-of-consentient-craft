import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const sessionChatHistoryBrokerProxy = (): {
  setupMainEntries: (params: { content: string }) => void;
  setupSubagentDir: (params: { files: string[] }) => void;
  setupSubagentEntries: (params: { content: string }) => void;
  setupSubagentDirMissing: () => void;
} => {
  const readJsonlProxy = fsReadJsonlAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  pathJoinAdapterProxy();

  return {
    setupMainEntries: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({
        filePath: '' as never,
        content,
      });
    },
    setupSubagentDir: ({ files }: { files: string[] }): void => {
      readdirProxy.returns({ files });
    },
    setupSubagentEntries: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({
        filePath: '' as never,
        content,
      });
    },
    setupSubagentDirMissing: (): void => {
      readdirProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
