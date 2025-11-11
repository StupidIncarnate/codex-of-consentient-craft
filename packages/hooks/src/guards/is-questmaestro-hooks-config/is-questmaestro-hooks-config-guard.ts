/**
 * PURPOSE: Validates if an unknown value is a QuestmaestroHooksConfig object
 *
 * USAGE:
 * const config: unknown = require('./config.js');
 * if (isQuestmaestroHooksConfigGuard(config)) {
 *   // config is QuestmaestroHooksConfig
 * }
 * // Returns true if value has preEditLint property
 */
import type { QuestmaestroHooksConfig } from '../../contracts/questmaestro-hooks-config/questmaestro-hooks-config-contract';

export const isQuestmaestroHooksConfigGuard = (value: unknown): value is QuestmaestroHooksConfig =>
  typeof value === 'object' && value !== null && 'preEditLint' in value;
