/**
 * PURPOSE: Names what a zod call chain is built from, so the brand rule can tell an object schema
 * from an enum, a literal or a boolean without reading the chain twice. Returns the method called on
 * `z` (`object`, `string`, `enum`), or `derive` for a chain that goes through `.pick`, `.omit`,
 * `.extend` and the like on another contract, and null when the chain starts anywhere else.
 *
 * USAGE:
 * astZodRootMethodTransformer({ node: callNodeForZStringMinBrand });
 * // Returns 'string'
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

export const astZodRootMethodTransformer = ({ node }: { node: Tsestree }): Identifier | null => {
  let current: Tsestree | null | undefined = node;
  let derived = false;

  while (current?.type === 'CallExpression' && current.callee?.type === 'MemberExpression') {
    const receiver: Tsestree | null | undefined = current.callee.object;
    const { property } = current.callee;
    const method = property?.type === 'Identifier' ? property.name : undefined;

    if (receiver?.type === 'Identifier' && receiver.name === 'z') {
      return derived || method === undefined ? identifierContract.parse('derive') : method;
    }

    if (zodObjectBrandStatics.deriveMethods.some((derive) => derive === method)) {
      derived = true;
    }

    current = receiver;
  }

  return derived ? identifierContract.parse('derive') : null;
};
