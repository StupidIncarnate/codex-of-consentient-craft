/**
 * PURPOSE: Single source of truth for spawning any Claude CLI agent, role-agnostic
 *
 * USAGE:
 * const { kill, sessionId$ } = agentSpawnUnifiedBroker({
 *   prompt: 'Do something',
 *   cwd: '/path/to/project',
 *   onLine: ({ line }) => {},
 *   onComplete: ({ exitCode, sessionId }) => {},
 * });
 * // Spawns Claude CLI, forwards raw lines, extracts session ID, returns kill handle
 */

import { lineReader } from '#gateway/node/readline';
import { stderr } from '#gateway/node/process';
import type { Session } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import type { ClaudeModel } from '../../../contracts/claude-model/claude-model-contract';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';
import { agentSpawnStreamJsonBroker } from '../spawn-stream-json/agent-spawn-stream-json-broker';

export const agentSpawnUnifiedBroker = ({
  prompt,
  cwd,
  resumeSessionId,
  model,
  disableToolSearch,
  onLine,
  onError,
  onComplete,
  onStderrLine,
  addDir,
}: {
  prompt: string;
  cwd: string;
  resumeSessionId?: Session['id'];
  model: ClaudeModel;
  disableToolSearch?: boolean;
  onLine: (params: { line: string }) => void;
  onError?: (params: { error: Error }) => void;
  onComplete: (params: { exitCode: number | null; sessionId: Session['id'] | null }) => void;
  // Forwarded to the spawn broker. Default behavior (undefined) inherits stderr to the
  // parent terminal. The launcher always passes a tagging callback so each subprocess's
  // stderr gets `proc:<id>` attribution in the dev log.
  onStderrLine?: (params: { line: string }) => void;
  // Forwarded verbatim to the spawn broker's `--add-dir` grant. See that broker's header
  // for why a chat spawn needs this — the quest's images directory sits outside the spawn's
  // cwd, so a pasted-image Read is denied without it.
  addDir?: string;
}): { kill: () => void; sessionId$: Promise<Session['id'] | null>; pid: number | undefined } => {
  const spawnParams: Parameters<typeof agentSpawnStreamJsonBroker>[0] = {
    prompt,
    cwd,
    model,
  };

  if (resumeSessionId) {
    spawnParams.resumeSessionId = resumeSessionId;
  }

  if (disableToolSearch !== undefined) {
    spawnParams.disableToolSearch = disableToolSearch;
  }

  if (onStderrLine !== undefined) {
    spawnParams.onStderrLine = onStderrLine;
  }

  if (addDir !== undefined) {
    spawnParams.addDir = addDir;
  }

  const { process: childProcess, stdout } = agentSpawnStreamJsonBroker(spawnParams);

  const rl = lineReader({ input: stdout });

  let trackedSessionId: Session['id'] | null = null;
  const deferred = {
    resolve: (_value: Session['id'] | null): void => {
      // placeholder replaced by promise constructor
    },
  };
  const sessionId$ = new Promise<Session['id'] | null>((resolve) => {
    deferred.resolve = resolve;
  });

  rl.onLine((line) => {
    onLine({ line });

    if (trackedSessionId === null) {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const sessionId = sessionIdExtractorTransformer({ parsed });
      if (sessionId !== null) {
        trackedSessionId = sessionId;
        deferred.resolve(sessionId);
      }
    }
  });

  rl.onError((readerError) => {
    stderr.write(`[agent-spawn] stdout reader failed: ${String(readerError)}\n`);
  });

  childProcess.on('error', (error: Error) => {
    onError?.({ error });
  });

  childProcess.on('exit', (code) => {
    rl.close();
    if (trackedSessionId === null) {
      deferred.resolve(null);
    }
    const parsedExitCode = code === null ? null : code;
    onComplete({ exitCode: parsedExitCode, sessionId: trackedSessionId });
  });

  // childProcess.pid is undefined only if spawn failed synchronously (e.g. ENOENT). Surface
  // it so the launcher can record OS-level telemetry against the registry entry — the stale
  // watchdog uses this for kill(pid, 0) liveness probes and /proc/<pid>/stat CPU sampling.
  const childPid = childProcess.pid;
  const pid: number | undefined =
    typeof childPid === 'number' && childPid > 0 ? childPid : undefined;

  return {
    kill: (): void => {
      childProcess.kill();
    },
    sessionId$,
    pid,
  };
};
