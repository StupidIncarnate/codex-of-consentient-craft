/**
 * PURPOSE: Renders the full Routes section for an http-backend package, grouping edges by
 * flow file and producing a fenced code block per group matching the server-map.md shape.
 *
 * USAGE:
 * const section = routesSectionRenderLayerBroker({
 *   edges: packageEdges,
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 * });
 * // Returns ContentText with ## Routes header + per-flow ### headers + code blocks
 *
 * WHEN-TO-USE: project-map-headline-http-backend-broker building the Routes section
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import { projectMapHeadlineHttpBackendStatics } from '../../../statics/project-map-headline-http-backend/project-map-headline-http-backend-statics';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { routeEntryLinesRenderLayerBroker } from './route-entry-lines-render-layer-broker';

export const routesSectionRenderLayerBroker = ({
  edges,
  packageRoot,
  projectRoot,
}: {
  edges: HttpEdge[];
  packageRoot: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);

  // Group edges by serverFlowFile (skip orphan web-only edges)
  const flowOrder: ContentText[] = [];
  const grouped = new Map<ContentText, HttpEdge[]>();

  for (const edge of edges) {
    if (edge.serverFlowFile === null) continue;
    const key = contentTextContract.parse(String(edge.serverFlowFile));
    const alreadyAdded = flowOrder.some((k) => String(k) === String(key));
    if (!alreadyAdded) {
      flowOrder.push(key);
      grouped.set(key, []);
    }
    for (const [k, arr] of grouped) {
      if (String(k) === String(key)) {
        arr.push(edge);
      }
    }
  }

  if (flowOrder.length === 0) {
    return contentTextContract.parse(
      `${projectMapHeadlineHttpBackendStatics.routesSectionHeader}\n\n${projectMapHeadlineHttpBackendStatics.routesSectionEmpty}`,
    );
  }

  const flowBlocks: ContentText[] = [];

  for (const flowKey of flowOrder) {
    const flowEdges = grouped.get(flowKey) ?? [];
    if (flowEdges.length === 0) continue;

    const flowFilePath = absoluteFilePathContract.parse(String(flowKey));
    const flowDisplay = filePathToDisplayNameTransformer({
      filePath: flowFilePath,
      packageSrcPath,
    });

    const routeEntries: ContentText[] = [];
    const routeKeyOrder: ContentText[] = [];
    const routeGroups = new Map<ContentText, HttpEdge[]>();
    for (const edge of flowEdges) {
      const routeKey = contentTextContract.parse(
        `${String(edge.method)} ${String(edge.urlPattern)}`,
      );
      const alreadyAdded = routeKeyOrder.some((k) => String(k) === String(routeKey));
      if (!alreadyAdded) {
        routeKeyOrder.push(routeKey);
        routeGroups.set(routeKey, []);
      }
      for (const [k, arr] of routeGroups) {
        if (String(k) === String(routeKey)) {
          arr.push(edge);
        }
      }
    }

    for (const routeKey of routeKeyOrder) {
      const routeEdges = routeGroups.get(routeKey) ?? [];
      if (routeEdges.length === 0) continue;
      const entryLines = routeEntryLinesRenderLayerBroker({
        edges: routeEdges,
        packageRoot,
        projectRoot,
      });
      routeEntries.push(
        contentTextContract.parse(entryLines.map((l) => `  ${String(l)}`).join('\n')),
      );
    }

    flowBlocks.push(
      contentTextContract.parse(
        `${String(flowDisplay)}.ts\n${routeEntries.map(String).join('\n\n')}`,
      ),
    );
  }

  const codeBody = flowBlocks.map(String).join('\n\n');

  return contentTextContract.parse(
    `${projectMapHeadlineHttpBackendStatics.routesSectionHeader}\n\n\`\`\`\n${codeBody}\n\`\`\``,
  );
};
