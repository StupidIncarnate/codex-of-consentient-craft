/**
 * PURPOSE: The zod call names that open an object contract, stated once so the chain reader and any
 * test that stages a contract agree on which roots make an owner.
 *
 * USAGE:
 * ownerIndexStatics.objectRootNames;
 * // Returns ['object', 'strictObject', 'looseObject']
 */

export const ownerIndexStatics = {
  objectRootNames: ['object', 'strictObject', 'looseObject'],
} as const;
