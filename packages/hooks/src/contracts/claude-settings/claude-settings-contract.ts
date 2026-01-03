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

import { z } from 'zod';

const hookTypeContract = z.string().brand<'HookType'>();
const hookCommandContract = z.string().brand<'HookCommand'>();
const hookMatcherContract = z.string().brand<'HookMatcher'>();

const hookEntryContract = z.object({
  type: hookTypeContract,
  command: hookCommandContract,
});

const preToolUseHookContract = z.object({
  matcher: hookMatcherContract.optional(),
  hooks: z.array(hookEntryContract),
});

const sessionStartHookContract = z.object({
  hooks: z.array(hookEntryContract),
});

const hooksConfigContract = z.object({
  PreToolUse: z.array(preToolUseHookContract).optional(),
  SessionStart: z.array(sessionStartHookContract).optional(),
});

export const claudeSettingsContract = z
  .object({
    hooks: hooksConfigContract.optional(),
  })
  .passthrough();

export type ClaudeSettings = z.infer<typeof claudeSettingsContract>;
export type HooksConfig = z.infer<typeof hooksConfigContract>;
export type PreToolUseHook = z.infer<typeof preToolUseHookContract>;
export type SessionStartHook = z.infer<typeof sessionStartHookContract>;
export type HookEntry = z.infer<typeof hookEntryContract>;
export type HookType = z.infer<typeof hookTypeContract>;
export type HookCommand = z.infer<typeof hookCommandContract>;
export type HookMatcher = z.infer<typeof hookMatcherContract>;
