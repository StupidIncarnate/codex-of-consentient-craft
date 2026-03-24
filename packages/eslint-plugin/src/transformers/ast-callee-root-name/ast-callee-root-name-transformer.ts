/**
 * PURPOSE: Extracts the root identifier name from a CallExpression callee, handling Identifier, MemberExpression, and chained call patterns
 *
 * USAGE:
 * const name = astCalleeRootNameTransformer({ node: callExpressionNode });
 * // Returns 'describe' for describe(...), describe.each(...)(...), describe.only(...)
 * // Returns 'it' for it(...), it.each(...)(...), it.skip(...)
 * // Returns null if callee is not a recognized pattern
 *
 * WHEN-TO-USE: When an ESLint rule needs to identify the base test function (describe/it/test) regardless of chaining (.each, .only, .skip)
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import type { Identifier } from '@dungeonmaster/shared/contracts';

export const astCalleeRootNameTransformer = ({ node }: { node?: Tsestree }): Identifier | null => {
  const { callee } = node ?? {};
  if (!callee) return null;

  // Plain: describe(...) / it(...) / test(...)
  if (callee.type === 'Identifier' && callee.name) {
    return callee.name;
  }

  // Chained property: describe.only(...) / it.skip(...) / test.each(table)
  if (
    callee.type === 'MemberExpression' &&
    callee.object?.type === 'Identifier' &&
    callee.object.name
  ) {
    return callee.object.name;
  }

  // Double call: describe.each(table)('name', fn) — callee is CallExpression whose callee is MemberExpression
  if (callee.type === 'CallExpression') {
    const innerCallee = callee.callee;
    if (!innerCallee) return null;

    if (innerCallee.type === 'Identifier' && innerCallee.name) {
      return innerCallee.name;
    }

    if (
      innerCallee.type === 'MemberExpression' &&
      innerCallee.object?.type === 'Identifier' &&
      innerCallee.object.name
    ) {
      return innerCallee.object.name;
    }
  }

  return null;
};
