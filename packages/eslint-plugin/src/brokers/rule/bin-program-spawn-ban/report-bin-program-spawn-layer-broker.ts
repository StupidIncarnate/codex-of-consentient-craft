/**
 * PURPOSE: Resolves a call's spawned program and, when it names a program with a home in the
 * `bin` gateway package, reports the violation — shared by the parent rule's two call shapes (a
 * gateway options-object call and a raw positional call), since ESLint's own `ctx.report()` call
 * needs identical shape either way. Its own file, not a nested helper inside the rule broker's
 * `create()`, because `forbid-non-exported-functions` requires every function be the primary
 * export of its file. The suggested `gatewayPath` is always the `#gateway/bin/<program>`
 * import-alias text (gatewayLocationsStatics.importPrefix), never a repo's own `@scope` — the
 * suggestion must read identically in every consumer repo.
 *
 * USAGE:
 * reportBinProgramSpawnLayerBroker({ ctx, node, commandNode, argsNode, moduleBody });
 * // Calls ctx.report() when the resolved command names a homed program, otherwise does nothing
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { binProgramHomeStatics } from '../../../statics/bin-program-home/bin-program-home-statics';
import { resolveSpawnedProgramLayerBroker } from './resolve-spawned-program-layer-broker';

export const reportBinProgramSpawnLayerBroker = ({
  ctx,
  node,
  commandNode,
  argsNode,
  moduleBody,
}: {
  ctx: EslintContext;
  node: Tsestree;
  commandNode: Tsestree | undefined;
  argsNode: Tsestree | undefined;
  moduleBody: readonly Tsestree[];
}): AdapterResult => {
  const program = resolveSpawnedProgramLayerBroker({ commandNode, argsNode, moduleBody });
  const home =
    program !== undefined && program in binProgramHomeStatics.programs
      ? binProgramHomeStatics.programs[program as keyof typeof binProgramHomeStatics.programs]
      : undefined;

  if (program !== undefined && home !== undefined) {
    ctx.report({
      node,
      messageId: 'binProgramSpawn',
      data: {
        program,
        binFunction: home.binFunction,
        gatewayPath: `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.bin}/${program}`,
      },
    });
  }

  // ESLint rule listeners return void; AdapterResult is this file's non-void substitute so
  // enforce-folder-return-types is satisfied without inventing a meaning for "success: false" that
  // this side-effect-only function does not have.
  return adapterResultContract.parse({ success: true });
};
