/**
 * PURPOSE: Auto-wires cross-slice dependsOn edges by resolving uses[] symbols to producing steps in other slices
 *
 * USAGE:
 * questCrossSliceDagAutowireTransformer({steps});
 * // Returns: DependencyStep[] with consumer.dependsOn extended with resolved cross-slice producer ids.
 *
 * For each consumer step, scans uses[] for names that match another slice's step's outputContracts or
 * exportName. When exactly one cross-slice producer matches, the producer's id is appended to the
 * consumer's dependsOn (no-op if already present). Ambiguous matches (multiple producers) and unmatched
 * names are skipped — pathseeker resolves ambiguity with explicit dependsOn, and unresolved names are
 * caught at the in_progress transition by the unresolved-step-contract-refs completeness validator.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questCrossSliceDagAutowireTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): DependencyStep[] => {
  if (!steps || steps.length === 0) {
    return steps ?? [];
  }

  const producersBySymbol = new Map<unknown, DependencyStep[]>();
  for (const step of steps) {
    const symbols = new Set<unknown>();
    for (const contractName of step.outputContracts) {
      symbols.add(String(contractName));
    }
    if (step.exportName !== undefined) {
      symbols.add(String(step.exportName));
    }
    for (const symbol of symbols) {
      const list = producersBySymbol.get(symbol) ?? [];
      list.push(step);
      producersBySymbol.set(symbol, list);
    }
  }

  return steps.map((consumer) => {
    if (consumer.uses.length === 0) {
      return consumer;
    }

    const existing = new Set<unknown>(consumer.dependsOn.map((id) => String(id)));
    const additions: typeof consumer.dependsOn = [];

    for (const useRef of consumer.uses) {
      const candidates = producersBySymbol.get(String(useRef)) ?? [];
      const crossSliceCandidates = candidates.filter(
        (producer) =>
          String(producer.id) !== String(consumer.id) &&
          String(producer.slice) !== String(consumer.slice),
      );
      if (crossSliceCandidates.length !== 1) {
        continue;
      }
      const [producer] = crossSliceCandidates;
      if (producer === undefined) {
        continue;
      }
      const producerIdStr = String(producer.id);
      if (existing.has(producerIdStr)) {
        continue;
      }
      existing.add(producerIdStr);
      additions.push(producer.id);
    }

    if (additions.length === 0) {
      return consumer;
    }

    return {
      ...consumer,
      dependsOn: [...consumer.dependsOn, ...additions],
    };
  });
};
