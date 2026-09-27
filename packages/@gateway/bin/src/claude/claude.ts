/**
 * PURPOSE: Curated surface for the Claude CLI. `resolveClaudeCliPath` locates the binary;
 * `spawnStreamJson` spawns it streaming raw JSONL lines. Both throw `ClaudeNotInstalledError`
 * rather than letting a missing CLI surface as a bare `spawn` ENOENT.
 *
 * USAGE:
 * import { resolveClaudeCliPath, spawnStreamJson, ClaudeNotInstalledError } from '#gateway/bin/claude';
 */

export { ClaudeNotInstalledError } from './resolve-claude-cli-path/claude-not-installed.error';
export { resolveClaudeCliPath } from './resolve-claude-cli-path/resolve-claude-cli-path';
export { spawnStreamJson } from './spawn-stream-json/spawn-stream-json';
