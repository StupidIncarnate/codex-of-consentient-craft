/**
 * PURPOSE: Resolves a binary name to its absolute path in the nearest node_modules/.bin/ walking up
 * from cwd through the workspace root, falling back to the bare name (which defers to PATH). Reach
 * for this rather than a bare name so a consumer's ward runs the consumer's own jest, eslint and
 * tsc whatever its shell PATH holds.
 *
 * USAGE:
 * const command = binResolveBroker({ binName: BinCommandStub({ value: 'eslint' }), cwd: absoluteFilePathContract.parse('/project') });
 * // Returns BinCommand('/project/node_modules/.bin/eslint') if it exists, else the nearest ancestor's up to the workspace root, else BinCommand('eslint')
 */


import { binWalkUpLayerBroker } from './bin-walk-up-layer-broker';

export const binResolveBroker = ({
  binName,
  cwd,
}: {
  binName: string;
  cwd: string;
}): string => binWalkUpLayerBroker({ binName, dir: cwd });
