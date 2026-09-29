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

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookWorktreeCreateFlow } from '../flows/hook-worktree-create/hook-worktree-create-flow';

export const StartWorktreeCreateHook = ({ inputData }: { inputData: string }): AdapterResult => {
  const result = HookWorktreeCreateFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  return exit(result.exitCode);
};

readStdinToEnd()
  .then((inputData) => StartWorktreeCreateHook({ inputData }))
  .catch(() => exit(1));
