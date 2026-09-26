/**
 * PURPOSE: Spawns the Claude CLI streaming its stream-json output, resolving the executable
 * through `resolveClaudeCliPath` instead of a bare `'claude'` on `$PATH`. Returns the live
 * process and its `stdout` — never a captured string — because the caller (this repo's
 * orchestrator) parses JSONL lines as they arrive and correlates them against the process while
 * the CLI is still running. Building the argv itself (the prompt, `--model`, `--settings`,
 * `--resume`, `--add-dir`) is NOT this file's job — that logic reads our own contracts and stays
 * in the orchestrator broker this wrapper is spawned from; this file only resolves the binary
 * and performs the spawn.
 *
 * USAGE:
 * const { process, stdout } = spawnStreamJson({ args: ['-p', 'hi', '--model', 'sonnet'] });
 * // Returns the live ChildProcess plus its guaranteed-non-null stdout Readable
 */

import { spawnLive } from '@dungeonmaster/node/child_process';

import { resolveClaudeCliPath } from './claude-resolve-cli-path';

export const spawnStreamJson = ({
  args,
  cwd,
  env,
  stdinMode = 'inherit',
  stderrMode = 'pipe',
  abortSignal,
}: {
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  stdinMode?: 'inherit' | 'ignore';
  stderrMode?: 'inherit' | 'pipe';
  abortSignal?: AbortSignal;
}): ReturnType<typeof spawnLive> => {
  const cliPath = resolveClaudeCliPath();

  return spawnLive({
    command: cliPath,
    args,
    stdin: stdinMode,
    stderr: stderrMode,
    ...(cwd === undefined ? {} : { cwd }),
    ...(env === undefined ? {} : { env }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });
};
