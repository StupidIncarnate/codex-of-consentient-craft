/**
 * PURPOSE: Decides the argv and environment of a headless `claude -p` stream-json spawn: the
 * prompt, the model, the project's `.claude/settings.json` (hooks stripped for a probe spawn),
 * `--resume`, `--add-dir`, and the variables the orchestrator sets on the spawn itself. Reach for
 * this over hand-assembling flags at a spawn site — flag order and settings handling live here.
 *
 * USAGE:
 * const { args, env } = claudeSpawnCommandBuildTransformer({
 *   prompt, model, settingsJson: '{"hooks":{}}', disableToolSearch: false, baseEnv: { PATH: '/usr/bin' },
 * });
 * // args: ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--model', model, '--settings', ...]
 * // env:  baseEnv with undefined entries dropped, plus CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS='0'
 *
 * An empty `settingsJson` means no settings file was read and no `--settings` flag is passed.
 *
 * `--add-dir` grants the CLI read access to a directory OUTSIDE its cwd. It is a headless-safe
 * flag and the CLI does not error on a directory that does not exist yet. Chat spawns pass the
 * quest's images directory: pasted images live under the quest folder, a tree disjoint from the
 * spawn's cwd, so without the grant every Read on a pasted-image path is denied outright (no
 * interactive approver exists to prompt in `-p` mode).
 *
 * `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` asks print mode to wait indefinitely for the session's
 * background tasks once the final turn ends. Measured against Claude Code 2.1.265 it changes
 * NOTHING: the child exits within seconds and its background commands die with it. It is set on
 * the spawn — not exported in a shell — because the orchestrator is a published package and an
 * end user running `dungeonmaster start` has no shell of ours to export from. Do not read it as
 * protection; the SubagentStop guard in @dungeonmaster/hooks is what holds a spawned child's
 * background command, and this package's README carries the measurement.
 *
 * Haiku models do not support the Claude Code MCP tool-search loop, so smoketest spawns (which
 * force --model haiku) need ENABLE_TOOL_SEARCH=false to load every MCP tool's schema upfront.
 * Without it, deferred tools like mcp__dungeonmaster__signal-back are listed by name but
 * unreachable.
 */

import type { AbsoluteFilePath, SessionId } from '@dungeonmaster/shared/contracts';

import type { ClaudeModel } from '../../contracts/claude-model/claude-model-contract';
import { claudeSpawnCommandContract } from '../../contracts/claude-spawn-command/claude-spawn-command-contract';
import type { ClaudeSpawnCommand } from '../../contracts/claude-spawn-command/claude-spawn-command-contract';
import type { PromptText } from '../../contracts/prompt-text/prompt-text-contract';

const PRINT_BG_WAIT_CEILING_NAME = 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS';
const ENABLE_TOOL_SEARCH_NAME = 'ENABLE_TOOL_SEARCH';

export const claudeSpawnCommandBuildTransformer = ({
  prompt,
  model,
  settingsJson,
  disableToolSearch,
  baseEnv,
  resumeSessionId,
  addDir,
}: {
  prompt: PromptText;
  model: ClaudeModel;
  settingsJson: string;
  disableToolSearch: boolean;
  baseEnv: Readonly<Record<string, string | undefined>>;
  resumeSessionId?: SessionId;
  addDir?: AbsoluteFilePath;
}): ClaudeSpawnCommand => {
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--model', model];

  // Smoketest probe spawns (disableToolSearch === true) only call one MCP tool then signal back —
  // they do not need the SessionStart hook guidance bundle (~10KB of folder/discover/ward
  // snippets per spawn). The hooks field is stripped for them to reclaim the tokens; real-role
  // spawns keep it.
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

  if (resumeSessionId !== undefined) {
    args.push('--resume', resumeSessionId);
  }

  if (addDir !== undefined) {
    args.push('--add-dir', addDir);
  }

  const inherited = Object.fromEntries(
    Object.entries(baseEnv).flatMap(([name, value]) =>
      value === undefined ? [] : [[name, value]],
    ),
  );

  return claudeSpawnCommandContract.parse({
    args,
    env: {
      ...inherited,
      [PRINT_BG_WAIT_CEILING_NAME]: '0',
      ...(disableToolSearch && { [ENABLE_TOOL_SEARCH_NAME]: 'false' }),
    },
  });
};
