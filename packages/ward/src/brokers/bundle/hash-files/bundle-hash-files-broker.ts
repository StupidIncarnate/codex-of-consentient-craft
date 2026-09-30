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
 * bundleHashFilesBroker({ rootPath, relativePaths: ['packages/web/src/app.tsx'] });
 * // Returns a BundleHash over those files' paths and bytes
 */

import { createHash } from '#gateway/node/crypto';
import { readFileBytesSync } from '#gateway/node/fs';

import {
  bundleHashContract,
  type BundleHash,
} from '../../../contracts/bundle-hash/bundle-hash-contract';
import { isNodeErrorWithCodeGuard } from '../../../guards/is-node-error-with-code/is-node-error-with-code-guard';
import { bundleStatics } from '../../../statics/bundle/bundle-statics';

// NUL cannot occur in a path, so `a/b` then `c` and `a` then `/bc` cannot feed the digest one
// identical byte run. The byte LENGTH goes between the path and the contents for the same
// reason, since file bytes themselves can contain a NUL.
const FIELD_SEPARATOR = '\u0000';

export const bundleHashFilesBroker = ({
  rootPath,
  relativePaths,
}: {
  rootPath: string;
  relativePaths: readonly string[];
}): BundleHash => {
  const hash = createHash(bundleStatics.hashAlgorithm);

  for (const relativePath of [...relativePaths].map(String).sort()) {
    try {
      const contents = readFileBytesSync(`${rootPath}/${relativePath}`);

      hash.update(relativePath);
      hash.update(FIELD_SEPARATOR);
      hash.update(String(contents.length));
      hash.update(FIELD_SEPARATOR);
      hash.update(contents);
      hash.update(FIELD_SEPARATOR);
    } catch (error: unknown) {
      // A `src/**` glob matches the directories on the way down, and a path can vanish between the
      // glob and the read. Neither carries content, and neither is a reason to fail the check that
      // asked for the hash. Anything else — a permission error, a filesystem fault — would silently
      // produce a digest for a DIFFERENT set of inputs than the caller asked for, so it is rethrown.
      if (
        !isNodeErrorWithCodeGuard({ error, code: 'EISDIR' }) &&
        !isNodeErrorWithCodeGuard({ error, code: 'ENOENT' })
      ) {
        throw error;
      }
    }
  }

  return bundleHashContract.parse(hash.digest('hex'));
};
