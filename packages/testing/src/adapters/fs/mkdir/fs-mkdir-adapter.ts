/**
 * PURPOSE: Creates a directory at the specified path
 *
 * USAGE:
 * fsMkdirAdapter({dirPath: '/tmp/test-dir', recursive: true});
 * // Creates the directory and any necessary parent directories
 */

import { mkdirSync } from 'fs';

export const fsMkdirAdapter = ({
  dirPath,
  recursive,
}: {
  dirPath: string;
  recursive?: boolean;
}): void => {
  mkdirSync(dirPath, { recursive });
};
