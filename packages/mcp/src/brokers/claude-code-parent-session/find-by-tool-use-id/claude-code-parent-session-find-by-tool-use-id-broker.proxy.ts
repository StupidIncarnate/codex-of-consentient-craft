import { FileContentsStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

// Both readdir and readFile mocks are FIFO queues (mockResolvedValueOnce). Setup order
// must match the broker's call order: readdir is called once for the top-level sessions
// dir, then once per discovered sessionId for its `<sessionId>/subagents/` dir; readFile
// is called per `agent-*.jsonl` candidate within each subagents dir.
export const claudeCodeParentSessionFindByToolUseIdBrokerProxy = (): {
  setupHomeDir: (params: { path: string }) => void;
  enqueueReaddir: (params: { entries: readonly string[] }) => void;
  enqueueReaddirMissing: () => void;
  enqueueReadFile: (params: { contents: string }) => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
    },
    enqueueReaddir: ({ entries }: { entries: readonly string[] }): void => {
      readdirProxy.returns({
        entries: entries.map((entry) => FolderNameStub({ value: entry })),
      });
    },
    enqueueReaddirMissing: (): void => {
      readdirProxy.returnsUndefined();
    },
    enqueueReadFile: ({ contents }: { contents: string }): void => {
      readFileProxy.returns({
        filepath: PathSegmentStub({ value: '/unused' }),
        contents: FileContentsStub({ value: contents }),
      });
    },
  };
};
