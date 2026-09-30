/**
 * PURPOSE: Spawns the Claude CLI headless with stream-json output for one agent turn. Owns what
 * only this repo knows about that spawn — the project's `.claude/settings.json` read, the argv and
 * environment decisions, and tagging the child's stderr — and hands the raw spawn to
 * `spawnStreamJson`. Reach for this over `spawnStreamJson` directly: that wrapper takes a finished
 * argv and knows nothing of settings, `--resume` or `--add-dir`.
 *
 * USAGE:
 * const { process: child, stdout } = agentSpawnStreamJsonBroker({
 *   prompt: PromptTextStub({ value: 'Hello' }),
 *   cwd: RepoRootCwdStub({ value: '/repo' }),
 *   model: ClaudeModelStub({ value: 'sonnet' }),
 * });
 * // Returns the live ChildProcess and its stdout Readable
 *
 * Settings discovery is anchored to the explicit RepoRootCwd. With no cwd the settings read is
 * skipped entirely — there is no implicit fallback; callers that want settings resolve a typed
 * RepoRootCwd up the chain (cwdResolveBroker).
 */

import { spawnStreamJson } from '#gateway/bin/claude';
import { readFileSyncIfExists } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { envSnapshot, stderr } from '#gateway/node/process';
import { lineReader } from '#gateway/node/readline';
import type { Session } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import type { ClaudeModel } from '../../../contracts/claude-model/claude-model-contract';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import { claudeSpawnCommandBuildTransformer } from '../../../transformers/claude-spawn-command-build/claude-spawn-command-build-transformer';

export const agentSpawnStreamJsonBroker = ({
  prompt,
  resumeSessionId,
  cwd,
  stdinMode = 'inherit',
  model,
  disableToolSearch = false,
  onStderrLine,
  addDir,
}: {
  prompt: PromptText;
  resumeSessionId?: Session['id'];
  cwd?: string;
  stdinMode?: 'inherit' | 'ignore';
  model: ClaudeModel;
  disableToolSearch?: boolean;
  // When provided, stderr is piped instead of inherited and each line is forwarded to the
  // callback. The launcher tags each subprocess's stderr with `proc:<id>` so SDK retry/throttle
  // messages from parallel spawns can be attributed and grepped.
  onStderrLine?: (params: { line: string }) => void;
  // Grants the spawned CLI read access to a directory OUTSIDE cwd — chat spawns pass the quest's
  // images directory (`locationsStatics.quest.imagesDir`).
  addDir?: string;
}): ReturnType<typeof spawnStreamJson> => {
  const settingsJson =
    cwd === undefined
      ? ''
      : (readFileSyncIfExists(
          join(
            cwd,
            locationsStatics.repoRoot.claude.dir,
            locationsStatics.repoRoot.claude.settings,
          ),
        ) ?? '');

  const { args, env } = claudeSpawnCommandBuildTransformer({
    prompt,
    model,
    settingsJson,
    disableToolSearch,
    baseEnv: envSnapshot(),
    ...(resumeSessionId !== undefined && { resumeSessionId }),
    ...(addDir !== undefined && { addDir }),
  });

  const spawned = spawnStreamJson({
    args,
    env,
    stdinMode,
    stderrMode: onStderrLine === undefined ? 'inherit' : 'pipe',
    ...(cwd !== undefined && { cwd }),
  });

  if (onStderrLine !== undefined && spawned.process.stderr !== null) {
    const stderrReader = lineReader({ input: spawned.process.stderr });
    stderrReader.onLine((line) => {
      try {
        onStderrLine({ line });
      } catch (lineError: unknown) {
        // readline calls this outside any caller frame, so a throw here is an uncaught exception
        // that kills the server over a diagnostic line from a child process.
        stderr.write(`[spawn-stream-json] onStderrLine failed: ${String(lineError)}\n`);
      }
    });
    stderrReader.onError((readerError) => {
      stderr.write(`[spawn-stream-json] stderr reader failed: ${String(readerError)}\n`);
    });
  }

  return spawned;
};
