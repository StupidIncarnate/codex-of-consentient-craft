/**
 * PURPOSE: Zod schema for one entry of a settings.json hook array, whichever hook event owns the array
 *
 * USAGE:
 * const entry = settingsHookListEntryContract.parse({ hooks: [{ type: 'command', command: 'x' }] });
 * // Returns a SettingsHookListEntry; `matcher` is present only on PreToolUse and PostToolUse entries
 */
import { z } from '#gateway/npm/zod';
import { claudeSettingsContract } from '../claude-settings/claude-settings-contract';

// Built from the element schema of each hook array in the settings contract, so an entry here is
// exactly an entry there and no second copy of the hook shapes exists.
const hookArrays = claudeSettingsContract.shape.hooks.unwrap().shape;

export const settingsHookListEntryContract = z.union([
  hookArrays.PreToolUse.unwrap().element,
  hookArrays.PostToolUse.unwrap().element,
  hookArrays.SessionStart.unwrap().element,
  hookArrays.SubagentStart.unwrap().element,
  hookArrays.SubagentStop.unwrap().element,
  hookArrays.WorktreeCreate.unwrap().element,
]);

export type SettingsHookListEntry = z.infer<typeof settingsHookListEntryContract>;
