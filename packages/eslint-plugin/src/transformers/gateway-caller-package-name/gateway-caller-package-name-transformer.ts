/**
 * PURPOSE: Extracts the workspace package folder name a linted file's own path sits under — the
 * segment directly after `packages/` (or `packages/@gateway/`) — so enforce-gateway-restricted-to can
 * decide whether the file's own package is in a `restrictedTo` entry's `packages` list from the path
 * ALONE, with no package.json read. Relies on this repo's own "every consumer repo is an
 * npm-workspaces monorepo, with packages under packages/*" constraint, and on a `restrictedTo`
 * entry's `packages` naming a WHOLE workspace package (the config shape's own rule) whose unscoped
 * name matches its folder — the same assumption every other `packages/<name>` path convention in this
 * codebase already makes.
 *
 * USAGE:
 * gatewayCallerPackageNameTransformer({ filename: '/repo/packages/orchestrator/src/brokers/x/x-broker.ts' });
 * // Returns 'orchestrator' as branded Identifier
 * gatewayCallerPackageNameTransformer({ filename: '/repo/packages/@gateway/node/src/fs/fs.ts' });
 * // Returns 'node' as branded Identifier
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

const GATEWAY_SEGMENT = '@gateway';
const PACKAGES_SEGMENT = 'packages';
// segments[packagesIndex] is 'packages', +1 is '@gateway', +2 is the gateway package folder name.
const GATEWAY_FOLDER_OFFSET = 2;

export const gatewayCallerPackageNameTransformer = ({
  filename,
}: {
  filename: string;
}): Identifier | undefined => {
  const segments = filename.split('/');
  const packagesIndex = segments.lastIndexOf(PACKAGES_SEGMENT);

  if (packagesIndex === -1) {
    return undefined;
  }

  const next = segments[packagesIndex + 1];
  if (next === undefined) {
    return undefined;
  }

  const folderName =
    next === GATEWAY_SEGMENT ? segments[packagesIndex + GATEWAY_FOLDER_OFFSET] : next;
  return folderName === undefined ? undefined : identifierContract.parse(folderName);
};
