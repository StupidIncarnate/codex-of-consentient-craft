/**
 * PURPOSE: Upserts data into an existing quest (steps, toolingRequirements, contracts, flows, designDecisions, planningNotes)
 *
 * USAGE:
 * const result = await questModifyBroker({ input: ModifyQuestInputStub({ questId: 'add-auth', flows: [...] }) });
 * // Returns: { success: true } or { success: false, error: 'Quest not found' }
 *
 * UPSERT SEMANTICS:
 * - Items with _delete: true => removed from quest
 * - Items with existing ID in quest => deep merge (scalar overwrite, id-arrays recurse)
 * - Items with new ID => add to array
 * - Items in quest but not in input => unchanged
 *
 * CONCURRENCY:
 * - The read-modify-write critical section is serialized per-questId via withQuestModifyLockLayerBroker.
 *   Parallel callers on the same questId observe serialized execution; different questIds run concurrently.
 *   File writes use atomic temp+rename via questPersistBroker.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { modifyQuestResultContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestResult } from '@dungeonmaster/shared/contracts';
import { verifyQuestCheckContract } from '@dungeonmaster/shared/contracts';
import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { hasQuestGateContentGuard } from '@dungeonmaster/shared/guards';
import { questHasValidStatusTransitionGuard } from '../../../guards/quest-has-valid-status-transition/quest-has-valid-status-transition-guard';
import { questArrayUpsertTransformer } from '../../../transformers/quest-array-upsert/quest-array-upsert-transformer';
import { questCompletenessForTransitionTransformer } from '../../../transformers/quest-completeness-for-transition/quest-completeness-for-transition-transformer';
import { questDuplicateIdMessageTransformer } from '../../../transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer';
import { questHasUniqueSiblingIdsGuard } from '../../../guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard';
import { questInputForbiddenFieldsTransformer } from '../../../transformers/quest-input-forbidden-fields/quest-input-forbidden-fields-transformer';
import { questSaveInvariantsTransformer } from '../../../transformers/quest-save-invariants/quest-save-invariants-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { withQuestModifyLockLayerBroker } from './with-quest-modify-lock-layer-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questModifyBroker = async ({
  input,
}: {
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  try {
    const validated = modifyQuestInputContract.parse(input);

    // Serialize the read-modify-write critical section per questId to prevent lost writes
    // when multiple callers (e.g., parallel minion dispatch) target the same quest file.
    return await withQuestModifyLockLayerBroker({
      questId: validated.questId,
      run: async (): Promise<ModifyQuestResult> => {
        // Validate no duplicate IDs within incoming arrays
        const hasUniqueIds = questHasUniqueSiblingIdsGuard({ updates: validated });
        if (!hasUniqueIds) {
          const duplicateError = questDuplicateIdMessageTransformer({ updates: validated });
          return modifyQuestResultContract.parse({
            success: false,
            error: duplicateError ?? 'Duplicate IDs found in input',
          });
        }

        const { questPath } = await questFindQuestPathBroker({ questId: validated.questId });

        const questFilePath = filePathContract.parse(
          pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
        );

        const loadedQuest = await questLoadBroker({ questFilePath });
        const quest = { ...loadedQuest };

        // Tier 2: per-status input allowlist (runs BEFORE any mutation)
        const forbiddenFieldOffenders = questInputForbiddenFieldsTransformer({
          input: validated,
          currentQuest: loadedQuest,
          currentStatus: loadedQuest.status,
          ...(validated.status === undefined ? {} : { nextStatus: validated.status }),
        });

        if (forbiddenFieldOffenders.length > 0) {
          const forbiddenChecks: VerifyQuestCheck[] = forbiddenFieldOffenders.map((offender) =>
            verifyQuestCheckContract.parse({
              name: 'Input Allowlist',
              passed: false,
              details: String(offender),
            }),
          );
          return modifyQuestResultContract.parse({
            success: false,
            error: `Field(s) not allowed in status ${loadedQuest.status}`,
            failedChecks: forbiddenChecks,
          });
        }

        if (validated.designDecisions) {
          quest.designDecisions = questArrayUpsertTransformer({
            existing: quest.designDecisions,
            updates: validated.designDecisions as typeof quest.designDecisions,
          });
        }

        if (validated.steps) {
          quest.steps = questArrayUpsertTransformer({
            existing: quest.steps,
            updates: validated.steps as typeof quest.steps,
          });
        }

        if (validated.toolingRequirements) {
          quest.toolingRequirements = questArrayUpsertTransformer({
            existing: quest.toolingRequirements,
            updates: validated.toolingRequirements as typeof quest.toolingRequirements,
          });
        }

        if (validated.contracts) {
          quest.contracts = questArrayUpsertTransformer({
            existing: quest.contracts,
            updates: validated.contracts as typeof quest.contracts,
          });
        }

        if (validated.flows) {
          quest.flows = questArrayUpsertTransformer({
            existing: quest.flows,
            updates: validated.flows as typeof quest.flows,
          });
        }

        if (validated.planningNotes) {
          const incoming = validated.planningNotes;
          const current = quest.planningNotes;

          quest.planningNotes = {
            ...current,
            ...(incoming.scopeClassification !== undefined && {
              scopeClassification: incoming.scopeClassification,
            }),
            ...(incoming.synthesis !== undefined && { synthesis: incoming.synthesis }),
            ...(incoming.walkFindings !== undefined && { walkFindings: incoming.walkFindings }),
            ...(incoming.reviewReport !== undefined && { reviewReport: incoming.reviewReport }),
            ...(incoming.surfaceReports !== undefined && {
              surfaceReports: questArrayUpsertTransformer({
                existing: current.surfaceReports,
                updates: incoming.surfaceReports as typeof current.surfaceReports,
              }),
            }),
            ...(incoming.blightReports !== undefined && {
              blightReports: questArrayUpsertTransformer({
                existing: current.blightReports,
                updates: incoming.blightReports as typeof current.blightReports,
              }),
            }),
          };
        }

        if (validated.title) {
          quest.title = validated.title as typeof quest.title;
        }

        if (validated.designPort !== undefined) {
          quest.designPort = validated.designPort as typeof quest.designPort;
        }

        if (validated.workItems) {
          quest.workItems = questArrayUpsertTransformer({
            existing: quest.workItems,
            updates: validated.workItems as typeof quest.workItems,
          });
        }

        if (validated.wardResults) {
          quest.wardResults = questArrayUpsertTransformer({
            existing: quest.wardResults,
            updates: validated.wardResults,
          });
        }

        if (validated.status) {
          const isValidTransition = questHasValidStatusTransitionGuard({
            currentStatus: quest.status,
            nextStatus: validated.status,
          });

          if (!isValidTransition) {
            return modifyQuestResultContract.parse({
              success: false,
              error: `Invalid status transition: ${quest.status} -> ${validated.status}`,
            });
          }

          const hasRequiredContent = hasQuestGateContentGuard({
            quest,
            nextStatus: validated.status,
          });

          if (!hasRequiredContent) {
            return modifyQuestResultContract.parse({
              success: false,
              error: `Missing required content for transition to ${validated.status}`,
            });
          }

          if (validated.status === 'approved') {
            const pendingChaoswhisperer = quest.workItems.filter(
              (workItem) =>
                workItem.role === 'chaoswhisperer' &&
                workItem.status !== 'complete' &&
                workItem.status !== 'skipped',
            );
            if (pendingChaoswhisperer.length > 0) {
              return modifyQuestResultContract.parse({
                success: false,
                error: `Cannot transition to approved: chaoswhisperer work item(s) still in progress. Wait for ChaosWhisperer (and gap-minion) to finish.`,
              });
            }
          }
        }

        // Re-parse mutated quest through questContract so defaults (e.g., flow nodes'
        // observables: []) are applied to newly-upserted entries before invariants /
        // completeness checks iterate them. Without this, input nodes lacking an
        // `observables` key (the MCP input contract overrides the default with
        // `.optional()`) trip "node.observables is not iterable" in offender-finder
        // transformers such as questDuplicateObservableIdsInNodeTransformer and
        // questTerminalNodesMissingObservablesTransformer.
        Object.assign(quest, questContract.parse(quest));

        // Tier 3: save-time invariants (POST-mutation; runs on every call)
        const invariantFailures = questSaveInvariantsTransformer({ quest });
        if (invariantFailures.length > 0) {
          return modifyQuestResultContract.parse({
            success: false,
            error: 'Save invariants failed',
            failedChecks: invariantFailures,
          });
        }

        // Tier 4: completeness checks gating LLM-driven transitions (POST-mutation; only when transitioning)
        // Severity encoding: passed === false is blocking; passed === true is info-level (non-blocking,
        // surfaced in the success response so the caller sees review-minion warnings). See
        // quest-completeness-for-transition-transformer JSDoc for the severity convention.
        const completenessResults = validated.status
          ? questCompletenessForTransitionTransformer({
              quest,
              nextStatus: validated.status,
            })
          : [];
        const blockingFailures = completenessResults.filter((check) => !check.passed);
        if (blockingFailures.length > 0) {
          return modifyQuestResultContract.parse({
            success: false,
            error: `Completeness checks failed for transition to ${String(validated.status)}`,
            failedChecks: blockingFailures,
          });
        }
        const completenessInfoChecks = completenessResults.filter((check) => check.passed);

        if (validated.status) {
          quest.status = validated.status;
        }

        quest.updatedAt = new Date().toISOString() as typeof quest.updatedAt;

        // Write updated quest back to quest.json (atomic temp+rename via questPersistBroker)
        const questJson = fileContentsContract.parse(
          JSON.stringify(quest, null, JSON_INDENT_SPACES),
        );
        await questPersistBroker({
          questFilePath,
          contents: questJson,
          questId: validated.questId,
        });

        return modifyQuestResultContract.parse({
          success: true,
          ...(completenessInfoChecks.length > 0 && { failedChecks: completenessInfoChecks }),
        });
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return modifyQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
