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

// Loose at every level a user may hold keys of their own (`timeout`, `url`, `prompt`, events this
// contract does not name): a settings.json read through it is written back whole, so a stripped key
// would be a deleted key. `command` is optional because only command-type hooks carry one.
const hookEntryContract = z
  .object({
    type: z.string().brand<'HookEntryType'>(),
    command: z.string().brand<'HookEntryCommand'>().optional(),
  })
  .brand<'HookEntry'>()
  .loose();

const preToolUseHookContract = z
  .object({
    matcher: z.string().brand<'PreToolUseHookMatcher'>().optional(),
    hooks: z.array(hookEntryContract),
  })
  .brand<'PreToolUseHook'>()
  .loose();

const sessionStartHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .brand<'SessionStartHook'>()
  .loose();

const postToolUseHookContract = z
  .object({
    matcher: preToolUseHookContract.shape.matcher,
    hooks: z.array(hookEntryContract),
  })
  .brand<'PostToolUseHook'>()
  .loose();

const worktreeCreateHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .brand<'WorktreeCreateHook'>()
  .loose();

const subagentStartHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .brand<'SubagentStartHook'>()
  .loose();

const subagentStopHookContract = z
  .object({
    hooks: z.array(hookEntryContract),
  })
  .brand<'SubagentStopHook'>()
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
  .brand<'HooksConfig'>()
  .loose();

const permissionsConfigContract = z
  .object({
    allow: z.array(z.string().brand<'PermissionsConfigAllow'>()).optional(),
    deny: z.array(z.string().brand<'PermissionsConfigDeny'>()).optional(),
  })
  .brand<'PermissionsConfig'>()
  .loose();

// `promptCacheTtl` and `crossSessionInbound` are plain strings, not enums: Claude Code owns these
// values and adds new ones. Init writes its own default only when the consumer's file carries none,
// and reads neither, so a value newer than this contract must round-trip rather than make
// `dungeonmaster init` throw.
export const claudeSettingsContract = z
  .object({
    hooks: hooksConfigContract.optional(),
    permissions: permissionsConfigContract.optional(),
    env: z.record(z.string(), z.string().brand<'ClaudeSettingsEnv'>()).optional(),
    crossSessionInbound: z.string().brand<'ClaudeSettingsCrossSessionInbound'>().optional(),
    promptCacheTtl: z.string().brand<'ClaudeSettingsPromptCacheTtl'>().optional(),
    subagentPromptCacheTtl: z.string().brand<'ClaudeSettingsSubagentPromptCacheTtl'>().optional(),
    promptSuggestionEnabled: z.boolean().optional(),
  })
  .loose()
  .brand<'ClaudeSettings'>();

export type ClaudeSettings = z.infer<typeof claudeSettingsContract>;
export type HooksConfig = z.infer<typeof hooksConfigContract>;
export type PreToolUseHook = z.infer<typeof preToolUseHookContract>;
export type SessionStartHook = z.infer<typeof sessionStartHookContract>;
export type HookEntry = z.infer<typeof hookEntryContract>;
export type PostToolUseHook = z.infer<typeof postToolUseHookContract>;
export type WorktreeCreateHook = z.infer<typeof worktreeCreateHookContract>;
export type SubagentStartHook = z.infer<typeof subagentStartHookContract>;
export type SubagentStopHook = z.infer<typeof subagentStopHookContract>;
export type PermissionsConfig = z.infer<typeof permissionsConfigContract>;
