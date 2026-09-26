/**
 * PURPOSE: Curated surface for the Claude CLI. `resolveClaudeCliPath` locates the binary;
 * `spawnStreamJson` spawns it streaming raw JSONL lines. Both throw `ClaudeNotInstalledError`
 * rather than letting a missing CLI surface as a bare `spawn` ENOENT.
 *
 * USAGE:
 * import { resolveClaudeCliPath, spawnStreamJson, ClaudeNotInstalledError } from '@dungeonmaster/bin/claude';
 */

export * from './claude-not-installed-error';
export * from './claude-resolve-cli-path';
export * from './claude-spawn-stream-json';
