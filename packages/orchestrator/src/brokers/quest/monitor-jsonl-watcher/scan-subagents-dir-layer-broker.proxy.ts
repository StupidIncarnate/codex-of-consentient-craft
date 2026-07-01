import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import type { FileName } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

import { startSubagentTailLayerBrokerProxy } from './start-subagent-tail-layer-broker.proxy';

export const scanSubagentsDirLayerBrokerProxy = (): {
  setupSubagentDirFiles: (params: { files: readonly FileName[] }) => void;
  setupSubagentDirMissing: (params: { error: Error }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  setupFirstLineRead: (params: { content: string }) => void;
  triggerChange: () => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  // Passthrough for the real normalize the broker runs on a non-active file's first line.
  claudeLineNormalizeBrokerProxy();
  // Mocks the `readFile` the broker uses (via fsReadJsonlAdapter) to read a non-active
  // sub-agent file's first line for prompt-pairing. Defaults to empty so files no test
  // configures yield no first line and skip pairing.
  const readJsonlProxy = fsReadJsonlAdapterProxy();
  // Same registerMock collision rationale as `quest-monitor-jsonl-watcher-broker.proxy.ts`
  // — the LAST mockImplementation on `fsWatchTailAdapter` wins, so the parent's own tail
  // proxy takes ownership when this layer is composed inside it. The child proxy also
  // sets up `claudeLineNormalizeBrokerProxy` via its own composition chain.
  startSubagentTailLayerBrokerProxy();
  const tailProxy = fsWatchTailAdapterProxy();

  return {
    setupSubagentDirFiles: ({ files }: { files: readonly FileName[] }): void => {
      readdirProxy.returns({ files: [...files] });
    },
    setupSubagentDirMissing: ({ error }: { error: Error }): void => {
      readdirProxy.throws({ error });
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    setupFirstLineRead: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({ content });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
