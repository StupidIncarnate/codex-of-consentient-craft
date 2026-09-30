/**
 * PURPOSE: Scans all monorepo source files to produce paired WS edge records linking
 * orchestrationEventsState.emit({type: '<literal>'}) call sites to server-side
 * if (parsed.data.type === '<literal>') consumer branches, joining on the literal type string.
 *
 * USAGE:
 * const edges = architectureWsEdgesBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns WsEdge[] with paired=true when at least one emitter AND one consumer share the type
 *
 * WHEN-TO-USE: Project-map renderers that need WS edge records to annotate widget bindings
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (regex v1 heuristic)
 */

import { wsEdgeContract, type WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { wsEmitCallsExtractTransformer } from '../../../transformers/ws-emit-calls-extract/ws-emit-calls-extract-transformer';
import { wsConsumeCallsExtractTransformer } from '../../../transformers/ws-consume-calls-extract/ws-consume-calls-extract-transformer';
import { architectureWsGatewayBroker } from '../ws-gateway/architecture-ws-gateway-broker';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const PACKAGES_REL = 'packages';

export const architectureWsEdgesBroker = ({ projectRoot }: { projectRoot: string }): WsEdge[] => {
  const root = projectRoot;
  const packagesDir = `${root}/${PACKAGES_REL}`;
  const allFiles = listTsFilesLayerBroker({ dirPath: packagesDir });

  const emitterEntries: { eventType: string; emitterFile: string }[] = [];
  const consumerEntries: { eventType: string; consumerFile: string }[] = [];

  for (const filePath of allFiles) {
    if (!isNonTestFileGuard({ filePath })) {
      continue;
    }
    // Skip pure-helper folders that may contain the regex/literal patterns being scanned for
    // (e.g. shared/transformers/ws-emit-calls-extract-transformer.ts itself contains the
    // emitter pattern). Per the brief, transformers/guards/contracts/statics never move data
    // at runtime, so any "match" inside them is a false positive.
    const filePathStr = filePath;
    if (
      filePathStr.includes('/transformers/') ||
      filePathStr.includes('/guards/') ||
      filePathStr.includes('/contracts/') ||
      filePathStr.includes('/statics/')
    ) {
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

  const seenTypes = new Set<string>();
  for (const { eventType } of emitterEntries) {
    seenTypes.add(eventType);
  }
  for (const { eventType } of consumerEntries) {
    const alreadySeen = [...seenTypes].some((t) => t === eventType);
    if (!alreadySeen) {
      seenTypes.add(eventType);
    }
  }

  // Discover the WS gateway file once. There may be more than one in a repo with
  // multiple gateways; pick the first deterministically. All edges share the same
  // gateway attribution because every WS frame in this codebase exits the same
  // boundary file (the file that imports the WS-server adapter).
  const gateways = architectureWsGatewayBroker({ projectRoot });
  const wsGatewayFile: string | null = gateways[0] ?? null;

  const edges: WsEdge[] = [];

  for (const eventType of seenTypes) {
    const matchingEmitter = emitterEntries.find((e) => e.eventType === eventType);
    const emitterFile = matchingEmitter?.emitterFile ?? null;

    const consumerFiles: string[] = consumerEntries
      .filter((e) => e.eventType === eventType)
      .map((e) => e.consumerFile);

    const paired = emitterFile !== null && consumerFiles.length > 0;

    edges.push(
      wsEdgeContract.parse({ eventType, emitterFile, consumerFiles, wsGatewayFile, paired }),
    );
  }

  return edges;
};
