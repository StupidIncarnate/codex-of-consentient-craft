/**
 * PURPOSE: Builds the `compilerOptions.paths` entries a package's tsconfig.build.json needs for the
 * four gateway folders — one candidate each, pointing at the folder's emitted declaration file
 * rather than its source, matching this repo's own gateway packages' tsconfig.build.json files.
 *
 * USAGE:
 * gatewayTsconfigPathsDeclarationValuesTransformer({
 *   relativeToGatewayFolders: { npm: '../@gateway/npm', node: '../@gateway/node', browser: '../@gateway/browser', bin: '../@gateway/bin' },
 * });
 * // Returns {'#gateway/npm/*': ['../@gateway/npm/dist/DOMAIN/index.d.ts'], ...}
 */

import {
  tsconfigPathsMapContract,
  type TsconfigPathsMap,
} from '../../contracts/tsconfig-paths-map/tsconfig-paths-map-contract';
import {
  gatewayFoldersStatics,
  type GatewayFolder,
} from '../../statics/gateway-folders/gateway-folders-statics';

export const gatewayTsconfigPathsDeclarationValuesTransformer = ({
  relativeToGatewayFolders,
}: {
  relativeToGatewayFolders: Record<GatewayFolder, string>;
}): TsconfigPathsMap =>
  tsconfigPathsMapContract.parse(
    Object.fromEntries(
      gatewayFoldersStatics.folders.map((folder) => {
        const rel = relativeToGatewayFolders[folder];
        const prefixed = rel.startsWith('.') ? rel : `./${rel}`;
        return [`#gateway/${folder}/*`, [`${prefixed}/dist/*/index.d.ts`]];
      }),
    ),
  );
