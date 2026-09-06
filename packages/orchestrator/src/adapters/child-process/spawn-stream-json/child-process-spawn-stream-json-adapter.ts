/**
 * PURPOSE: Spawns Claude CLI with stream-json output format for monitoring agent output
 *
 * USAGE:
 * const { process, stdout } = childProcessSpawnStreamJsonAdapter({
 *   prompt: PromptTextStub({ value: 'Hello' }),
 * });
 * // Returns ChildProcess handle with readable stdout stream
 */

import { spawn, type ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import type { Readable } from 'stream';
import type { ClaudeModel } from '../../../contracts/claude-model/claude-model-contract';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import type { AbsoluteFilePath, RepoRootCwd, SessionId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export interface SpawnStreamJsonResult {
  process: ChildProcess;
  stdout: Readable;
}

export const childProcessSpawnStreamJsonAdapter = ({
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
  resumeSessionId?: SessionId;
  cwd?: RepoRootCwd;
  stdinMode?: 'inherit' | 'ignore';
  model: ClaudeModel;
  disableToolSearch?: boolean;
  // When provided, stderr is piped instead of inherited and each line is forwarded to the
  // callback. Used by the launcher to tag each subprocess's stderr with `proc:<id>` so
  // SDK retry/throttle messages from parallel spawns can be attributed and grepped.
  onStderrLine?: (params: { line: string }) => void;
  // Grants the spawned CLI read access to a directory OUTSIDE cwd. `--add-dir` is a real,
  // headless-`-p`-mode-safe Claude CLI flag (confirmed against the installed 2.1.258 binary: a
  // live spawn granted `--add-dir <dir>` read a file under that dir with no permission error,
  // while the CLI does not error on a not-yet-existing directory either). Chat spawns pass the
  // quest's images directory here — pasted images live under the quest folder
  // (`locationsStatics.quest.imagesDir`), a tree disjoint from the spawn's cwd (the quest's own
  // worktree), so without this grant every Read on a pasted-image path is denied outright in
  // headless mode (no interactive approver to prompt).
  addDir?: AbsoluteFilePath;
}): SpawnStreamJsonResult => {
  // Settings discovery is anchored to the explicit RepoRootCwd. When cwd is undefined we
  // skip the .claude/settings.json read entirely — there is no implicit fallback. Callers
  // that want settings must resolve a typed RepoRootCwd up the chain (cwdResolveBroker).
  let settingsJson = '';
  if (cwd !== undefined) {
    const settingsFile = path.join(
      cwd,
      locationsStatics.repoRoot.claude.dir,
      locationsStatics.repoRoot.claude.settings,
    );
    try {
      settingsJson = readFileSync(settingsFile, 'utf8');
    } catch {
      // settings file may not exist
    }
  }

  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--model', model];

  // Smoketest probe spawns (disableToolSearch === true) only call one MCP tool
  // then signal back — they don't need the SessionStart hook guidance bundle
  // (~10KB of folder/discover/ward snippets per spawn). Strip the hooks field
  // for these spawns to reclaim the tokens. Real-role spawns keep it.
  let effectiveSettingsJson = settingsJson;
  if (disableToolSearch && settingsJson.length > 0) {
    try {
      const parsed: unknown = JSON.parse(settingsJson);
      if (typeof parsed === 'object' && parsed !== null) {
        Reflect.deleteProperty(parsed, 'hooks');
        effectiveSettingsJson = JSON.stringify(parsed);
      }
    } catch {
      // malformed settings — fall through with the original string
    }
  }

  if (effectiveSettingsJson.length > 0) {
    args.push('--settings', effectiveSettingsJson);
  }

  if (resumeSessionId) {
    args.push('--resume', resumeSessionId);
  }

  if (addDir !== undefined) {
    args.push('--add-dir', addDir);
  }

  const cliPath = process.env.CLAUDE_CLI_PATH ?? 'claude';

  // Print mode (`-p`) waits for the session's background tasks — `run_in_background: true`
  // Bash shells — to finish once the final turn ends, but only up to a ceiling: BY DEFAULT
  // 600 SECONDS, after which Claude Code TERMINATES them and exits, cutting the agent off
  // mid-work. Our own guidance is what walks into that: the ward-discipline snippet tells
  // every agent to background a whole-repo `npm run ward` and wait for the task
  // notification, and that run is 3-4 minutes on an idle machine and longer under parallel
  // dispatch. `0` means wait indefinitely.
  //
  // It is set HERE, on the spawn, and not exported in a shell: the orchestrator is a
  // published package, so an end user running `dungeonmaster start` has no shell of ours to
  // export from and would silently keep the 600s ceiling.
  const baseEnv = { ...process.env, CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0' };

  // Haiku models do not support the Claude Code MCP tool-search loop, so smoketest
  // spawns (which force --model haiku) need ENABLE_TOOL_SEARCH=false to load every
  // MCP tool's schema upfront. Without this, deferred tools like
  // mcp__dungeonmaster__signal-back are listed by name but unreachable.
  const env = disableToolSearch ? { ...baseEnv, ENABLE_TOOL_SEARCH: 'false' } : baseEnv;

  const stderrMode = onStderrLine === undefined ? 'inherit' : 'pipe';

  const childProcess = spawn(cliPath, args, {
    stdio: [stdinMode, 'pipe', stderrMode],
    env,
    ...(cwd && { cwd }),
  });

  // stdio[1] is unconditionally 'pipe', so stdout is guaranteed non-null at runtime —
  // but TypeScript widens the spawn overload result to `Readable | null` once stdio[2]
  // is a variable instead of a literal, so a runtime guard is needed to satisfy the
  // narrower return type.
  const { stdout } = childProcess;
  if (stdout === null) {
    throw new Error(
      'childProcessSpawnStreamJsonAdapter: childProcess.stdout is null despite stdio[1] = pipe',
    );
  }

  if (onStderrLine !== undefined && childProcess.stderr !== null) {
    const stderrReader = createInterface({ input: childProcess.stderr });
    stderrReader.on('line', (line: string) => {
      onStderrLine({ line });
    });
  }

  return {
    process: childProcess,
    stdout,
  };
};
