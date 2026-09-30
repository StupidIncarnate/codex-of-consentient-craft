/**
 * PURPOSE: Validates the `.claude/settings.json` an install testbed reads back after `dungeonmaster
 * init`, so a test reads `hooks` and `permissions` off a checked shape rather than an `unknown`.
 * Only the two keys init writes are named; every other key passes through.
 *
 * USAGE:
 * testbedClaudeSettingsContract.parse(JSON.parse(text));
 * // Returns the settings with `hooks` and `permissions.allow` typed
 */

import { z } from '#gateway/npm/zod';

export const testbedClaudeSettingsContract = z
  .object({
    hooks: z.record(z.string(), z.json()).optional(),
    permissions: z
      .object({
        allow: z.array(z.string().brand<'TestbedClaudeSettingsPermissionsAllow'>()).optional(),
      })
      .brand<'TestbedClaudeSettingsPermissions'>()
      .loose()
      .optional(),
  })
  .loose()
  .brand<'TestbedClaudeSettings'>();

export type TestbedClaudeSettings = z.infer<typeof testbedClaudeSettingsContract>;
