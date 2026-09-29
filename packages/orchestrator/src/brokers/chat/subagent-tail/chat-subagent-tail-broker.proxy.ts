import { appendFile, ensureDir } from '#gateway/node/fs__promises';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { tailFileProxy } from '#gateway/node/fs/tail-file/tail-file.proxy';
import { homedir } from '#gateway/node/os';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const chatSubagentTailBrokerProxy = (): {
  setupHomeDir: (params: { homeDir: string }) => void;
  setupFile: (params: { path: string }) => void;
  setupLines: (params: { path: string; lines: readonly string[] }) => void;
  triggerChange: (params: { path: string }) => void;
  getWatchCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  claudeLineNormalizeBrokerProxy();
  getEnvProxy();
  stderrProxy();
  const homedirHandle = registerMock({ fn: homedir });
  const tailProxy = tailFileProxy();
  // Wired to satisfy enforce-proxy-child-creation; ensureDirProxy mocks the underlying `mkdir`
  // this composes, which this broker never reaches — it mocks `ensureDir` itself (below) instead,
  // since the exact prefix (home + cwd + sessionId) varies per test but the broker's own
  // subagents-dir is ALWAYS suffixed `/subagents` by construction, and a predicate on that suffix
  // addresses every call this broker ever makes without each test recomputing the full path —
  // ensureDirProxy's own `succeeds`/`rejects` take only an exact path.
  ensureDirProxy();
  const ensureDirHandle = registerMock({ fn: ensureDir });
  ensureDirHandle.calledWith([(path: string) => path.endsWith('/subagents')]).resolves(undefined);
  // The touch's path is built inside the broker from session + cwd + agent, so it is addressed by
  // its shape — a `.jsonl` directly under a `subagents/` directory — rather than by value.
  appendFileProxy();
  registerMock({ fn: appendFile })
    .calledWith([(path: string) => path.includes('/subagents/agent-') && path.endsWith('.jsonl')])
    .resolves(undefined);

  return {
    setupHomeDir: ({ homeDir }: { homeDir: string }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
    },
    setupFile: ({ path }: { path: string }): void => {
      tailProxy.setupFile({ path });
    },
    setupLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      tailProxy.setupLines({ path, lines });
    },
    triggerChange: ({ path }: { path: string }): void => {
      tailProxy.triggerChange({ path });
    },
    getWatchCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      tailProxy.getWatchCallsFor({ path }),
  };
};
