import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

/**
 * Extracts the name of the first argument from a CallExpression if it's an Identifier.
 * Useful for getting the target of function calls like jest.spyOn(target, 'method').
 *
 * @returns The name of the first argument, or null if not found or not an Identifier
 * @example
 * // jest.spyOn(Date, 'now') => 'Date'
 * // jest.spyOn(axios, 'get') => 'axios'
 * // jest.spyOn('literal', 'method') => null
 */
export const astGetCallFirstArgumentNameTransformer = ({
  node,
}: {
  node?: Tsestree;
}): string | null => {
  if (!node?.arguments || node.arguments.length === 0) {
    return null;
  }

  const [firstArg] = node.arguments;
  if (firstArg && firstArg.type === 'Identifier' && firstArg.name) {
    return firstArg.name;
  }

  return null;
};
