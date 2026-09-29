/**
 * PURPOSE: Reads a package.json file at an absolute path and parses it through the shared
 * PackageJson contract. Reach for this over a bare fs.readFileSync + JSON.parse wherever a caller
 * needs `dependencies` / `private` / etc. typed and validated — such as a test asserting this
 * repo's own root-`package.json` scaffolding rules, where the file is real and unmocked.
 *
 * USAGE:
 * const parsed = packageJsonReadBroker({ filePath: '/repo/package.json' });
 * // Returns a validated PackageJson
 */

import {
  absoluteFilePathContract,
  contentTextContract,
  packageJsonContract,
} from '@dungeonmaster/shared/contracts';
import type { PackageJson } from '@dungeonmaster/shared/contracts';
import { readFileSync } from '#gateway/node/fs';

export const packageJsonReadBroker = ({ filePath }: { filePath: string }): PackageJson => {
  const fileContents = contentTextContract.parse(
    readFileSync(absoluteFilePathContract.parse(filePath)),
  );

  return packageJsonContract.parse(JSON.parse(fileContents));
};
