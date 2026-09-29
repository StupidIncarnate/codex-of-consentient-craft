/**
 * PURPOSE: Zod schema for validating Claude settings.json configuration file structure
 *
 * USAGE:
 * const settings = claudeSettingsContract.parse({
 *   hooks: {
 *     PreToolUse: [{
 *       matcher: 'Write|Edit',
 *       hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }]
 *     }]
 *   }
 * });
 * // Returns typed ClaudeSettings object
 */

import { z } from '#gateway/npm/zod';

const hookTypeContract = z.string().brand<'HookType'>();
const hookCommandContract = z.string().brand<'HookCommand'>();
const hookMatcherContract = z.string().brand<'HookMatcher'>();

// Loose at every level a user may hold keys of their own (`timeout`, `url`, `prompt`, events this
// contract does not name): a settings.json read through it is written back whole, so a stripped key
// would be a deleted key. `command` is optional because only command-type hooks carry one.
const hookEntryContract = z
  .object({
    type: hookTypeContract,
    command: hookCommandContract.optional(),
  })
  .loose();

const preToolUseHookContract = z
  .object({
    matcher: hookMatcherContract.optional(),
    hooks: z.array(hookEntryContract),
  })
  .loose();

const sessionStartHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .loose();

const postToolUseHookContract = z
  .object({
    matcher: hookMatcherContract.optional(),
    hooks: z.array(hookEntryContract),
  })
  .loose();

const worktreeCreateHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .loose();

const subagentStartHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .loose();

const subagentStopHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .loose();

const hooksConfigContract = z
  .object({
    PreToolUse: z.array(preToolUseHookContract).optional(),
    PostToolUse: z.array(postToolUseHookContract).optional(),
    SessionStart: z.array(sessionStartHookContract).optional(),
    SubagentStart: z.array(subagentStartHookContract).optional(),
    SubagentStop: z.array(subagentStopHookContract).optional(),
    WorktreeCreate: z.array(worktreeCreateHookContract).optional(),
  })
  .loose();

const permissionStringContract = z.string().brand<'PermissionString'>();

const permissionsConfigContract = z
  .object({
    allow: z.array(permissionStringContract).optional(),
    deny: z.array(permissionStringContract).optional(),
  })
  .loose();

const envValueContract = z.string().brand<'EnvValue'>();

const envConfigContract = z.record(z.string().brand<'EnvVarName'>(), envValueContract);

const promptCacheTtlContract = z.enum(['5m', '1h']);

// 'accept' is a legal value of this key, but only in a user's own settings — Claude Code lets a
// settings file TIGHTEN the key and never loosen it, so a repo writing 'accept' is ignored.
const crossSessionInboundContract = z.enum(['accept', 'hold', 'refuse']);

export const claudeSettingsContract = z
  .object({
    hooks: hooksConfigContract.optional(),
    permissions: permissionsConfigContract.optional(),
    env: envConfigContract.optional(),
    crossSessionInbound: crossSessionInboundContract.optional(),
    promptCacheTtl: promptCacheTtlContract.optional(),
    subagentPromptCacheTtl: promptCacheTtlContract.optional(),
    promptSuggestionEnabled: z.boolean().optional(),
  })
  .loose();

export type ClaudeSettings = z.infer<typeof claudeSettingsContract>;
export type HooksConfig = z.infer<typeof hooksConfigContract>;
export type PreToolUseHook = z.infer<typeof preToolUseHookContract>;
export type SessionStartHook = z.infer<typeof sessionStartHookContract>;
export type HookEntry = z.infer<typeof hookEntryContract>;
export type HookType = z.infer<typeof hookTypeContract>;
export type HookCommand = z.infer<typeof hookCommandContract>;
export type PostToolUseHook = z.infer<typeof postToolUseHookContract>;
export type WorktreeCreateHook = z.infer<typeof worktreeCreateHookContract>;
export type SubagentStartHook = z.infer<typeof subagentStartHookContract>;
export type SubagentStopHook = z.infer<typeof subagentStopHookContract>;
export type HookMatcher = z.infer<typeof hookMatcherContract>;
export type PermissionsConfig = z.infer<typeof permissionsConfigContract>;
export type PermissionString = z.infer<typeof permissionStringContract>;
export type EnvConfig = z.infer<typeof envConfigContract>;
export type EnvValue = z.infer<typeof envValueContract>;
export type PromptCacheTtl = z.infer<typeof promptCacheTtlContract>;
export type CrossSessionInbound = z.infer<typeof crossSessionInboundContract>;
