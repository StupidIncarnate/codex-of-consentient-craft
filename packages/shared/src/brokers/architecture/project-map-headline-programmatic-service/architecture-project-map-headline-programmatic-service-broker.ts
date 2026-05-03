/**
 * PURPOSE: Renders the Public API, Event bus emissions, and State writes sections for a
 * programmatic-service package in the project-map connection-graph view. The Public API
 * section lists every method on the exported namespace object grouped by domain.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineProgrammaticServiceBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns ContentText markdown with ## Public API, ## Event bus emissions,
 * // and ## State writes sections
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as programmatic-service type
 * WHEN-NOT-TO-USE: For non-programmatic-service packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { namespaceObjectKeysExtractTransformer } from '../../../transformers/namespace-object-keys-extract/namespace-object-keys-extract-transformer';
import { namespaceExportNameExtractTransformer } from '../../../transformers/namespace-export-name-extract/namespace-export-name-extract-transformer';
import { findStartupFileLayerBroker } from './find-startup-file-layer-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';
import { apiSectionRenderLayerBroker } from './api-section-render-layer-broker';
import { eventsSectionRenderLayerBroker } from './events-section-render-layer-broker';
import { stateWritesSectionRenderLayerBroker } from './state-writes-section-render-layer-broker';

export const architectureProjectMapHeadlineProgrammaticServiceBroker = ({
  projectRoot: _projectRoot,
  packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const startupFilePath = findStartupFileLayerBroker({ packageRoot });
  const eventsSection = eventsSectionRenderLayerBroker({ packageRoot });
  const stateSection = stateWritesSectionRenderLayerBroker({ packageRoot });

  if (startupFilePath === undefined) {
    const apiSection = apiSectionRenderLayerBroker({
      methodNames: [],
      namespaceName: contentTextContract.parse('unknown'),
    });
    return contentTextContract.parse(
      [
        apiSection,
        contentTextContract.parse('---'),
        eventsSection,
        contentTextContract.parse('---'),
        stateSection,
      ]
        .map(String)
        .join('\n\n'),
    );
  }

  const startupSource = readSourceLayerBroker({ filePath: startupFilePath });

  if (startupSource === undefined) {
    const apiSection = apiSectionRenderLayerBroker({
      methodNames: [],
      namespaceName: contentTextContract.parse('unknown'),
    });
    return contentTextContract.parse(
      [
        apiSection,
        contentTextContract.parse('---'),
        eventsSection,
        contentTextContract.parse('---'),
        stateSection,
      ]
        .map(String)
        .join('\n\n'),
    );
  }

  const methodNames = namespaceObjectKeysExtractTransformer({ source: startupSource });
  const extractedName = namespaceExportNameExtractTransformer({ source: startupSource });
  const namespaceName =
    extractedName === null ? contentTextContract.parse('unknown') : extractedName;

  const apiSection = apiSectionRenderLayerBroker({ methodNames, namespaceName });

  return contentTextContract.parse(
    [
      apiSection,
      contentTextContract.parse('---'),
      eventsSection,
      contentTextContract.parse('---'),
      stateSection,
    ]
      .map(String)
      .join('\n\n'),
  );
};
