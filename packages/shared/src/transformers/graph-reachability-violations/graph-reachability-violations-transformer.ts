/**
 * PURPOSE: Walks one routed graph — a family graph or a step graph — and names every rule
 * violation it finds, so a config that cannot work is refused with a message pointing at the
 * offending step rather than a bare "the graph is invalid". `terminals` and `exemptFlag` differ by
 * level (family: `['@complete', '@blocked']`, `'appendedAtMerge'`; step: `['@done', '@blocked']`,
 * `'mintableOnRequest'`) so this ONE walk serves both — checking the family graph is rules 1 and 2
 * run again with the family's own terminals and exempt flag, not separate code.
 *
 * USAGE:
 * graphReachabilityViolationsTransformer({
 *   graph: RoutedGraphStub(),
 *   terminals: ['@done', '@blocked'],
 *   exemptFlag: 'mintableOnRequest',
 *   knownPrompts: [],
 *   knownHandlers: [],
 * });
 * // Returns [] when every step is reachable, reaches a terminal, and every route target is real
 */
import { errorMessageContract, routedGraphNodeKeyContract } from '@dungeonmaster/shared/contracts';
import type {
  ErrorMessage,
  RoutedGraph,
  RoutedGraphNodeKey,
} from '@dungeonmaster/shared/contracts';
import { graphOutcomeWordStatics } from '@dungeonmaster/shared/statics';

