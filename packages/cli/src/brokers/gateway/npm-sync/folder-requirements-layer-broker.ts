/**
 * PURPOSE: Decides whether one folder of dungeonmaster's own npm gateway still resolves once copied
 * into a consumer's `packages/@gateway/npm/src/`, by reading every import its TypeScript files make.
 * A raw package import resolves when the consumer declares that package, when it is a Node
 * built-in, or when it is dungeonmaster's own (`init` installs those at the root). A
 * `#gateway/npm/<other>` import, or a relative import that leaves the folder, resolves when
 * `<other>` is a folder the consumer has or is about to get. A relative import into
 * `gateway-test-support` is the one exception: that reserved folder is copied alongside, so it is
 * handed back as an extra folder to copy rather than treated as present. A declared package the
 * consumer's CommonJS npm gateway cannot `require` (`npmModuleEsmOnlyBroker`, probed once per
 * specifier) does not resolve: our wrapper compiled against a CommonJS build of it.
 *
 * USAGE:
 * await folderRequirementsLayerBroker({ repoRoot, ownSrcRoot, folder: 'elkjs', resolvableNames: ['elkjs'], knownFolders: ['elkjs'] });
 * // Returns [] when every import resolves, ['gateway-test-support'] when that must come too, or null when one cannot resolve
 */

import { readFile } from '#gateway/node/fs__promises';
import { builtinModules } from '#gateway/node/module';
import { dirname, relative, resolve } from '#gateway/node/path';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { npmPackageNameFromSpecifierTransformer } from '../../../transformers/npm-package-name-from-specifier/npm-package-name-from-specifier-transformer';
import { sourceImportSpecifiersTransformer } from '../../../transformers/source-import-specifiers/source-import-specifiers-transformer';
import { npmModuleEsmOnlyBroker } from '../../npm-module/esm-only/npm-module-esm-only-broker';
import { sourceFilesListLayerBroker } from './source-files-list-layer-broker';

const GATEWAY_PREFIX = `${gatewayLocationsStatics.importPrefix}/`;
const NPM_GATEWAY_PREFIX = `${GATEWAY_PREFIX}${gatewayLocationsStatics.folders.npm}/`;
const NODE_PREFIX = 'node:';
const RELATIVE_PREFIX = '.';
const PATH_SEPARATOR = '/';

export const folderRequirementsLayerBroker = async ({
  repoRoot,
  ownSrcRoot,
  folder,
  resolvableNames,
  knownFolders,
}: {
  repoRoot: string;
  ownSrcRoot: string;
  folder: string;
  resolvableNames: readonly string[];
  knownFolders: readonly string[];
}): Promise<readonly string[] | null> => {
  const { testSupport } = gatewayNpmSyncStatics.folders;
  const { names: ownNames, prefixes: ownPrefixes } = gatewayNpmSyncStatics.ownPackages;
  const files = await sourceFilesListLayerBroker({
    dirPath: resolve(ownSrcRoot, folder),
  });
  const sourceFiles = files.filter((filePath) =>
    gatewayNpmSyncStatics.sourceExtensions.some((extension) => filePath.endsWith(extension)),
  );

  const importsPerFile = await Promise.all(
    sourceFiles.map(async (filePath) => ({
      filePath,
      specifiers: sourceImportSpecifiersTransformer({ sourceText: await readFile(filePath) }),
    })),
  );

  const extraFolders = new Set<string>();
  const esmOnlyBySpecifier = new Map<string, boolean>();
  const allResolve = importsPerFile.every(({ filePath, specifiers }) =>
    specifiers.every((specifier) => {
      if (specifier.startsWith(RELATIVE_PREFIX)) {
        const [targetFolder] = relative(ownSrcRoot, resolve(dirname(filePath), specifier)).split(
          PATH_SEPARATOR,
        );
        if (targetFolder === folder) {
          return true;
        }
        if (targetFolder === testSupport) {
          extraFolders.add(testSupport);
          return true;
        }
        return knownFolders.some((knownFolder) => knownFolder === targetFolder);
      }

      if (specifier.startsWith(NPM_GATEWAY_PREFIX)) {
        const [otherFolder] = specifier.slice(NPM_GATEWAY_PREFIX.length).split(PATH_SEPARATOR);
        return (
          otherFolder === folder || knownFolders.some((knownFolder) => knownFolder === otherFolder)
        );
      }

      if (specifier.startsWith(GATEWAY_PREFIX)) {
        return true;
      }

      const bareSpecifier = specifier.startsWith(NODE_PREFIX)
        ? specifier.slice(NODE_PREFIX.length)
        : specifier;
      const packageName = npmPackageNameFromSpecifierTransformer({ specifier: bareSpecifier });
      if (
        builtinModules.some((builtin) => builtin === packageName) ||
        ownNames.some((name) => name === packageName) ||
        ownPrefixes.some((prefix) => packageName.startsWith(prefix))
      ) {
        return true;
      }
      if (!resolvableNames.some((name) => name === packageName)) {
        return false;
      }
      const esmOnly =
        esmOnlyBySpecifier.get(bareSpecifier) ??
        npmModuleEsmOnlyBroker({ repoRoot, specifier: bareSpecifier });
      esmOnlyBySpecifier.set(bareSpecifier, esmOnly);
      return !esmOnly;
    }),
  );

  return allResolve ? [...extraFolders] : null;
};
