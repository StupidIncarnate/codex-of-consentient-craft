#!/usr/bin/env node
/**
 * PURPOSE: Entry point for the WorktreeCreate hook, which blocks Claude Code's own worktree path and
 * names the MCP tool that produces a usable tree. The hook stays REGISTERED precisely because
 * registration is what makes it fire, and a hook that does not fire blocks nothing.
 *
 * USAGE:
 * echo '{"hook_event_name":"WorktreeCreate","worktree_path":"/path",...}' | node start-worktree-create-hook.ts
 * // Writes the refusal to stderr and exits 2
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookWorktreeCreateFlow } from '../flows/hook-worktree-create/hook-worktree-create-flow';

export const StartWorktreeCreateHook = ({ inputData }: { inputData: string }): AdapterResult => {
  const result = HookWorktreeCreateFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartWorktreeCreateHook({ inputData: inputBuffer.data });
});