export const graphReachabilityViolationsTransformer = ({
  graph,
  terminals,
  exemptFlag,
  knownPrompts,
  knownHandlers,
}: {
  graph: RoutedGraph;
  // ['@done', '@blocked'] for a STEP graph; ['@complete', '@blocked'] for the FAMILY graph
  terminals: readonly string[];
  // which declared flag exempts a node from rule 1 AT THIS LEVEL
  exemptFlag: 'mintableOnRequest' | 'appendedAtMerge';
  knownPrompts: readonly string[];
  knownHandlers: readonly string[];
}): ErrorMessage[] => {
  const violations: ErrorMessage[] = [];
  const terminalsText = terminals.map((terminal) => `'${terminal}'`).join(' or ');

  // `Object.entries` erases branding on its own keys, so every step key is re-parsed here, once,
  // rather than compared against the raw string it arrived as everywhere below.
  const nodesMap = new Map(
    Object.entries(graph.nodes).map(
      ([stepKey, node]) => [routedGraphNodeKeyContract.parse(stepKey), node] as const,
    ),
  );

  // Rule 1: every step is reachable from `entry`, or declares the exempt flag for this level.
  const reachableFromEntry = new Set([graph.entry]);
  const reachabilityQueue = [graph.entry];
  while (reachabilityQueue.length > 0) {
    const current = reachabilityQueue.shift();
    if (current === undefined) {
      continue;
    }
    const currentNode = nodesMap.get(current);
    if (currentNode === undefined) {
      continue;
    }
    for (const target of Object.values(currentNode.routes)) {
      if (nodesMap.has(target) && !reachableFromEntry.has(target)) {
        reachableFromEntry.add(target);
        reachabilityQueue.push(target);
      }
    }
  }
  for (const [stepKey, node] of nodesMap) {
    if (!reachableFromEntry.has(stepKey) && node[exemptFlag] !== true) {
      violations.push(
        errorMessageContract.parse(
          `Step '${stepKey}' in the '${graph.graphName}' graph is reached by no route from '${graph.entry}'. Route something to it, or declare mintableOnRequest: true if a running session asks for it. A step nothing reaches is a prompt that is never dispatched, and the quest that needed it stalls with no error.`,
        ),
      );
    }
  }

  // Rule 2: every step reaches a terminal. A fixed-point sweep — small graphs, so a naive re-scan
  // to convergence costs nothing and needs no reverse-edge index.
  const reachesTerminal = new Set<RoutedGraphNodeKey>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const [stepKey, node] of nodesMap) {
      if (reachesTerminal.has(stepKey)) {
        continue;
      }
      const isGrounded = Object.values(node.routes).some(
        (target) => terminals.includes(target) || reachesTerminal.has(target),
      );
      if (isGrounded) {
        reachesTerminal.add(stepKey);
        grew = true;
      }
    }
  }
  for (const stepKey of nodesMap.keys()) {
    if (!reachesTerminal.has(stepKey)) {
      violations.push(
        errorMessageContract.parse(
          `Step '${stepKey}' in the '${graph.graphName}' graph reaches no terminal — every path out of it returns to a step already on the path. Give some step on that cycle a route to ${terminalsText}, or the quest runs forever.`,
        ),
      );
    }
  }

  // Rule 3: every route target names a real step, or a terminal. Rule 5: every declared outcome
  // word is one of the four.
  for (const [stepKey, node] of nodesMap) {
    for (const [outcome, target] of Object.entries(node.routes)) {
      if (!nodesMap.has(target) && !terminals.includes(target)) {
        violations.push(
          errorMessageContract.parse(
            `Route \`${outcome}: '${target}'\` on step '${stepKey}' in the '${graph.graphName}' graph names nothing. A target is a step key in the same graph, or ${terminalsText}. This is the typo case, and in production it is a silent stall rather than an error.`,
          ),
        );
      }
      if (!graphOutcomeWordStatics.words.some((word) => word === outcome)) {
        violations.push(
          errorMessageContract.parse(
            `\`${outcome}\` is not an outcome word. Step '${stepKey}' in the '${graph.graphName}' graph may route \`done\`, \`unmet\`, \`empty\` or \`wall\`, and nothing else. \`pass\`, \`green\`, \`rework\` and \`confirmed\` are the vocabularies this replaced.`,
          ),
        );
      }
    }
  }

  // Rule 4: a step with no `done` route is reached ONLY by `unmet` or by a request — every OTHER
  // inbound route into it has no minter to return to.
  for (const [stepKey, node] of nodesMap) {
    for (const [outcome, target] of Object.entries(node.routes)) {
      if (outcome === 'unmet') {
        continue;
      }
      const targetNode = nodesMap.get(target);
      if (targetNode === undefined) {
        continue;
      }
      if (!('done' in targetNode.routes)) {
        violations.push(
          errorMessageContract.parse(
            `Step '${target}' in the '${graph.graphName}' graph declares no \`done\` route but is reached by \`${outcome}\` from '${stepKey}'. A step with no forward edge returns to whoever minted it, and only an \`unmet\` route or a request has a minter to return to. Declare a \`done\` route, or drop that inbound one.`,
          ),
        );
      }
    }
  }

  // Rule 6: a cyclic path declares `maxVisits` somewhere on it. Iterative DFS whose frames consume
  // their own remaining-edge list — no locally-declared helper function, which
  // `forbid-non-exported-functions` bans, and no `while (true)`, banned outright.
  const color = new Map<RoutedGraphNodeKey, 'white' | 'gray' | 'black'>(
    [...nodesMap.keys()].map((key) => [key, 'white'] as const),
  );
  const frameStack: { node: RoutedGraphNodeKey; remaining: RoutedGraphNodeKey[] }[] = [];
  const reportedCycles: RoutedGraphNodeKey[][] = [];
  for (const startKey of nodesMap.keys()) {
    if (color.get(startKey) !== 'white') {
      continue;
    }
    color.set(startKey, 'gray');
    frameStack.push({
      node: startKey,
      remaining: Object.values(nodesMap.get(startKey)?.routes ?? {}).filter((target) =>
        nodesMap.has(target),
      ),
    });

    while (frameStack.length > 0) {
      const frame = frameStack[frameStack.length - 1];
      if (frame === undefined) {
        break;
      }
      const next = frame.remaining.shift();
      if (next === undefined) {
        color.set(frame.node, 'black');
        frameStack.pop();
        continue;
      }
      const nextColor = color.get(next);
      if (nextColor === 'white') {
        color.set(next, 'gray');
        frameStack.push({
          node: next,
          remaining: Object.values(nodesMap.get(next)?.routes ?? {}).filter((target) =>
            nodesMap.has(target),
          ),
        });
        continue;
      }
      if (nextColor === 'gray') {
        const cyclePath = frameStack.map((entry) => entry.node);
        const cycleStartIndex = cyclePath.findIndex((node) => node === next);
        const cycleNodes = cyclePath.slice(cycleStartIndex);
        const alreadyReported = reportedCycles.some(
          (reported) =>
            reported.length === cycleNodes.length &&
            reported.every((node) => cycleNodes.includes(node)),
        );
        if (!alreadyReported) {
          reportedCycles.push(cycleNodes);
          const hasMaxVisits = cycleNodes.some(
            (node) => nodesMap.get(node)?.maxVisits !== undefined,
          );
          if (!hasMaxVisits) {
            const pathText = [...cycleNodes, next].join(' → ');
            violations.push(
              errorMessageContract.parse(
                `The cycle <${pathText}> in the '${graph.graphName}' graph declares \`maxVisits\` on no step on it. Put one on any step in that cycle; without it nothing stops the quest re-entering it forever.`,
              ),
            );
          }
        }
      }
    }
  }

  // Rule 8: every declared `prompt` names a prompt that exists; every declared `handler` names a
  // handler that exists.
  for (const [stepKey, node] of nodesMap) {
    if (node.prompt !== undefined && !knownPrompts.includes(node.prompt)) {
      violations.push(
        errorMessageContract.parse(
          `Step '${stepKey}' in the '${graph.graphName}' graph names prompt '${node.prompt}', which nothing serves. Add it to agentPromptClassificationStatics.promptNames and to agentNameToPromptTransformer, or fix the name. A dangling prompt is a session dispatched against nothing.`,
        ),
      );
    }
    if (node.handler !== undefined && !knownHandlers.includes(node.handler)) {
      violations.push(
        errorMessageContract.parse(
          `Step '${stepKey}' in the '${graph.graphName}' graph names handler '${node.handler}', which nothing serves. It must be one of ${knownHandlers.join(', ')}, or fix the name. A dangling handler is a session dispatched against nothing.`,
        ),
      );
    }
  }

  return violations;
};
