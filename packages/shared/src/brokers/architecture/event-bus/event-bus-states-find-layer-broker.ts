/**
 * PURPOSE: Walks every `state/` folder in the monorepo looking for state-singleton
 * files whose exported object literal has both `on` and `emit` members. Detection
 * is by file shape — repo-agnostic, no hardcoded export or package names.
 *
 * USAGE:
 * const buses = eventBusStatesFindLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns EventBus[] with one entry per discovered pub/sub state singleton
 *
 * WHEN-TO-USE: Project-map composer enumerating in-process event buses for the
 * boot-tree's inline bus annotations.
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { eventBusContract, type EventBus } from '../../../contracts/event-bus/event-bus-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { busStateShapeDetectTransformer } from '../../../transformers/bus-state-shape-detect/bus-state-shape-detect-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';
const STATE_PATH_SEGMENT = '/state/';

export const eventBusStatesFindLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): EventBus[] => {
  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const buses: EventBus[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) continue;
    if (!String(filePath).includes(STATE_PATH_SEGMENT)) continue;
    const source = readFileLayerBroker({ filePath });
    if (source === undefined) continue;
    const exportName = busStateShapeDetectTransformer({ source });
    if (exportName === null) continue;
    buses.push(eventBusContract.parse({ stateFile: filePath, exportName }));
  }

  return buses;
};
