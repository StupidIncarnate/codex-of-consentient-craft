/**
 * PURPOSE: Single source of truth for spawning any Claude CLI agent, role-agnostic
 *
 * USAGE:
 * const { kill, sessionId$ } = agentSpawnUnifiedBroker({
 *   prompt: PromptTextStub({ value: 'Do something' }),
 *   cwd: '/path/to/project',
 *   onLine: ({ line }) => {},
 *   onComplete: ({ exitCode, sessionId }) => {},
 * });
 * // Spawns Claude CLI, forwards raw lines, extracts session ID, returns kill handle
 */

import type { ExitCode, RepoRootCwd, SessionId } from '@dungeonmaster/shared/contracts';
import { exitCodeContract } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { readlineCreateInterfaceAdapter } from '../../../adapters/readline/create-interface/readline-create-interface-adapter';
import type { ClaudeModel } from '../../../contracts/claude-model/claude-model-contract';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import { sessionIdExtractorTransformer } from '../../../transformers/session-id-extractor/session-id-extractor-transformer';

export const agentSpawnUnifiedBroker = ({
  prompt,
  cwd,
  resumeSessionId,
  model,
  disableToolSearch,
  onLine,
  onError,
  onComplete,
}: {
  prompt: PromptText;
  cwd: RepoRootCwd;
  resumeSessionId?: SessionId;
  model: ClaudeModel;
  disableToolSearch?: boolean;
  onLine: (params: { line: string }) => void;
  onError?: (params: { error: Error }) => void;
  onComplete: (params: { exitCode: ExitCode | null; sessionId: SessionId | null }) => void;
}): { kill: () => void; sessionId$: Promise<SessionId | null> } => {
  const spawnParams: Parameters<typeof childProcessSpawnStreamJsonAdapter>[0] = {
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

  const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter(spawnParams);

  const rl = readlineCreateInterfaceAdapter({ input: stdout });

  let trackedSessionId: SessionId | null = null;
  const deferred = {
    resolve: (_value: SessionId | null): void => {
      // placeholder replaced by promise constructor
    },
  };
  const sessionId$ = new Promise<SessionId | null>((resolve) => {
    deferred.resolve = resolve;
  });

  rl.onLine(({ line }) => {
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

  childProcess.on('error', (error: Error) => {
    onError?.({ error });
  });

  childProcess.on('exit', (code) => {
    rl.close();
    if (trackedSessionId === null) {
      deferred.resolve(null);
    }
    const parsedExitCode = code === null ? null : exitCodeContract.parse(code);
    onComplete({ exitCode: parsedExitCode, sessionId: trackedSessionId });
  });

  return {
    kill: (): void => {
      childProcess.kill();
    },
    sessionId$,
  };
};
