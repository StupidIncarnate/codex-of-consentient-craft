/**
 * PURPOSE: Parses a package.json object as a plain record, preserving the original top-level key
 * order. The shape-based packageJsonContract hoists declared keys (e.g. scripts) above
 * name/version/license during parse; this record parse keeps insertion order for order-safe writes.
 *
 * USAGE:
 * const ordered = packageJsonRawContract.parse(JSON.parse(content));
 * // Returns a record of package.json keys → unknown values, in their original file order
 */

import { z } from 'zod';

export const packageJsonRawContract = z.record(
  z.string().brand<'PackageJsonRawKey'>(),
  z.unknown(),
);

export type PackageJsonRaw = z.infer<typeof packageJsonRawContract>;
