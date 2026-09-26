/**
 * PURPOSE: Builds the ordered list of real files a resolved specifier TARGET (a path with no
 * extension yet decided) might be — mirroring node10 module resolution's own extension and
 * index-file probing order, so `resolveSpecifierLayerBroker` tries them in the same sequence a real
 * `require()` would.
 *
 * USAGE:
 * candidateFilePathsFromTargetTransformer({target: filePathContract.parse('/repo/packages/node/fs')});
 * // Returns: ['/repo/packages/node/fs.ts', '/repo/packages/node/fs.tsx', '/repo/packages/node/fs/index.ts', '/repo/packages/node/fs/index.tsx']
 */

import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

export const candidateFilePathsFromTargetTransformer = ({
  target,
}: {
  target: FilePath;
}): readonly FilePath[] =>
  [`${target}.ts`, `${target}.tsx`, `${target}/index.ts`, `${target}/index.tsx`].map((candidate) =>
    filePathContract.parse(candidate),
  );
