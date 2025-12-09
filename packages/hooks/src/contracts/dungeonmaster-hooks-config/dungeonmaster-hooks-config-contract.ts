/**
 * PURPOSE: Zod schema for dungeonmaster hooks configuration file structure
 *
 * USAGE:
 * const config = dungeonmasterHooksConfigContract.parse(configData);
 * // Returns validated DungeonmasterHooksConfig with optional preEditLint
 */
import { z } from 'zod';
import { preEditLintConfigContract } from '../pre-edit-lint-config/pre-edit-lint-config-contract';

export const dungeonmasterHooksConfigContract = z.object({
  preEditLint: preEditLintConfigContract.optional(),
});

export type DungeonmasterHooksConfig = z.infer<typeof dungeonmasterHooksConfigContract>;
