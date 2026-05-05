/**
 * PURPOSE: Reads directory entries safely, returning an empty array when the directory
 * does not exist. Lets orphan-detect layer brokers iterate optional folder types without
 * branching on try/catch.
 *
 * USAGE:
 * const entries = safeReaddirLayerBroker({ dirPath });
 * // Returns Dirent[] or [] on any read failure
 *
 * WHEN-TO-USE: Inside the orphan-detect domain whenever a missing directory is a normal
 * outcome (folder type absent for a particular package, etc.).
 */

import { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const safeReaddirLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): ReturnType<typeof fsReaddirWithTypesAdapter> => {
  try {
    return fsReaddirWithTypesAdapter({ dirPath });
  } catch {
    return [];
  }
};
