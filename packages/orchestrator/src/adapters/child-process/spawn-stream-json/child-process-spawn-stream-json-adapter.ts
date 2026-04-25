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
import type { Readable } from 'stream';
import type { ClaudeModel } from '../../../contracts/claude-model/claude-model-contract';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import type { SessionId } from '@dungeonmaster/shared/contracts';

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
}: {
  prompt: PromptText;
  resumeSessionId?: SessionId;
  cwd?: string;
  stdinMode?: 'inherit' | 'ignore';
  model: ClaudeModel;
  disableToolSearch?: boolean;
}): SpawnStreamJsonResult => {
  const effectiveCwd = cwd ?? process.cwd();
  const settingsFile = path.join(effectiveCwd, '.claude', 'settings.json');
  let settingsJson = '';
  try {
    settingsJson = readFileSync(settingsFile, 'utf8');
  } catch {
    // settings file may not exist
  }

  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--model', model];

  if (settingsJson.length > 0) {
    args.push('--settings', settingsJson);
  }

  if (resumeSessionId) {
    args.push('--resume', resumeSessionId);
  }

  const cliPath = process.env.CLAUDE_CLI_PATH ?? 'claude';

  // Haiku models do not support the Claude Code MCP tool-search loop, so smoketest
  // spawns (which force --model haiku) need ENABLE_TOOL_SEARCH=false to load every
  // MCP tool's schema upfront. Without this, deferred tools like
  // mcp__dungeonmaster__signal-back are listed by name but unreachable.
  const env = disableToolSearch
    ? { ...process.env, ENABLE_TOOL_SEARCH: 'false' }
    : { ...process.env };

  const childProcess = spawn(cliPath, args, {
    stdio: [stdinMode, 'pipe', 'inherit'],
    env,
    ...(cwd && { cwd }),
  });

  // stdout is guaranteed to exist when stdio[1] is 'pipe'
  // Using non-null assertion as TypeScript doesn't narrow based on stdio config
  const { stdout } = childProcess;

  return {
    process: childProcess,
    stdout,
  };
};
