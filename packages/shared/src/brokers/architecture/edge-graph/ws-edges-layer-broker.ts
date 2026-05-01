/**
 * PURPOSE: Scans all monorepo source files to produce paired WS edge records linking
 * orchestrationEventsState.emit({type: '<literal>'}) call sites to server-side
 * if (parsed.data.type === '<literal>') consumer branches, joining on the literal type string.
 *
 * USAGE:
 * const edges = wsEdgesLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns WsEdge[] with paired=true when at least one emitter AND one consumer share the type
 *
 * WHEN-TO-USE: Building the WS-edges section of the project-map EDGES footer
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (this is a regex v1 heuristic)
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { wsEdgeContract, type WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { wsEmitCallsExtractTransformer } from '../../../transformers/ws-emit-calls-extract/ws-emit-calls-extract-transformer';
import { wsConsumeCallsExtractTransformer } from '../../../transformers/ws-consume-calls-extract/ws-consume-calls-extract-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';

export const wsEdgesLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): WsEdge[] => {
  const root = String(projectRoot);
  const packagesDir = absoluteFilePathContract.parse(`${root}/${PACKAGES_REL}`);
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  // Each entry: { eventType: ContentText, emitterFile: AbsoluteFilePath }
  const emitterEntries: { eventType: ContentText; emitterFile: AbsoluteFilePath }[] = [];
  // Each entry: { eventType: ContentText, consumerFile: AbsoluteFilePath }
  const consumerEntries: { eventType: ContentText; consumerFile: AbsoluteFilePath }[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) {
      continue;
    }
    const source = readFileLayerBroker({ filePath });
    if (source === undefined) {
      continue;
    }

    for (const eventType of wsEmitCallsExtractTransformer({ source })) {
      emitterEntries.push({ eventType, emitterFile: filePath });
    }

    for (const eventType of wsConsumeCallsExtractTransformer({ source })) {
      consumerEntries.push({ eventType, consumerFile: filePath });
    }
  }

  // Collect unique event type strings across both sides
  const seenTypes = new Set<ContentText>();
  for (const { eventType } of emitterEntries) {
    seenTypes.add(eventType);
  }
  for (const { eventType } of consumerEntries) {
    const alreadySeen = [...seenTypes].some((t) => String(t) === String(eventType));
    if (!alreadySeen) {
      seenTypes.add(eventType);
    }
  }

  const edges: WsEdge[] = [];

  for (const eventType of seenTypes) {
    const matchingEmitter = emitterEntries.find((e) => String(e.eventType) === String(eventType));
    const emitterFile = matchingEmitter?.emitterFile ?? null;

    const consumerFiles: AbsoluteFilePath[] = consumerEntries
      .filter((e) => String(e.eventType) === String(eventType))
      .map((e) => e.consumerFile);

    const paired = emitterFile !== null && consumerFiles.length > 0;

    edges.push(
      wsEdgeContract.parse({
        eventType,
        emitterFile,
        consumerFiles,
        paired,
      }),
    );
  }

  return edges;
};
