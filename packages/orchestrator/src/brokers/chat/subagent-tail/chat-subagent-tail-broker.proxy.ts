import { ensureDir } from '#gateway/node/fs__promises';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { homedir } from '#gateway/node/os';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

export const chatSubagentTailBrokerProxy = (): {
  setupHomeDir: (params: { homeDir: string }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
  lastWatchedPath: () => unknown;
} => {
  claudeLineNormalizeBrokerProxy();
  const homedirHandle = registerMock({ fn: homedir });
  const tailProxy = fsWatchTailAdapterProxy();
  // Wired to satisfy enforce-proxy-child-creation; ensureDirProxy mocks the underlying `mkdir`
  // this composes, which this broker never reaches — it mocks `ensureDir` itself (below) instead,
  // since the exact prefix (home + cwd + sessionId) varies per test but the broker's own
  // subagents-dir is ALWAYS suffixed `/subagents` by construction, and a predicate on that suffix
  // addresses every call this broker ever makes without each test recomputing the full path —
  // ensureDirProxy's own `succeeds`/`rejects` take only an exact path.
  ensureDirProxy();
  const ensureDirHandle = registerMock({ fn: ensureDir });
  ensureDirHandle.calledWith([(path: string) => path.endsWith('/subagents')]).resolves(undefined);
  fsAppendFileAdapterProxy();

  return {
    setupHomeDir: ({ homeDir }: { homeDir: string }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
    lastWatchedPath: (): unknown => tailProxy.lastWatchedPath(),
  };
};
