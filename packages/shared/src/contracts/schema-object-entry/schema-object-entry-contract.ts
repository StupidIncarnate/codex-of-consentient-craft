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

export const schemaObjectEntryContract = z
  .object({
    key: z.string().brand<'SchemaObjectEntryKey'>(),
    valueText: z.string().brand<'SchemaObjectEntryValueText'>(),
  })
  .brand<'SchemaObjectEntry'>();

export type SchemaObjectEntry = z.infer<typeof schemaObjectEntryContract>;
