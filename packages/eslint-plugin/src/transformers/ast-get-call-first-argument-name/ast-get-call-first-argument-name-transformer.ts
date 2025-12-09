/**
 * PURPOSE: Extracts the name of the first argument from a CallExpression if it's an Identifier
 *
 * USAGE:
 * const name = astGetCallFirstArgumentNameTransformer({ node: callExpressionNode });
 * // Returns 'Date' for jest.spyOn(Date, 'now'), 'axios' for jest.spyOn(axios, 'get'), or null if not an Identifier
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import type { Identifier } from '@dungeonmaster/shared/contracts';

export const astGetCallFirstArgumentNameTransformer = ({
  node,
}: {
  node?: Tsestree;
}): Identifier | null => {
  if (!node?.arguments || node.arguments.length === 0) {
    return null;
  }

  const [firstArg] = node.arguments;
  if (firstArg && firstArg.type === 'Identifier' && firstArg.name) {
    return firstArg.name;
  }

  return null;
};
