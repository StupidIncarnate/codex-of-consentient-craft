/**
 * PURPOSE: Renders the Event bus emissions section for a programmatic-service package.
 * Scans source files under the package root for wsEmitCallsExtractTransformer matches and
 * renders unique event type literals as a list.
 *
 * USAGE:
 * const section = eventsSectionRenderLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns ContentText with ## Event bus emissions header and event list
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service-broker building the Events section
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { wsEmitCallsExtractTransformer } from '../../../transformers/ws-emit-calls-extract/ws-emit-calls-extract-transformer';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';
import { readSourceLayerBroker } from './read-source-layer-broker';
import { listSourceFilesLayerBroker } from './list-source-files-layer-broker';

export const eventsSectionRenderLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const srcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);
  const sourceFiles = listSourceFilesLayerBroker({ dirPath: srcPath });

  const eventTypes: ContentText[] = [];

  for (const filePath of sourceFiles) {
    const source = readSourceLayerBroker({ filePath });
    if (source === undefined) continue;

    for (const eventType of wsEmitCallsExtractTransformer({ source })) {
      const alreadySeen = eventTypes.some((e) => String(e) === String(eventType));
      if (!alreadySeen) {
        eventTypes.push(eventType);
      }
    }
  }

  const header = projectMapHeadlineProgrammaticServiceStatics.eventsSectionHeader;

  if (eventTypes.length === 0) {
    return contentTextContract.parse(
      `${header}\n\n${projectMapHeadlineProgrammaticServiceStatics.eventsSectionEmpty}`,
    );
  }

  const parts: ContentText[] = [
    contentTextContract.parse(header),
    contentTextContract.parse(''),
    contentTextContract.parse('```'),
  ];

  for (const eventType of eventTypes) {
    parts.push(contentTextContract.parse(`'${String(eventType)}'`));
  }

  parts.push(contentTextContract.parse('```'));

  return contentTextContract.parse(parts.map(String).join('\n'));
};
