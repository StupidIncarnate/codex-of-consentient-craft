/**
 * PURPOSE: Resolves the process-start function names watched by `bin-program-spawn-ban` for a
 * linted file's directory. Combines default gateway exports from childProcessFunctionNamesStatics,
 * any extra wrapper functions passed in rule options, and wrapper functions detected dynamically
 * from the consumer workspace's own `@gateway/node/child_process` barrel on disk.
 *
 * USAGE:
 * const names = resolveGatewayFunctionNamesLayerBroker({ fileDir: '/repo/packages/app', extraWrapperFunctions: ['spawnFireAndForget'] });
 * // Returns ['run', 'runSync', ..., 'spawnFireAndForget']
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { readFileSyncIfExists } from '#gateway/node/fs';
import { childProcessFunctionNamesStatics } from '../../../statics/child-process-function-names/child-process-function-names-statics';
import { gatewayBarrelExportedNamesTransformer } from '../../../transformers/gateway-barrel-exported-names/gateway-barrel-exported-names-transformer';
import { workspaceRootFindBroker } from '../../workspace-root/find/workspace-root-find-broker';

const defaultGatewayFunctionsCache = new Map<string, readonly string[]>();

export const resolveGatewayFunctionNamesLayerBroker = ({
  fileDir,
  extraWrapperFunctions = [],
}: {
  fileDir: string;
  extraWrapperFunctions?: readonly string[] | undefined;
}): readonly string[] => {
  const detected = ((): readonly string[] => {
    const cached = defaultGatewayFunctionsCache.get(fileDir);
    if (cached !== undefined) {
      return cached;
    }

    const workspaceRoot = workspaceRootFindBroker({ startDir: fileDir });
    if (workspaceRoot === undefined) {
      defaultGatewayFunctionsCache.set(fileDir, []);
      return [];
    }

    const barrelPath = `${workspaceRoot.rootDir}/packages/@gateway/${gatewayLocationsStatics.folders.node}/src/child_process/child_process.ts`;
    const contents = readFileSyncIfExists(barrelPath);
    if (contents === null) {
      defaultGatewayFunctionsCache.set(fileDir, []);
      return [];
    }

    const { directNames } = gatewayBarrelExportedNamesTransformer({ sourceText: contents });
    const functionNames = directNames.filter(
      (name) => !name.endsWith('Error') && !name.endsWith('Schema') && !name.endsWith('Contract'),
    );
    defaultGatewayFunctionsCache.set(fileDir, functionNames);
    return functionNames;
  })();

  const allNames = new Set<string>([
    ...childProcessFunctionNamesStatics.gatewayFunctionNames,
    ...extraWrapperFunctions,
    ...detected,
  ]);

  return Array.from(allNames);
};
