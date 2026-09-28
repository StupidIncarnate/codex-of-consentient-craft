/**
 * PURPOSE: Walks one directory tree recursively and records, into `index`, every exported
 * `interface`/`type` alias name declared by a `.ts` file under it, mapped to every file path that
 * declares it — a shared accumulator across the recursion (and across the four separate calls
 * build-gateway-type-declaration-index-layer-broker makes, one per gateway package), so one name
 * declared in two different files ends up with two entries in its list. A test/proxy/stub/`.d.ts`
 * companion is skipped: it never declares a NEW type of its own, only re-describes one the
 * implementation file already declares.
 *
 * USAGE:
 * collectGatewayTypeDeclarationNamesLayerBroker({
 *   dirPath: filePathContract.parse('/repo/packages/@gateway/node/src/fs/'),
 *   index: new Map(),
 * });
 * // Mutates and returns `index`, e.g. Map { 'WalkedFile' => ['/repo/.../walked-file.ts'] }
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, Identifier } from '@dungeonmaster/shared/contracts';
import { gatewayTestSupportSuffixStatics } from '../../../statics/gateway-test-support-suffix/gateway-test-support-suffix-statics';
import { readFileSync, readdirEntriesSync } from '#gateway/node/fs';
import { gatewayTypeDeclarationNamesTransformer } from '../../../transformers/gateway-type-declaration-names/gateway-type-declaration-names-transformer';

export const collectGatewayTypeDeclarationNamesLayerBroker = ({
  dirPath,
  index,
}: {
  dirPath: FilePath;
  index: Map<Identifier, FilePath[]>;
}): Map<Identifier, FilePath[]> => {
  readdirEntriesSync(dirPath).forEach((entry) => {
    const isDirectory = entry.kind === 'directory';
    const entryPath = filePathContract.parse(`${dirPath}${entry.name}${isDirectory ? '/' : ''}`);

    if (isDirectory) {
      collectGatewayTypeDeclarationNamesLayerBroker({ dirPath: entryPath, index });
      return;
    }

    const isTestSupportFile = gatewayTestSupportSuffixStatics.suffixes.some((suffix) =>
      entry.name.endsWith(suffix),
    );
    const isDeclarationFile =
      entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && !isTestSupportFile;

    if (!isDeclarationFile) {
      return;
    }

    const sourceText = readFileSync(entryPath);

    gatewayTypeDeclarationNamesTransformer({ sourceText }).forEach((name) => {
      const existing = index.get(name) ?? [];
      index.set(name, [...existing, entryPath]);
    });
  });

  return index;
};
