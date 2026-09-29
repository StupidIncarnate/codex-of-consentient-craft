/**
 * PURPOSE: True for a call that makes a new object schema in a contract: `z.object`,
 * `z.strictObject` or `z.looseObject`, or a `.pick`, `.omit`, `.extend`, `.partial` and the like on
 * another contract, since zod v4 drops the brand on each of those and the result is a new object.
 *
 * USAGE:
 * isAstObjectSchemaGuard({ node: callNodeForZObject });
 * // Returns true for `z.object({})` and `userContract.pick({})`, false for `z.string()`
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';
import { isAstMethodCallGuard } from '../is-ast-method-call/is-ast-method-call-guard';

export const isAstObjectSchemaGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (node?.type !== 'CallExpression' || node.callee?.type !== 'MemberExpression') {
    return false;
  }

  const { object: receiver, property } = node.callee;
  const method = property?.type === 'Identifier' ? property.name : undefined;
  const isDeriveOnContract =
    receiver?.type === 'Identifier' &&
    receiver.name?.endsWith('Contract') === true &&
    zodObjectBrandStatics.deriveMethods.some((derive) => derive === method);

  return (
    isDeriveOnContract ||
    zodObjectBrandStatics.objectRoots.some((root) =>
      isAstMethodCallGuard({ node, object: 'z', method: root }),
    )
  );
};
