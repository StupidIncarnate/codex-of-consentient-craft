/**
 * PURPOSE: Checks if an object expression is built entirely from spreads of stub calls
 *
 * USAGE:
 * const objNode = // AST node for: { ...WalkFactsStub() }
 * if (isAstObjectStubSpreadGuard({ node: objNode })) {
 *   // Object is a clone of stub output, not a hand-built literal
 * }
 * // Returns true only when every property is a SpreadElement over a *Stub() call
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstObjectStubSpreadGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (node === undefined || node.type !== 'ObjectExpression' || !node.properties) {
    return false;
  }

  if (node.properties.length === 0) {
    return false;
  }

  return node.properties.every((property) => {
    const { argument } = property;

    if (property.type !== 'SpreadElement' || argument?.type !== 'CallExpression') {
      return false;
    }

    const { callee } = argument;

    return callee?.type === 'Identifier' && (callee.name ?? '').endsWith('Stub');
  });
};
