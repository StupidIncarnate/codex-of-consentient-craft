/**
 * PURPOSE: Upserts items into an existing array based on ID matching
 *
 * USAGE:
 * questArrayUpsertTransformer({ existing: [{id: '1', name: 'A'}], updates: [{id: '1', name: 'B'}, {id: '2', name: 'C'}] });
 * // Returns: [{id: '1', name: 'B'}, {id: '2', name: 'C'}]
 *
 * UPSERT SEMANTICS:
 * - Items with existing ID => update (merge fields)
 * - Items with new ID => add to array
 * - Items in existing but not in updates => unchanged (no deletions)
 */

import type {
  Context,
  DependencyStep,
  DesignDecision,
  Flow,
  Observable,
  QuestClarification,
  QuestContractEntry,
  Requirement,
  ToolingRequirement,
} from '@dungeonmaster/shared/contracts';

type QuestArrayItem =
  | Context
  | Observable
  | DependencyStep
  | ToolingRequirement
  | Requirement
  | DesignDecision
  | QuestContractEntry
  | Flow
  | QuestClarification;

export const questArrayUpsertTransformer = <T extends QuestArrayItem>({
  existing,
  updates,
}: {
  existing: T[];
  updates: T[];
}): T[] => {
  const result = [...existing];

  for (const update of updates) {
    const existingIndex = result.findIndex((item) => item.id === update.id);
    if (existingIndex >= 0) {
      result[existingIndex] = { ...result[existingIndex], ...update };
    } else {
      result.push(update);
    }
  }

  return result;
};
