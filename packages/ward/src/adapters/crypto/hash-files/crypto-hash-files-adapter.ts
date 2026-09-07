/**
 * PURPOSE: Reduces a set of files to one digest that changes whenever any of them does. Reach for
 * this to key a CACHED ARTIFACT on its inputs; it is not a checksum of a single file, and the
 * digest is meaningless without the exact path list that produced it.
 *
 * It reads as well as hashes, because the two cannot be separated without holding a partially-fed
 * hash object across an await — the paths number in the thousands, so a broker collecting every
 * file's contents first would hold the whole tree in memory to say one 64-character thing about it.
 *
 * Paths are hashed alongside their contents, and SORTED first: the digest has to be the same on two
 * machines that globbed the same tree in different orders, and it has to CHANGE when a file is
 * renamed without being edited.
 *
 * USAGE:
 * cryptoHashFilesAdapter({ rootPath, relativePaths: [GitRelativePathStub({ value: 'packages/web/src/app.tsx' })] });
 * // Returns a BundleHash over those files' paths and bytes
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  bundleHashContract,
  type BundleHash,
} from '../../../contracts/bundle-hash/bundle-hash-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { bundleStatics } from '../../../statics/bundle/bundle-statics';

// NUL cannot occur in a path, so `a/b` then `c` and `a` then `/bc` cannot feed the digest one
// identical byte run. The byte LENGTH goes between the path and the contents for the same
// reason, since file bytes themselves can contain a NUL.
const FIELD_SEPARATOR = '\u0000';

export const cryptoHashFilesAdapter = ({
  rootPath,
  relativePaths,
}: {
  rootPath: AbsoluteFilePath;
  relativePaths: readonly GitRelativePath[];
}): BundleHash => {
  const hash = createHash(bundleStatics.hashAlgorithm);

  for (const relativePath of [...relativePaths].map(String).sort()) {
    try {
      const contents = readFileSync(`${String(rootPath)}/${relativePath}`);

      hash.update(relativePath);
      hash.update(FIELD_SEPARATOR);
      hash.update(String(contents.length));
      hash.update(FIELD_SEPARATOR);
      hash.update(contents);
      hash.update(FIELD_SEPARATOR);
    } catch (error: unknown) {
      const code =
        error !== null && typeof error === 'object' && 'code' in error ? String(error.code) : '';

      // A `src/**` glob matches the directories on the way down, and a path can vanish between the
      // glob and the read. Neither carries content, and neither is a reason to fail the check that
      // asked for the hash. Anything else — a permission error, a filesystem fault — would silently
      // produce a digest for a DIFFERENT set of inputs than the caller asked for, so it is rethrown.
      if (code !== 'EISDIR' && code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return bundleHashContract.parse(hash.digest('hex'));
};
