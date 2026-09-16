/**
 * PURPOSE: A row's BUILD-TIME identity, as its ancestor path — `guild[0]/quest[2]`. Reach for
 * this, never a runtime id: the ids do not exist while the chain builds, and `saveRecordAs` is
 * how a runtime id travels instead. Each segment's name must stay inside the character class
 * `ingredientNameContract` allows, since that is exactly what a segment here encodes — a
 * hyphenated ingredient name like `work-item` is legal on both sides.
 *
 * USAGE:
 * rowRefContract.parse('guild[0]/quest[2]');
 * // Returns a branded RowRef
 */
import { z } from 'zod';

const ROW_REF_PATTERN = /^[A-Za-z][A-Za-z0-9-]*\[\d+\](?:\/[A-Za-z][A-Za-z0-9-]*\[\d+\])*$/u;

export const rowRefContract = z
  .string()
  .regex(ROW_REF_PATTERN, "must be an ancestor path like 'guild[0]/quest[2]'")
  .brand<'RowRef'>();

export type RowRef = z.infer<typeof rowRefContract>;
