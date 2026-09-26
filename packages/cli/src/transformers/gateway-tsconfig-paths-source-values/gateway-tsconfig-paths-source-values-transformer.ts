/**
 * PURPOSE: Builds the `compilerOptions.paths` entries a CHECKING tsconfig needs for the four
 * gateway folders — the root tsconfig.json, or an ordinary package's own tsconfig.json when it
 * already declares its own `paths` (which REPLACES the root's rather than merging). Each entry
 * carries two candidates, matching this repo's own root tsconfig.json: the folder's `index.ts`
 * first, then a bare `src/*` fallback for a deep specifier with no `index.ts` at that level.
 *
 * USAGE:
 * gatewayTsconfigPathsSourceValuesTransformer({
 *   relativeToGatewayFolders: { npm: './packages/@gateway/npm', node: './packages/@gateway/node', browser: './packages/@gateway/browser', bin: './packages/@gateway/bin' },
 * });
 * // Returns {'#gateway/npm/*': ['./packages/@gateway/npm/src/DOMAIN/index.ts', './packages/@gateway/npm/src/DOMAIN'], ...}
 */

import {
  tsconfigPathsMapContract,
  type TsconfigPathsMap,
} from '../../contracts/tsconfig-paths-map/tsconfig-paths-map-contract';
import {
  gatewayFoldersStatics,
  type GatewayFolder,
} from '../../statics/gateway-folders/gateway-folders-statics';

export const gatewayTsconfigPathsSourceValuesTransformer = ({
  relativeToGatewayFolders,
}: {
  relativeToGatewayFolders: Record<GatewayFolder, string>;
}): TsconfigPathsMap =>
  tsconfigPathsMapContract.parse(
    Object.fromEntries(
      gatewayFoldersStatics.folders.map((folder) => {
        const rel = relativeToGatewayFolders[folder];
        const prefixed = rel.startsWith('.') ? rel : `./${rel}`;
        return [`#gateway/${folder}/*`, [`${prefixed}/src/*/index.ts`, `${prefixed}/src/*`]];
      }),
    ),
  );
