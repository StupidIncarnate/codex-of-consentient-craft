/**
 * PURPOSE: Produces an updated TsconfigJsonWritable with a new references array and optionally composite: true
 *
 * USAGE:
 * tsconfigUpdateReferencesTransformer({ tsconfigData: {}, references: [{ path: '../shared' }], ensureComposite: true });
 * // Returns TsconfigJsonWritable with references set and compilerOptions.composite: true when ensureComposite is true
 */

import {
  tsconfigJsonWritableContract,
  type TsconfigJsonWritable,
} from '../../contracts/tsconfig-json-writable/tsconfig-json-writable-contract';
import type { TsconfigReference } from '../../contracts/tsconfig-reference/tsconfig-reference-contract';

export const tsconfigUpdateReferencesTransformer = ({
  tsconfigData,
  references,
  ensureComposite,
}: {
  tsconfigData: TsconfigJsonWritable;
  references: readonly TsconfigReference[];
  ensureComposite: boolean;
}): TsconfigJsonWritable => {
  const refs = references.map((r) => ({ path: String(r.path) }));

  if (!ensureComposite) {
    return tsconfigJsonWritableContract.parse({ ...tsconfigData, references: refs });
  }

  const existingOptions = tsconfigData.compilerOptions ?? {};

  const alreadyComposite = existingOptions.composite === true;

  if (alreadyComposite) {
    return tsconfigJsonWritableContract.parse({ ...tsconfigData, references: refs });
  }

  return tsconfigJsonWritableContract.parse({
    ...tsconfigData,
    compilerOptions: { ...existingOptions, composite: true },
    references: refs,
  });
};
