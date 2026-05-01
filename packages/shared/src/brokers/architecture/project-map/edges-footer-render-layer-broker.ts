/**
 * PURPOSE: Renders the cross-package EDGES footer section. Summarises each transport with
 * directional package-pair counts so the consumer LLM sees `web → server (HTTP)` and
 * `orchestrator → web (WS)` etc. as the brief specifies.
 *
 * USAGE:
 * const footer = edgesFooterRenderLayerBroker({ projectRoot });
 * // Returns ContentText with ## EDGES section grouped by transport (HTTP, WS, file-bus)
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker to append the cross-package edges summary
 */

import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { architectureWsEdgesBroker } from '../ws-edges/architecture-ws-edges-broker';
import { architectureFileBusEdgesBroker } from '../file-bus-edges/architecture-file-bus-edges-broker';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { packageOfAbsoluteFilePathTransformer } from '../../../transformers/package-of-absolute-file-path/package-of-absolute-file-path-transformer';
import { directionalPairCountTransformer } from '../../../transformers/directional-pair-count/directional-pair-count-transformer';

export const edgesFooterRenderLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const httpEdges = architectureEdgeGraphBroker({ projectRoot });
  const wsEdges = architectureWsEdgesBroker({ projectRoot });
  const fileBusEdges = architectureFileBusEdgesBroker({ projectRoot });

  const httpPaired = httpEdges.filter((e) => e.paired).length;
  const httpOrphan = httpEdges.filter((e) => !e.paired).length;

  // WS edges: one (emitter package → consumer package) entry per consumer subscription.
  const wsPairs: ContentText[] = [];
  for (const edge of wsEdges) {
    if (edge.emitterFile === null) continue;
    const emitterPkg = packageOfAbsoluteFilePathTransformer({ filePath: edge.emitterFile });
    if (emitterPkg === null) continue;
    for (const consumerFile of edge.consumerFiles) {
      const consumerPkg = packageOfAbsoluteFilePathTransformer({ filePath: consumerFile });
      if (consumerPkg === null) continue;
      wsPairs.push(contentTextContract.parse(`${String(emitterPkg)} → ${String(consumerPkg)}`));
    }
  }
  const wsCounts = directionalPairCountTransformer({ pairs: wsPairs });

  // File-bus edges: one (writer package → watcher package) entry per paired path.
  const fileBusPairs: ContentText[] = [];
  for (const edge of fileBusEdges) {
    if (edge.writerFile === null || edge.watcherFile === null) continue;
    const writerPkg = packageOfAbsoluteFilePathTransformer({ filePath: edge.writerFile });
    const watcherPkg = packageOfAbsoluteFilePathTransformer({ filePath: edge.watcherFile });
    if (writerPkg === null || watcherPkg === null) continue;
    fileBusPairs.push(contentTextContract.parse(`${String(writerPkg)} → ${String(watcherPkg)}`));
  }
  const fileBusCounts = directionalPairCountTransformer({ pairs: fileBusPairs });

  const lines: ContentText[] = [];
  lines.push(contentTextContract.parse('HTTP edges:'));
  lines.push(contentTextContract.parse(`  web → server (paired): ${httpPaired}`));
  lines.push(contentTextContract.parse(`  web → server (orphan): ${httpOrphan}`));

  if (wsCounts.length > 0) {
    lines.push(contentTextContract.parse(''));
    lines.push(contentTextContract.parse('WS edges (event-bus → consumer):'));
    for (const entry of wsCounts) {
      const noun = String(entry.count) === '1' ? 'subscription' : 'subscriptions';
      lines.push(
        contentTextContract.parse(`  ${String(entry.pair)}: ${String(entry.count)} ${noun}`),
      );
    }
  }

  if (fileBusCounts.length > 0) {
    lines.push(contentTextContract.parse(''));
    lines.push(contentTextContract.parse('File-bus edges (writer → watcher):'));
    for (const entry of fileBusCounts) {
      const noun = String(entry.count) === '1' ? 'path' : 'paths';
      lines.push(
        contentTextContract.parse(`  ${String(entry.pair)}: ${String(entry.count)} ${noun}`),
      );
    }
  }

  return contentTextContract.parse(
    `${projectMapStatics.edgesFooterHeader}\n\n\`\`\`\n${lines.map(String).join('\n')}\n\`\`\``,
  );
};
