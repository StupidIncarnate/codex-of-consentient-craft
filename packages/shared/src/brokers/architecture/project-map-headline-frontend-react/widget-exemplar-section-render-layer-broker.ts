/**
 * PURPOSE: Renders the ## Detailed exemplar section for a frontend-react package in the
 * project-map connection-graph view. Picks the first root widget with bindings, traces the
 * user interaction: click handler → broker → HTTP wire → state writes → re-render.
 *
 * USAGE:
 * const section = widgetExemplarSectionRenderLayerBroker({
 *   widgetTree: { roots: [...], hubs: [] },
 *   httpEdges: [...],
 *   stateResult: { inMemoryStores: [...], fileWrites: [], browserStorageWrites: [] },
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 * });
 * // Returns ContentText with ## Detailed exemplar header and step-by-step trace
 *
 * WHEN-TO-USE: project-map-headline-frontend-react-broker building the exemplar section
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import type { StateWritesResult } from '../../../contracts/state-writes-result/state-writes-result-contract';
import type { WidgetTreeResult } from '../../../contracts/widget-tree-result/widget-tree-result-contract';
import { bindingNameToBrokerNameTransformer } from '../../../transformers/binding-name-to-broker-name/binding-name-to-broker-name-transformer';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

export const widgetExemplarSectionRenderLayerBroker = ({
  widgetTree,
  httpEdges,
  stateResult,
  packageRoot,
}: {
  widgetTree: WidgetTreeResult;
  httpEdges: HttpEdge[];
  stateResult: StateWritesResult;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const {
    exemplarSectionHeader,
    exemplarSectionEmpty,
    exemplarStepLabels,
    boundaryBoxLabel,
    boundaryBoxPadding,
  } = projectMapHeadlineFrontendReactStatics;

  // Pick first root widget with at least one binding
  const rootWithBinding = widgetTree.roots.find((r) => r.bindingsAttached.length > 0);

  if (rootWithBinding === undefined) {
    return contentTextContract.parse(`${exemplarSectionHeader}\n\n${exemplarSectionEmpty}`);
  }

  const widgetName = String(rootWithBinding.widgetName);
  const [firstBindingText] = rootWithBinding.bindingsAttached;
  if (firstBindingText === undefined) {
    return contentTextContract.parse(`${exemplarSectionHeader}\n\n${exemplarSectionEmpty}`);
  }

  const brokerName = String(bindingNameToBrokerNameTransformer({ bindingName: firstBindingText }));
  const firstBinding = String(firstBindingText);

  // Find first HTTP edge whose webBrokerFile is under the package
  const packageStr = String(packageRoot);
  const exemplarEdge = httpEdges.find(
    (e) => e.webBrokerFile !== null && String(e.webBrokerFile).startsWith(packageStr),
  );

  const lines: ContentText[] = [
    contentTextContract.parse(exemplarSectionHeader),
    contentTextContract.parse(''),
    // Step 1: click handler in widget
    contentTextContract.parse(exemplarStepLabels.click),
    contentTextContract.parse(`  ${widgetName} → handleClick()`),
    contentTextContract.parse(''),
    // Step 2: broker fired from event handler
    contentTextContract.parse(exemplarStepLabels.broker),
    contentTextContract.parse(`  ${brokerName}({ ... })`),
    contentTextContract.parse(''),
    // Step 3: HTTP wire to server
    contentTextContract.parse(exemplarStepLabels.httpWire),
  ];

  if (exemplarEdge === undefined) {
    lines.push(contentTextContract.parse('  (no HTTP edge found for this package)'));
  } else {
    const method = String(exemplarEdge.method).toUpperCase();
    const url = String(exemplarEdge.urlPattern);
    const boxWidth = boundaryBoxLabel.length + boundaryBoxPadding;
    const topLine = `  ╔${'═'.repeat(boxWidth)}╗`;
    const labelLine = `  ║  ${boundaryBoxLabel}`;
    const innerLine = `  ║  ${method} ${url}`;
    const bottomLine = `  ╚${'═'.repeat(boxWidth)}╝`;

    lines.push(contentTextContract.parse(topLine));
    lines.push(contentTextContract.parse(labelLine));
    lines.push(contentTextContract.parse(innerLine));
    lines.push(contentTextContract.parse(bottomLine));
  }

  lines.push(contentTextContract.parse(''));

  // Step 4: state writes
  lines.push(contentTextContract.parse(exemplarStepLabels.stateWrite));
  if (stateResult.inMemoryStores.length > 0) {
    lines.push(
      contentTextContract.parse(
        `  in-memory: ${stateResult.inMemoryStores.map(String).join(', ')}`,
      ),
    );
  } else {
    lines.push(contentTextContract.parse('  (no in-memory state stores detected)'));
  }

  lines.push(contentTextContract.parse(''));

  // Step 5: binding re-renders widget
  lines.push(contentTextContract.parse(exemplarStepLabels.rerender));
  lines.push(
    contentTextContract.parse(`  ${firstBinding} signals update → ${widgetName} re-renders`),
  );

  return contentTextContract.parse(lines.map(String).join('\n'));
};
