/**
 * PURPOSE: Renders the fenced code block content of the Side-channel cascade section from
 * filtered WS emitter/consumer edges and file-bus writer/watcher edges.
 *
 * USAGE:
 * const block = sideChannelRenderLayerBroker({
 *   wsEmitterEdges,
 *   wsConsumerEdges,
 *   fileBusWriterEdges,
 *   fileBusWatcherEdges,
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageName: contentTextContract.parse('@dungeonmaster/orchestrator'),
 * });
 * // Returns ContentText with the rendered cascade lines, or empty ContentText if nothing to render
 *
 * WHEN-TO-USE: architectureSideChannelBroker building the code-block body
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';
import type { FileBusEdge } from '../../../contracts/file-bus-edge/file-bus-edge-contract';
import { filePathToProjectRelativeTransformer } from '../../../transformers/file-path-to-project-relative/file-path-to-project-relative-transformer';
import { architectureBackRefBroker } from '../back-ref/architecture-back-ref-broker';

const CONTINUATION_PREFIX = '  │    ';
const EVENT_TYPES_LABEL = 'event types: ';
const EVENT_TYPES_INDENT = '             ';
const CONSUMER_ARROW = '  ──►  ';
const SOURCE_ARROW = '  ←─  ';

export const sideChannelRenderLayerBroker = ({
  wsEmitterEdges,
  wsConsumerEdges,
  fileBusWriterEdges,
  fileBusWatcherEdges,
  projectRoot,
  packageName,
}: {
  wsEmitterEdges: WsEdge[];
  wsConsumerEdges: WsEdge[];
  fileBusWriterEdges: FileBusEdge[];
  fileBusWatcherEdges: FileBusEdge[];
  projectRoot: AbsoluteFilePath;
  packageName: ContentText;
}): ContentText => {
  const lines: ContentText[] = [];

  if (wsEmitterEdges.length > 0) {
    lines.push(packageName);

    // Group by emitter file
    const emitterFileKeys: ContentText[] = [];
    const emitterFileMap = new Map<ContentText, WsEdge[]>();
    for (const edge of wsEmitterEdges) {
      if (edge.emitterFile === null) continue;
      const key = contentTextContract.parse(String(edge.emitterFile));
      const existing = emitterFileMap.get(key) ?? [];
      existing.push(edge);
      if (!emitterFileMap.has(key)) {
        emitterFileKeys.push(key);
      }
      emitterFileMap.set(key, existing);
    }

    for (let i = 0; i < emitterFileKeys.length; i++) {
      const key = emitterFileKeys[i];
      if (key === undefined) continue;
      const edges = emitterFileMap.get(key) ?? [];
      const emitterFile = absoluteFilePathContract.parse(String(key));
      const shortEmitter = filePathToProjectRelativeTransformer({
        filePath: emitterFile,
        projectRoot,
      });
      const isLast = i === emitterFileKeys.length - 1;
      const branch = isLast ? '└─' : '├─';

      lines.push(
        contentTextContract.parse(`  ${branch} ${String(shortEmitter)}.emit (in-memory bus)`),
      );

      for (let j = 0; j < edges.length; j++) {
        const e = edges[j];
        if (e === undefined) continue;
        const label = j === 0 ? EVENT_TYPES_LABEL : EVENT_TYPES_INDENT;
        const consumerRefs: ContentText[] = [];
        const seenRefs: AbsoluteFilePath[] = [];
        for (const cf of e.consumerFiles) {
          const alreadySeen = seenRefs.some((s) => String(s) === String(cf));
          if (alreadySeen) continue;
          seenRefs.push(cf);
          const ref = architectureBackRefBroker({ filePath: cf, projectRoot });
          if (ref === null) continue;
          consumerRefs.push(ref);
        }
        const arrowSuffix =
          consumerRefs.length === 0
            ? ''
            : `${CONSUMER_ARROW}${consumerRefs.map(String).join(', ')}`;
        lines.push(
          contentTextContract.parse(
            `${CONTINUATION_PREFIX}${label}${String(e.eventType)}${arrowSuffix}`,
          ),
        );
      }
    }
  }

  if (fileBusWriterEdges.length > 0) {
    for (const edge of fileBusWriterEdges) {
      if (edge.writerFile === null) continue;
      const shortWriter = filePathToProjectRelativeTransformer({
        filePath: edge.writerFile,
        projectRoot,
      });
      const watcherRef =
        edge.watcherFile === null
          ? null
          : architectureBackRefBroker({ filePath: edge.watcherFile, projectRoot });
      const arrowSuffix = watcherRef === null ? '' : `${CONSUMER_ARROW}${String(watcherRef)}`;
      lines.push(
        contentTextContract.parse(
          `  └─ ${String(shortWriter)} appends ${String(edge.filePath)}${arrowSuffix}`,
        ),
      );
    }
  }

  if (wsEmitterEdges.length > 0 || fileBusWriterEdges.length > 0) {
    lines.push(contentTextContract.parse(''));
    lines.push(contentTextContract.parse('           ↓ subscribed at boot ↓'));
    lines.push(contentTextContract.parse(''));
  }

  if (wsConsumerEdges.length > 0) {
    const consumerByFile = new Map<
      ContentText,
      { events: ContentText[]; sources: ContentText[] }
    >();
    const consumerOrder: ContentText[] = [];
    for (const edge of wsConsumerEdges) {
      for (const cf of edge.consumerFiles) {
        const cfKey = contentTextContract.parse(String(cf));
        if (!consumerByFile.has(cfKey)) {
          consumerOrder.push(cfKey);
          consumerByFile.set(cfKey, { events: [], sources: [] });
        }
        const entry = consumerByFile.get(cfKey);
        if (entry === undefined) continue;
        entry.events.push(edge.eventType);
        if (edge.emitterFile !== null) {
          const ref = architectureBackRefBroker({
            filePath: edge.emitterFile,
            projectRoot,
          });
          if (ref !== null) {
            const seen = entry.sources.some((s) => String(s) === String(ref));
            if (!seen) {
              entry.sources.push(ref);
            }
          }
        }
      }
    }
    for (const cfKey of consumerOrder) {
      const cf = absoluteFilePathContract.parse(String(cfKey));
      const shortConsumer = filePathToProjectRelativeTransformer({ filePath: cf, projectRoot });
      const entry = consumerByFile.get(cfKey);
      const sourceSuffix =
        entry === undefined || entry.sources.length === 0
          ? ''
          : `${SOURCE_ARROW}${entry.sources.map(String).join(', ')}`;
      lines.push(
        contentTextContract.parse(
          `${String(shortConsumer)}        (in-memory bus subscriber)${sourceSuffix}`,
        ),
      );
    }
  }

  if (fileBusWatcherEdges.length > 0) {
    for (const edge of fileBusWatcherEdges) {
      if (edge.watcherFile === null) continue;
      const shortWatcher = filePathToProjectRelativeTransformer({
        filePath: edge.watcherFile,
        projectRoot,
      });
      const writerRef =
        edge.writerFile === null
          ? null
          : architectureBackRefBroker({ filePath: edge.writerFile, projectRoot });
      const sourceSuffix = writerRef === null ? '' : `${SOURCE_ARROW}${String(writerRef)}`;
      lines.push(
        contentTextContract.parse(
          `${String(shortWatcher)}     (file tail subscriber)${sourceSuffix}`,
        ),
      );
    }
  }

  return contentTextContract.parse(lines.map(String).join('\n'));
};
