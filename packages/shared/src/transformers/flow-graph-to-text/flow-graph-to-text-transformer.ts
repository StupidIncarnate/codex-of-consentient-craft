/**
 * PURPOSE: Renders a flow's node graph as depth-first text with back-references, cross-flow markers,
 * per-track sign-off verdicts and observable provenance
 *
 * USAGE:
 * flowGraphToTextTransformer({flow: FlowStub({nodes: [...], edges: [...]})});
 * // Returns: ContentText[] with indented flow graph lines
 *
 * flowGraphToTextTransformer({flow, ownPackage, otherFlows: quest.flows});
 * // The same graph, with `ownPackage`'s nodes marked, every other package's observables collapsed
 * // to a count, and each cross-flow edge's target resolved out of `otherFlows`
 *
 * EVERY NODE LINE CARRIES ITS `{packages}`. A node's package tags are what route its terminal and
 * branch verification units — those carry no observable to read a package from — so a graph without
 * them cannot be reconciled against the ledger that slices work by package.
 *
 * `ownPackage` MARKS, IT NEVER FILTERS. Measured on a real quest: filtering one flow to the three
 * nodes `shared` tags keeps ZERO of the six edges between them and hands that session three orphan
 * nodes with no graph; another package's own accept/reject decision node has both its labelled
 * edges pointing at nodes it does not tag, so filtering deletes the decision out of the node that
 * owns it. Marking costs a suffix per line and keeps the graph a graph.
 *
 * SIGN-OFFS RENDER HERE OR AN AGENT NEVER SEES THEM. `format: 'text'` is the default every
 * get-quest returns, so a verdict that lives only in the JSON is invisible to the roles whose
 * prompts tell them to read their own track. Each of the three render sites — the node line, the
 * observable line, the edge lines — appends `signoffMarkersToTextTransformer`, which is '' when a
 * unit carries no sign-off. A flow with none therefore renders exactly as it does without the
 * feature: no markers, no blank columns.
 *
 * PROVENANCE RENDERS ON THE OBSERVABLE LINE, and only when `addedBy` is not `spec`. A spec
 * observable was in the flow at approval, which is the absence of news; a `+siegemaster` prefix says
 * this expectation was written in mid-quest, which changes what the reader is looking at.
 *
 * `(read-check)` RENDERS ON THE SAME LINE, for the same reason and a sharper one: it says no test
 * settles this unit. A session that misses it writes a test that cannot bite, then either signs off a
 * green that proves something else or reports the unit as impossible.
 *
 * THE OFF-MAP LINE IS LAST AND CONDITIONAL. The seven probe families are not in the graph, so their
 * sign-offs have nowhere else to hang; only the families that actually carry one are printed,
 * because listing seven unsigned families per flow would cost more of the tool-result budget than
 * the whole graph above it.
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { Flow } from '../../contracts/flow/flow-contract';
import type { FlowNodeId } from '../../contracts/flow-node-id/flow-node-id-contract';
import { flowNodeIdContract } from '../../contracts/flow-node-id/flow-node-id-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
import { signoffMarkersToTextTransformer } from '../signoff-markers-to-text/signoff-markers-to-text-transformer';

const SYM = textDisplaySymbolsStatics;
const INITIAL_DEPTH = 0;
const DEPTH_INCREMENT = 1;
const CROSS_FLOW_HANDOFF_NOTE =
  'Your scope ENDS at the hand-off: prove the edge fires and the target flow is entered, not what it does next.';

export const flowGraphToTextTransformer = ({
  flow,
  ownPackage,
  otherFlows,
}: {
  flow: Flow;
  // The package whose nodes are marked and whose observables stay verbatim. Omitted for a whole-
  // quest render and for the flowrider/siegemaster slice, both of which own every package on the
  // flow and would read a mark on every line as noise.
  ownPackage?: PackageName | undefined;
  // The other flows on the quest, so a `flowId:nodeId` edge target can be resolved into a real
  // node. Omitted, the marker renders exactly as it always has — a bare stub.
  otherFlows?: readonly Flow[] | undefined;
}): ContentText[] => {
  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n] as const));
  const outgoingEdges = new Map(
    flow.nodes.map(
      (n) => [n.id, flow.edges.filter((e) => String(e.from) === String(n.id))] as const,
    ),
  );
  const incomingCounts = new Map(
    flow.nodes.map(
      (n) => [n.id, flow.edges.filter((e) => String(e.to) === String(n.id)).length] as const,
    ),
  );
  // Keyed by the exact `flowId:nodeId` string an edge carries, so the lookup is the edge value
  // itself rather than a re-split of it.
  const crossFlowTargets = new Map(
    (otherFlows ?? [])
      .filter((other) => String(other.id) !== String(flow.id))
      .flatMap((other) =>
        // Joined rather than interpolated so the key stays a plain string: a template literal
        // narrows to `${string}:${string}`, which no edge value read off the quest can be looked up
        // with.
        other.nodes.map(
          (node) => [[other.id, node.id].map(String).join(':'), { flow: other, node }] as const,
        ),
      ),
  );
  const ownPackageText = ownPackage === undefined ? undefined : String(ownPackage);

  const visited = new Set<FlowNodeId>();
  const lines: ContentText[] = [];

  const entryNodeIdResult = flowNodeIdContract.safeParse(flow.entryPoint);
  const entryNodeId = entryNodeIdResult.success ? entryNodeIdResult.data : undefined;

  const orderedNodeIds = [
    ...(entryNodeId && nodeMap.has(entryNodeId) ? [entryNodeId] : []),
    ...flow.nodes.map((n) => n.id).filter((nid) => nid !== entryNodeId),
  ];

  for (const startNodeId of orderedNodeIds) {
    if (visited.has(startNodeId)) {
      continue;
    }

    const recursionStack = [{ nodeId: startNodeId, depth: INITIAL_DEPTH }];

    while (recursionStack.length > 0) {
      const current = recursionStack.pop();
      if (!current) {
        break;
      }
      const { nodeId, depth } = current;
      const indent = SYM.indent.repeat(depth);
      const node = nodeMap.get(nodeId);

      if (!node) {
        lines.push(
          contentTextContract.parse(
            `${indent}${SYM.rightArrow} ${String(nodeId)} ${SYM.crossFlow}`,
          ),
        );
        continue;
      }

      if (visited.has(nodeId)) {
        continue;
      }

      visited.add(nodeId);

      const isMerge = (incomingCounts.get(nodeId) ?? 0) > 1;
      const mergeMarker = isMerge ? ` ${SYM.merge}` : '';
      // The tag set carries each package's OBSERVABLE COUNT, so one line says both which packages
      // land on this node and how much each is expected to prove. That count is where a sibling's
      // observables live: a reader seeing `server ● 3` beside one `● #id:` line below knows three
      // acceptance targets on this node belong to someone else, without a collapsed line per
      // package restating a package name the braces already carry.
      //
      // A package with no observable renders BARE rather than as `● 0` — the same convention the
      // sign-off markers use, where an absent marker means nothing recorded. It also leaves the
      // seam-declared-but-asserted-by-nothing case visible as exactly what it is.
      //
      // Packages the node TAGS come first, then any a stray observable is attributed to. That
      // second group should always be empty — `questObservableAttributionViolationsTransformer`
      // refuses that attribution at save time — but a hydrated or hand-edited quest can still carry
      // one, and counting it nowhere would drop an acceptance target from the only surface that
      // shows it.
      const taggedPackages = node.packages.map((name) => String(name));
      const strayPackages = [...new Set(node.observables.map((obs) => String(obs.package)))].filter(
        (name) => !taggedPackages.includes(name),
      );
      const packagesPart = ` {${[...taggedPackages, ...strayPackages]
        .map((name) => {
          const count = node.observables.filter((obs) => String(obs.package) === name).length;
          return count === 0 ? name : `${name} ${SYM.observable} ${String(count)}`;
        })
        .join(', ')}}`;
      const ownMarker =
        ownPackageText !== undefined &&
        node.packages.some((name) => String(name) === ownPackageText)
          ? ` ${SYM.ownedNode}`
          : '';
      const nodeSignoffMarker = signoffMarkersToTextTransformer({
        codeweaverSignoff: node.codeweaverSignoff,
        flowriderSignoff: node.flowriderSignoff,
        siegemasterSignoff: node.siegemasterSignoff,
      });
      // ID, then PACKAGES, then the label — the same order the observable lines under it use. The
      // markers stay at the END, because each is a property of the whole line rather than a field:
      // MERGE is about the graph, YOURS about the caller, the sign-off group about who has graded it.
      lines.push(
        contentTextContract.parse(
          `${indent}[#${nodeId}]${packagesPart} ${node.label} (${node.type})${mergeMarker}${ownMarker}${String(nodeSignoffMarker)}`,
        ),
      );

      const ownObservables =
        ownPackageText === undefined
          ? node.observables
          : node.observables.filter((obs) => String(obs.package) === ownPackageText);

      for (const obs of ownObservables) {
        const originMarker =
          obs.addedBy === 'spec' ? '' : ` ${SYM.observableOriginPrefix}${obs.addedBy}`;
        const readCheckMarker = obs.verifyByReading === true ? ` ${SYM.readCheckMark}` : '';
        const obsSignoffMarker = signoffMarkersToTextTransformer({
          codeweaverSignoff: obs.codeweaverSignoff,
          flowriderSignoff: obs.flowriderSignoff,
          siegemasterSignoff: obs.siegemasterSignoff,
        });
        // ID, then PACKAGE, then text. The package rides in braces because that is already what a
        // package set looks like on the node line above — one convention for one kind of value, so
        // a reader scanning a graph never has to work out which field a bare name is.
        lines.push(
          contentTextContract.parse(
            `${indent}${SYM.indent}${SYM.observable} #${obs.id} {${String(obs.package)}} ${obs.description} [${obs.type}]${readCheckMarker}${originMarker}${String(obsSignoffMarker)}`,
          ),
        );
      }

      const edges = outgoingEdges.get(nodeId) ?? [];
      if (edges.length === 0) {
        lines.push(contentTextContract.parse(`${indent}${SYM.indent}${SYM.terminal}`));
        continue;
      }

      const childrenToVisit: typeof recursionStack = [];

      for (const edge of edges) {
        const toIdParsed = flowNodeIdContract.safeParse(edge.to);
        const edgeToStr = String(edge.to);
        const labelPart = edge.label ? `"${String(edge.label)}" ` : '';
        // The unlabelled cross-flow line keeps its single space after the arrow: a qualified
        // `flowId:nodeId` target is not bracketed, so without it the id runs straight into the arrow.
        const crossFlowLabelPart = edge.label ? `"${String(edge.label)}" ` : ' ';
        const edgeSignoffMarker = String(
          signoffMarkersToTextTransformer({
            codeweaverSignoff: edge.codeweaverSignoff,
            flowriderSignoff: edge.flowriderSignoff,
            siegemasterSignoff: edge.siegemasterSignoff,
          }),
        );

        if (!toIdParsed.success) {
          // A qualified `flowId:nodeId` target fails the node-id regex on the colon, which is what
          // makes this the ONE place an outbound cross-flow edge is rendered. The label rides the
          // line because a labelled cross-flow edge mints a real branch unit, and a session cannot
          // write evidence for a branch whose name it never saw.
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${crossFlowLabelPart}${edgeToStr} ${SYM.crossFlow}${edgeSignoffMarker}`,
            ),
          );
          const target = crossFlowTargets.get(edgeToStr);
          if (target !== undefined) {
            lines.push(
              contentTextContract.parse(
                `${indent}${SYM.indent}${SYM.indent}target: [#${String(target.node.id)}] {${target.node.packages.map((name) => String(name)).join(', ')}} ${String(target.node.label)} (${target.node.type}) in flow #${String(target.flow.id)} "${String(target.flow.name)}"`,
              ),
            );
            lines.push(
              contentTextContract.parse(
                `${indent}${SYM.indent}${SYM.indent}${CROSS_FLOW_HANDOFF_NOTE}`,
              ),
            );
          }
          continue;
        }

        const toId = toIdParsed.data;
        const targetNode = nodeMap.get(toId);
        const isBackRef = visited.has(toId);
        const isCrossFlow = !targetNode && !isBackRef;

        if (isCrossFlow) {
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${crossFlowLabelPart}${edgeToStr} ${SYM.crossFlow}${edgeSignoffMarker}`,
            ),
          );
        } else if (isBackRef) {
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${labelPart} [#${edgeToStr}] ${SYM.backRef}${edgeSignoffMarker}`,
            ),
          );
        } else {
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]${edgeSignoffMarker}`,
            ),
          );
          childrenToVisit.push({ nodeId: toId, depth: depth + DEPTH_INCREMENT });
        }
      }

      for (const child of childrenToVisit.reverse()) {
        recursionStack.push(child);
      }
    }
  }

  const offMapParts = flow.offMapSignoffs
    .map((family) => ({
      id: family.id,
      marker: String(
        signoffMarkersToTextTransformer({
          // `flowOffMapSignoffContract` carries SIEGEMASTER'S COLUMN ALONE. The seven probe families
          // are breakage classes a flow graph structurally cannot draw — a double submit, a killed
          // process, a stale token — so they are measured by hand against a running system, and
          // `off-map` is in siegemaster's `unitKinds` and nobody else's. Neither of the other two
          // sign-offs can exist on a family, so neither has a mark to render.
          codeweaverSignoff: undefined,
          flowriderSignoff: undefined,
          siegemasterSignoff: family.siegemasterSignoff,
        }),
      ),
    }))
    .filter((family) => family.marker.length > 0)
    .map((family) => `${family.id}${family.marker}`);

  if (offMapParts.length > 0) {
    lines.push(contentTextContract.parse(`${SYM.offMapLabel} ${offMapParts.join(' | ')}`));
  }

  return lines;
};
