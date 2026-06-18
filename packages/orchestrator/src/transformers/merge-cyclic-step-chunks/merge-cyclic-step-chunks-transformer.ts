/**
 * PURPOSE: Merges step-chunks whose dependsOn edges form a cycle into single chunks, so the contracted
 * chunk-dependency graph is a DAG. Per-package + solo chunking can place both ends of a step
 * dependency chain in the same chunk while the middle (no-focusFile) steps land in solo chunks,
 * producing mutually-dependent chunks (chunk A depends on B and B depends on A). Such chunks must run
 * as one work item, so every strongly-connected component of chunks is collapsed into one.
 *
 * The algorithm is role-agnostic, but only codeweaver feeds it: codeweaver is the one role whose
 * same-role work items derive their dependsOn from step-level deps (see stepsToWorkItemsTransformer).
 * Every other multi-item role either chains linearly by construction (flowrider, siegemaster) or fans
 * all items off a shared role-level barrier with no inter-item edges (lawbringer fans off the sieges),
 * so their work-item graphs are acyclic without this merge.
 *
 * USAGE:
 * mergeCyclicStepChunksTransformer({ chunks: stepsToPackageChunksTransformer({ steps }) });
 * // Returns DependencyStep[][] — each cyclic SCC unioned into one chunk; an already-acyclic chunk
 * // set is returned unchanged (each chunk is its own SCC, original order preserved).
 */

import type { DependencyStep, StepId } from '@dungeonmaster/shared/contracts';

export const mergeCyclicStepChunksTransformer = ({
  chunks,
}: {
  chunks: DependencyStep[][];
}): DependencyStep[][] => {
  // Each chunk is represented by its first step's id (the chunker never emits empty chunks, and a
  // step belongs to exactly one chunk so first-step ids are unique). stepId -> owning chunk's repr.
  const stepToChunkRepr = new Map<StepId, StepId>();
  for (const chunk of chunks) {
    const repr = chunk[0]?.id;
    if (repr === undefined) continue;
    for (const step of chunk) {
      stepToChunkRepr.set(step.id, repr);
    }
  }

  // Chunk-level adjacency: repr -> set of reprs it depends on (a step in one chunk dependsOn a step
  // owned by another chunk).
  const adjacency = new Map<StepId, Set<StepId>>();
  for (const chunk of chunks) {
    const repr = chunk[0]?.id;
    if (repr === undefined) continue;
    const edges = adjacency.get(repr) ?? new Set<StepId>();
    for (const step of chunk) {
      for (const depStepId of step.dependsOn) {
        const depRepr = stepToChunkRepr.get(depStepId);
        if (depRepr !== undefined && depRepr !== repr) {
          edges.add(depRepr);
        }
      }
    }
    adjacency.set(repr, edges);
  }

  // Multi-hop reachability per chunk repr (BFS over adjacency). The set excludes the repr itself.
  const reach = new Map<StepId, Set<StepId>>();
  for (const chunk of chunks) {
    const repr = chunk[0]?.id;
    if (repr === undefined) continue;
    const seen = new Set<StepId>();
    const queue = [...(adjacency.get(repr) ?? [])];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined || seen.has(current)) continue;
      seen.add(current);
      for (const next of adjacency.get(current) ?? []) {
        if (!seen.has(next)) queue.push(next);
      }
    }
    reach.set(repr, seen);
  }

  // SCC label per repr: the repr of the earliest chunk it is mutually reachable with. Iterating in
  // order makes the label the first chunk of the component (stable, order-preserving).
  const sccLabel = new Map<StepId, StepId>();
  chunks.forEach((chunk, index) => {
    const repr = chunk[0]?.id;
    if (repr === undefined) return;
    let label = repr;
    for (let other = 0; other < index; other += 1) {
      const otherRepr = chunks[other]?.[0]?.id;
      if (otherRepr === undefined) continue;
      if (reach.get(repr)?.has(otherRepr) === true && reach.get(otherRepr)?.has(repr) === true) {
        label = sccLabel.get(otherRepr) ?? otherRepr;
        break;
      }
    }
    sccLabel.set(repr, label);
  });

  // Group chunks by SCC label, preserving first-appearance order; concatenate members in order.
  const order: StepId[] = [];
  const groups = new Map<StepId, DependencyStep[]>();
  for (const chunk of chunks) {
    const repr = chunk[0]?.id;
    if (repr === undefined) continue;
    const label = sccLabel.get(repr) ?? repr;
    const existing = groups.get(label);
    if (existing === undefined) {
      groups.set(label, [...chunk]);
      order.push(label);
    } else {
      existing.push(...chunk);
    }
  }

  return order.map((label) => groups.get(label) ?? []);
};
