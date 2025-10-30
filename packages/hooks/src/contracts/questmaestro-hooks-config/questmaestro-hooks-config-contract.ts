/**
 * PURPOSE: Zod schema for questmaestro hooks configuration file structure
 *
 * USAGE:
 * const config = questmaestroHooksConfigContract.parse(configData);
 * // Returns validated QuestmaestroHooksConfig with optional preEditLint
 */
import { z } from 'zod';
import { preEditLintConfigContract } from '../pre-edit-lint-config/pre-edit-lint-config-contract';

export const questmaestroHooksConfigContract = z.object({
  preEditLint: preEditLintConfigContract.optional(),
});

export type QuestmaestroHooksConfig = z.infer<typeof questmaestroHooksConfigContract>;
