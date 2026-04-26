/**
 * PURPOSE: Provides test setup helpers for the enforce-file-metadata rule broker
 *
 * USAGE:
 * const proxy = ruleEnforceFileMetadataBrokerProxy();
 * // Returns empty object (no dependencies to mock)
 */
export const ruleEnforceFileMetadataBrokerProxy = (): Record<PropertyKey, never> =>
  // No dependencies to mock - rule uses only pure functions
  // (guards, transformers, contracts)
  ({});
