import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { readNonEmptyLinesProxy } from '#gateway/node/fs__promises/read-non-empty-lines/read-non-empty-lines.proxy';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { FileName } from '@dungeonmaster/shared/contracts';

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
  setupLines: (params: { path: string; lines: readonly string[] }) => void;
  setupFirstLineRead: (params: {
    subagentsDir: string;
    fileName: FileName;
    content: string;
  }) => void;
} => {
  isFsErrorProxy();
  const readdirProxy = readdirSyncProxy();
  // Passthrough for the real normalize the broker runs on a non-active file's first line.
  claudeLineNormalizeBrokerProxy();
  // Mocks the `readFile` the broker uses (via readNonEmptyLines) to read a non-active
  // sub-agent file's first line for prompt-pairing. A file no test configures throws on the
  // read, which the broker treats as a non-fatal skip.
  const readLinesProxy = readNonEmptyLinesProxy();
  // scan-subagents-dir-layer-broker.ts starts its tails through startSubagentTailLayerBroker, so
  // the tail staging lives in that layer's proxy, addressed by each sub-agent file's path.
  const tailProxy = startSubagentTailLayerBrokerProxy();

  return {
    setupSubagentDirFiles: ({
      subagentsDir,
      files,
    }: {
      subagentsDir: string;
      files: readonly FileName[];
    }): void => {
      readdirProxy.returns({ path: subagentsDir, names: [...files] });
    },
    setupSubagentDirEmpty: ({ subagentsDir }: { subagentsDir: string }): void => {
      readdirProxy.returnsOnce({ path: subagentsDir, names: [] });
    },
    setupSubagentDirMissing: ({
      subagentsDir,
      error,
    }: {
      subagentsDir: string;
      error: Error;
    }): void => {
      readdirProxy.throws({ path: subagentsDir, error });
    },
    setupLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      tailProxy.setupLines({ path, lines });
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
      readLinesProxy.returnsRaw({
        path: absoluteFilePathContract.parse(`${subagentsDir}/${String(fileName)}`),
        rawContents: content,
      });
    },
  };
};
