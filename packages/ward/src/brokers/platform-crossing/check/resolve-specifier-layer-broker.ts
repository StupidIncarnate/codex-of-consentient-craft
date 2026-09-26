/**
 * PURPOSE: Resolves one import specifier reached from a file into the `.ts`/`.tsx` file it points
 * at, reading its content in the same call. A relative specifier resolves against the containing
 * file's own directory; a bare specifier resolves against the known workspace packages the caller
 * already discovered. Returns `undefined` for anything outside that reach — a third-party npm
 * package, a `.json` file, a path nothing on disk answers — which is exactly the leaf case the
 * walk should stop at without recursing further.
 *
 * USAGE:
 * await resolveSpecifierLayerBroker({
 *   specifier: ModuleSpecifierStub({value: '@dungeonmaster/node/fs'}),
 *   containingFilePath: filePathContract.parse('/repo/packages/web/src/widgets/chat-widget.tsx'),
 *   knownPackages: [ProjectFolderStub({name: '@dungeonmaster/node', path: '/repo/packages/node'})],
 * });
 * // Returns: { filePath: '/repo/packages/node/fs.ts', content: '...' } or undefined
 */

import {
  filePathContract,
  type FilePath,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

import type { ModuleSpecifier } from '../../../contracts/module-specifier/module-specifier-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { resolveRelativeSpecifierTransformer } from '../../../transformers/resolve-relative-specifier/resolve-relative-specifier-transformer';
import { targetPathFromBareSpecifierTransformer } from '../../../transformers/target-path-from-bare-specifier/target-path-from-bare-specifier-transformer';
import { candidateFilePathsFromTargetTransformer } from '../../../transformers/candidate-file-paths-from-target/candidate-file-paths-from-target-transformer';
import { readFirstExistingCandidateLayerBroker } from './read-first-existing-candidate-layer-broker';

export const resolveSpecifierLayerBroker = async ({
  specifier,
  containingFilePath,
  knownPackages,
}: {
  specifier: ModuleSpecifier;
  containingFilePath: FilePath;
  knownPackages: readonly ProjectFolder[];
}): Promise<{ filePath: FilePath; content: FileContents } | undefined> => {
  const target = specifier.startsWith('.')
    ? resolveRelativeSpecifierTransformer({
        fromDir: filePathContract.parse(containingFilePath.split('/').slice(0, -1).join('/')),
        specifier,
      })
    : targetPathFromBareSpecifierTransformer({ specifier, knownPackages });

  if (target === undefined) {
    return undefined;
  }

  return readFirstExistingCandidateLayerBroker({
    candidates: candidateFilePathsFromTargetTransformer({ target }),
  });
};
