/**
 * PURPOSE: Renders the State writes section for a programmatic-service package.
 * Calls architectureStateWritesBroker and emits in-memory stores, file writes, and browser
 * storage writes as a labelled list.
 *
 * USAGE:
 * const section = stateWritesSectionRenderLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns ContentText with ## State writes header and three-category list
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service-broker building the State writes section
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { architectureStateWritesBroker } from '../state-writes/architecture-state-writes-broker';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';

export const stateWritesSectionRenderLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const writes = architectureStateWritesBroker({ packageRoot });

  const header = projectMapHeadlineProgrammaticServiceStatics.stateWritesSectionHeader;

  const hasAny =
    writes.inMemoryStores.length > 0 ||
    writes.fileWrites.length > 0 ||
    writes.browserStorageWrites.length > 0;

  if (!hasAny) {
    return contentTextContract.parse(
      `${header}\n\n${projectMapHeadlineProgrammaticServiceStatics.stateWritesSectionEmpty}`,
    );
  }

  const parts: ContentText[] = [contentTextContract.parse(header)];

  if (writes.inMemoryStores.length > 0) {
    const label = projectMapHeadlineProgrammaticServiceStatics.inMemoryLabel;
    const stores = writes.inMemoryStores.map(String).join(', ');
    parts.push(contentTextContract.parse(`  ${label} ${stores}`));
  }

  if (writes.fileWrites.length > 0) {
    const label = projectMapHeadlineProgrammaticServiceStatics.filesLabel;
    const files = writes.fileWrites.map(String).join(', ');
    parts.push(contentTextContract.parse(`  ${label} ${files}`));
  }

  if (writes.browserStorageWrites.length > 0) {
    const label = projectMapHeadlineProgrammaticServiceStatics.browserLabel;
    const stores = writes.browserStorageWrites.map(String).join(', ');
    parts.push(contentTextContract.parse(`  ${label} ${stores}`));
  }

  return contentTextContract.parse(parts.map(String).join('\n'));
};
