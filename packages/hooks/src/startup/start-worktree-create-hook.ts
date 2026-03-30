#!/usr/bin/env node
/**
 * PURPOSE: Entry point for WorktreeCreate hook that creates a git worktree and builds the project
 *
 * USAGE:
 * echo '{"hook_event_name":"WorktreeCreate","worktree_path":"/path",...}' | node start-worktree-create-hook.ts
 * // Creates worktree, runs npm build, outputs worktree path to stdout
 */

import { HookWorktreeCreateFlow } from '../flows/hook-worktree-create/hook-worktree-create-flow';

export const StartWorktreeCreateHook = ({ inputData }: { inputData: string }): void => {
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
