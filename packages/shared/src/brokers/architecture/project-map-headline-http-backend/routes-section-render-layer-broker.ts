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
}: {
  edges: HttpEdge[];
  packageRoot: AbsoluteFilePath;
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

  const sectionParts: ContentText[] = [
    contentTextContract.parse(projectMapHeadlineHttpBackendStatics.routesSectionHeader),
    contentTextContract.parse(''),
    contentTextContract.parse(projectMapHeadlineHttpBackendStatics.routesSectionDescription),
  ];

  for (const flowKey of flowOrder) {
    const flowEdges = grouped.get(flowKey) ?? [];
    if (flowEdges.length === 0) continue;

    const flowFilePath = absoluteFilePathContract.parse(String(flowKey));
    const flowDisplay = filePathToDisplayNameTransformer({
      filePath: flowFilePath,
      packageSrcPath,
    });

    sectionParts.push(contentTextContract.parse(''));
    sectionParts.push(contentTextContract.parse(`### ${String(flowDisplay)}.ts`));
    sectionParts.push(contentTextContract.parse(''));
    sectionParts.push(contentTextContract.parse('```'));

    const entryBlocks: ContentText[] = [];
    for (const edge of flowEdges) {
      const entryLines = routeEntryLinesRenderLayerBroker({ edge, packageRoot });
      entryBlocks.push(contentTextContract.parse(entryLines.map(String).join('\n')));
    }
    sectionParts.push(contentTextContract.parse(entryBlocks.map(String).join('\n\n')));
    sectionParts.push(contentTextContract.parse('```'));
  }

  return contentTextContract.parse(sectionParts.map(String).join('\n'));
};
