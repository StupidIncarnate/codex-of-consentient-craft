/**
 * PURPOSE: True for a node in a contract where the brand rules neither demand nor grade a brand:
 * the key schema of a `z.record` (keys stay plain, or reuse an owner's id field) and anything inside a
 * `z.function` schema (a function-valued field is parsed for its data only). Reach for this in a brand
 * rule so every brand rule exempts the same places; the two halves are `isAstRecordKeyGuard` and
 * `isAstInsideZodFunctionGuard`.
 *
 * USAGE:
 * isAstBrandExemptGuard({ node: callNodeForZStringInsideRecordKey });
 * // Returns true for the `z.string()` in `z.record(z.string(), z.number())`
 */
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstInsideZodFunctionGuard } from '../is-ast-inside-zod-function/is-ast-inside-zod-function-guard';
import { isAstRecordKeyGuard } from '../is-ast-record-key/is-ast-record-key-guard';

export const isAstBrandExemptGuard = ({ node }: { node?: TSESTree.Node | undefined }): boolean =>
  isAstRecordKeyGuard({ node }) || isAstInsideZodFunctionGuard({ node });
