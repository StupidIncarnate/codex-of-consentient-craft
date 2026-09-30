/**
 * PURPOSE: One key of a `z.object({...})` schema as written: the key name and the source text of its
 * value. Reach for this over OwnerIndexField when the value's own text is the question, such as
 * whether two objects declare the same schema for a key, since a field records only how the value is
 * classified.
 *
 * USAGE:
 * schemaObjectEntryContract.parse({ key: 'id', valueText: "z.string().brand<'ThingId'>()" });
 * // Returns: SchemaObjectEntry validated object
 */

import { z } from '#gateway/npm/zod';

import { identifierContract } from '../identifier/identifier-contract';

export const schemaObjectEntryContract = z.object({
  key: identifierContract,
  valueText: z.string().brand<'SchemaObjectEntryValueText'>(),
});

export type SchemaObjectEntry = z.infer<typeof schemaObjectEntryContract>;
