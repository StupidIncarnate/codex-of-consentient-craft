/**
 * PURPOSE: Tells whether a linted file sits inside one of the four gateway packages — where the
 * globals rule does not apply, since wrapping the platform is the gateway's whole job.
 *
 * USAGE:
 * isInsideGatewayLayerBroker({ filename: '/repo/packages/@gateway/node/src/fs/fs.ts' });
 * // Returns true
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { minimatch } from '#gateway/npm/minimatch';

export const isInsideGatewayLayerBroker = ({ filename }: { filename: string }): boolean =>
  gatewayLocationsStatics.packageGlobs.some((glob) =>
    minimatch(filename, `**/${glob}`, { dot: true }),
  );
