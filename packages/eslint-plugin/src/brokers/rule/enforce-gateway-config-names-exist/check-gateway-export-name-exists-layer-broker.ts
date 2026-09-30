/**
 * PURPOSE: Answers whether `name` is a real export of a gateway barrel — a direct declaration or
 * re-export in the barrel's own text, or (one level down) a direct declaration in the file a single
 * `export * from './relative-target'` line points at. A passthrough to a BARE specifier (a Node
 * built-in or an npm package, such as `export * from 'fs/promises'`) is not followed further — doing
 * so would need this rule to resolve and require an arbitrary module from its own process, which can
 * fail for reasons that have nothing to do with whether `name` is real (a consumer's dependency layout,
 * a browser-only global). A name left unresolved past that one relative hop is treated as unverifiable
 * rather than reported: false negatives here are safer than banning or restricting a real export for
 * nothing because this rule could not prove it.
 *
 * USAGE:
 * checkGatewayExportNameExistsLayerBroker({
 *   barrelPath: filePathContract.parse('/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts'),
 *   name: 'appendFile',
 * });
 * // Returns true
 */
import { existsSync, readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { gatewayBarrelExportedNamesTransformer } from '../../../transformers/gateway-barrel-exported-names/gateway-barrel-exported-names-transformer';

export const checkGatewayExportNameExistsLayerBroker = ({
  barrelPath,
  name,
}: {
  barrelPath: string;
  name: string;
}): boolean => {
  const sourceText = readFileSync(barrelPath);
  const { directNames, reexportTargets } = gatewayBarrelExportedNamesTransformer({ sourceText });

  if (directNames.some((directName) => directName === name)) {
    return true;
  }

  const barrelDir = dirname(barrelPath);
  const relativeTargets = reexportTargets.filter((target) => target.startsWith('.'));

  for (const target of relativeTargets) {
    const candidatePath = join(barrelDir, `${target}.ts`);
    if (!existsSync(candidatePath)) {
      continue;
    }

    const targetText = readFileSync(candidatePath);
    const targetExports = gatewayBarrelExportedNamesTransformer({ sourceText: targetText });
    if (targetExports.directNames.some((directName) => directName === name)) {
      return true;
    }
  }

  const hasUnresolvedPassthrough = reexportTargets.some((target) => !target.startsWith('.'));
  return hasUnresolvedPassthrough;
};
