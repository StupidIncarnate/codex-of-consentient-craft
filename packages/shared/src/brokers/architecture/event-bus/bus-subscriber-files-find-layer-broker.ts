/**
 * PURPOSE: Given a list of event-bus singletons, identifies the higher-layer source
 * files (responders, flows) that subscribe to a bus. A subscriber is detected as a
 * non-test, non-state, non-adapter file that either calls `<exportName>.on(...)` directly
 * or imports an adapter file that does. The intent is to surface the gateway responder
 * (which typically uses an `events-on` adapter) rather than the adapter itself.
 *
 * USAGE:
 * const subs = busSubscriberFilesFindLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   buses: [...eventBusList],
 * });
 *
 * WHEN-TO-USE: Project-map composer building inline `bus← <busExportName>` annotations
 * under subscriber responder lines.
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  busSubscriberFileContract,
  type BusSubscriberFile,
} from '../../../contracts/bus-subscriber-file/bus-subscriber-file-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { EventBus } from '../../../contracts/event-bus/event-bus-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { busOnCallDetectTransformer } from '../../../transformers/bus-on-call-detect/bus-on-call-detect-transformer';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';
const ADAPTERS_PATH_SEGMENT = '/adapters/';

export const busSubscriberFilesFindLayerBroker = ({
  projectRoot,
  buses,
}: {
  projectRoot: AbsoluteFilePath;
  buses: EventBus[];
}): BusSubscriberFile[] => {
  if (buses.length === 0) return [];

  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const stateFileSet = new Set<AbsoluteFilePath>(buses.map((b) => b.stateFile));

  // Pass 1: per bus, find every file that calls `<exportName>.on(`.
  // Track sources so pass 2 can use them without re-reading.
  const filesWithSource: { path: AbsoluteFilePath; source: ContentText }[] = [];
  // Map from bus exportName to the adapter files that subscribe to that bus.
  const subscriberAdaptersByBus = new Map<ContentText, Set<AbsoluteFilePath>>();
  // Map from bus exportName to non-adapter files that call `.on` directly.
  const directNonAdapterByBus = new Map<ContentText, Set<AbsoluteFilePath>>();

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) continue;
    if (stateFileSet.has(filePath)) continue;
    const source = readFileLayerBroker({ filePath });
    if (source === undefined) continue;
    filesWithSource.push({ path: filePath, source });

    const isAdapter = String(filePath).includes(ADAPTERS_PATH_SEGMENT);
    for (const bus of buses) {
      const matches = busOnCallDetectTransformer({ source, busExportName: bus.exportName });
      if (!matches) continue;
      if (isAdapter) {
        const adapters = subscriberAdaptersByBus.get(bus.exportName) ?? new Set<AbsoluteFilePath>();
        adapters.add(filePath);
        subscriberAdaptersByBus.set(bus.exportName, adapters);
      } else {
        const directs = directNonAdapterByBus.get(bus.exportName) ?? new Set<AbsoluteFilePath>();
        directs.add(filePath);
        directNonAdapterByBus.set(bus.exportName, directs);
      }
    }
  }

  // Pass 2: for each bus, walk non-adapter files and check if they import a
  // subscriber adapter for that bus. Combine with the direct-call non-adapters.
  const subscribers: BusSubscriberFile[] = [];

  for (const bus of buses) {
    const subscriberAdapters = subscriberAdaptersByBus.get(bus.exportName) ?? new Set();
    const directNonAdapters = directNonAdapterByBus.get(bus.exportName) ?? new Set();
    const seen = new Set<AbsoluteFilePath>();

    for (const direct of directNonAdapters) {
      seen.add(direct);
    }

    if (subscriberAdapters.size > 0) {
      for (const { path: filePath, source } of filesWithSource) {
        if (String(filePath).includes(ADAPTERS_PATH_SEGMENT)) continue;
        if (seen.has(filePath)) continue;
        const imports = importStatementsExtractTransformer({ source });
        for (const importPath of imports) {
          const resolved = relativeImportResolveTransformer({
            sourceFile: filePath,
            importPath,
          });
          if (resolved !== null && subscriberAdapters.has(resolved)) {
            seen.add(filePath);
            break;
          }
        }
      }
    }

    for (const subscriberFile of seen) {
      subscribers.push(
        busSubscriberFileContract.parse({
          subscriberFile,
          busExportName: bus.exportName,
        }),
      );
    }
  }

  return subscribers;
};
