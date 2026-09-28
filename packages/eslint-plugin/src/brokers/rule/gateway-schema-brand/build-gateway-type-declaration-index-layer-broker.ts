/**
 * PURPOSE: Builds the whole-gateway type-declaration index gateway-schema-brand's duplicate-name
 * check reads — one call per gateway package folder (`npm`, `node`, `browser`, `bin`) into
 * collect-gateway-type-declaration-names-layer-broker's recursive walk, sharing one accumulator
 * `Map` so a name declared in two different gateway packages still lands under one key. A package
 * with no `src/` yet (a fresh consumer scaffold) is skipped rather than failing the walk.
 *
 * USAGE:
 * buildGatewayTypeDeclarationIndexLayerBroker({ rootDir: filePathContract.parse('/repo/') });
 * // Returns a Map whose 'WalkedFile' key holds every file path across the four gateway packages
 * // that declares an exported `WalkedFile` interface or type alias
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, Identifier } from '@dungeonmaster/shared/contracts';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { existsSync } from '#gateway/node/fs';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { collectGatewayTypeDeclarationNamesLayerBroker } from './collect-gateway-type-declaration-names-layer-broker';

export const buildGatewayTypeDeclarationIndexLayerBroker = ({
  rootDir,
}: {
  rootDir: FilePath;
}): Map<Identifier, FilePath[]> => {
  const index = new Map<Identifier, FilePath[]>();

  Object.values(gatewayLocationsStatics.folders).forEach((folder) => {
    const srcDir = filePathContract.parse(
      `${pathJoinAdapter({ paths: [rootDir, 'packages', '@gateway', folder, 'src'] })}/`,
    );

    if (existsSync(srcDir)) {
      collectGatewayTypeDeclarationNamesLayerBroker({ dirPath: srcDir, index });
    }
  });

  return index;
};
