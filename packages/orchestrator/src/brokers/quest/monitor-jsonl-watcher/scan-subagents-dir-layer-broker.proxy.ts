import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { FileName } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

import { startSubagentTailLayerBrokerProxy } from './start-subagent-tail-layer-broker.proxy';

export const scanSubagentsDirLayerBrokerProxy = (): {
  setupSubagentDirFiles: (params: { subagentsDir: string; files: readonly FileName[] }) => void;
  // For a caller that stages "empty at startup, then a file appears by the next poll" — a
  // sticky `setupSubagentDirFiles({files: []})` staged BEFORE a later `setupSubagentDirFiles`
  // call at the same subagentsDir would be shadowed by it for EVERY real readdir call
  // (staging happens before either real call runs), including the very first one that is
  // supposed to see the empty state. This answers ONLY the next readdir call at this
  // dirPath, leaving a subsequently staged `setupSubagentDirFiles` sticky for every call
  // after that.
  setupSubagentDirEmpty: (params: { subagentsDir: string }) => void;
  setupSubagentDirMissing: (params: { subagentsDir: string; error: Error }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  setupFirstLineRead: (params: {
    subagentsDir: string;
    fileName: FileName;
    content: string;
  }) => void;
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
    setupSubagentDirFiles: ({
      subagentsDir,
      files,
    }: {
      subagentsDir: string;
      files: readonly FileName[];
    }): void => {
      readdirProxy.returns({ dirPath: subagentsDir, files: [...files] });
    },
    setupSubagentDirEmpty: ({ subagentsDir }: { subagentsDir: string }): void => {
      readdirProxy.returnsOnceFor({ dirPath: subagentsDir, files: [] });
    },
    setupSubagentDirMissing: ({
      subagentsDir,
      error,
    }: {
      subagentsDir: string;
      error: Error;
    }): void => {
      readdirProxy.throws({ dirPath: subagentsDir, error });
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    setupFirstLineRead: ({
      subagentsDir,
      fileName,
      content,
    }: {
      subagentsDir: string;
      fileName: FileName;
      content: string;
    }): void => {
      readJsonlProxy.returns({
        filePath: absoluteFilePathContract.parse(`${subagentsDir}/${String(fileName)}`),
        content,
      });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
