/**
 * PURPOSE: Given a list of event-bus singletons (state file + export name), scans
 * every non-test source file in `packages/` for `<exportName>.emit({ type: '<lit>' …`
 * call sites and returns one record per (file, eventType, busExportName) tuple. The
 * bus state file itself is excluded — its own `emit` definition is not a call site.
 *
 * USAGE:
 * const sites = busEmitterSitesFindLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   buses: [...eventBusList],
 * });
 *
 * WHEN-TO-USE: Project-map composer building inline `bus→ <eventType>` annotations
 * under emitter responder lines.
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  busEmitterSiteContract,
  type BusEmitterSite,
} from '../../../contracts/bus-emitter-site/bus-emitter-site-contract';
import type { EventBus } from '../../../contracts/event-bus/event-bus-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { busEmitCallsExtractTransformer } from '../../../transformers/bus-emit-calls-extract/bus-emit-calls-extract-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';

export const busEmitterSitesFindLayerBroker = ({
  projectRoot,
  buses,
}: {
  projectRoot: AbsoluteFilePath;
  buses: EventBus[];
}): BusEmitterSite[] => {
  if (buses.length === 0) return [];

  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const stateFileSet = new Set<AbsoluteFilePath>(buses.map((b) => b.stateFile));
  const sites: BusEmitterSite[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) continue;
    // The bus state file itself contains `emit:` (definition). Skip so its own
    // body is not mistaken for an emitter call site.
    if (stateFileSet.has(filePath)) continue;
    const source = readFileLayerBroker({ filePath });
    if (source === undefined) continue;

    for (const bus of buses) {
      const eventTypes = busEmitCallsExtractTransformer({
        source,
        busExportName: bus.exportName,
      });
      for (const eventType of eventTypes) {
        sites.push(
          busEmitterSiteContract.parse({
            emitterFile: filePath,
            eventType,
            busExportName: bus.exportName,
          }),
        );
      }
    }
  }

  return sites;
};
