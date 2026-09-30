/**
 * PURPOSE: Validates the `.claude/settings.json` an install testbed reads back after `dungeonmaster
 * init`, so a test reads `hooks` and `permissions` off a checked shape rather than an `unknown`.
 * Only the two keys init writes are named; every other key passes through.
 *
 * USAGE:
 * claudeSettingsContract.parse(JSON.parse(text));
 * // Returns the settings with `hooks` and `permissions.allow` typed
 */

import { z } from '#gateway/npm/zod';

export const claudeSettingsContract = z
  .object({
    hooks: z.record(z.string().brand<'ClaudeSettingsHooksKey'>(), z.unknown()).optional(),
    permissions: z
      .object({
        allow: z.array(z.string().brand<'ClaudeSettingsPermissionsAllow'>()).optional(),
      }).brand<'ClaudeSettingsPermissions'>()
      .loose()
      .optional(),
  })
  .loose().brand<'ClaudeSettings'>();

export type ClaudeSettings = z.infer<typeof claudeSettingsContract>;
