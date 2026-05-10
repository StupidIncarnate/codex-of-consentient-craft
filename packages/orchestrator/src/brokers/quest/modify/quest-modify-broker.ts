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
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { modifyQuestResultContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestResult } from '@dungeonmaster/shared/contracts';
import { verifyQuestCheckContract } from '@dungeonmaster/shared/contracts';
import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { hasQuestGateContentGuard } from '@dungeonmaster/shared/guards';
import { questHasValidStatusTransitionGuard } from '../../../guards/quest-has-valid-status-transition/quest-has-valid-status-transition-guard';
import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { questArrayUpsertTransformer } from '../../../transformers/quest-array-upsert/quest-array-upsert-transformer';
import { questCompletenessForTransitionTransformer } from '../../../transformers/quest-completeness-for-transition/quest-completeness-for-transition-transformer';
import { questContractSourceResolutionTransformer } from '../../../transformers/quest-contract-source-resolution/quest-contract-source-resolution-transformer';
import { questCrossSliceDagAutowireTransformer } from '../../../transformers/quest-cross-slice-dag-autowire/quest-cross-slice-dag-autowire-transformer';
import { questDuplicateIdMessageTransformer } from '../../../transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer';
import { questHasUniqueSiblingIdsGuard } from '../../../guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard';
import { questInputForbiddenFieldsTransformer } from '../../../transformers/quest-input-forbidden-fields/quest-input-forbidden-fields-transformer';
import { questSaveInvariantsTransformer } from '../../../transformers/quest-save-invariants/quest-save-invariants-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { withQuestModifyLockLayerBroker } from './with-quest-modify-lock-layer-broker';

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
          pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
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
        }

        // Auto-wire cross-slice dependsOn from uses[] resolution. Runs before the contract
        // re-parse so the wired graph is what gets validated downstream.
        quest.steps = questCrossSliceDagAutowireTransformer({
          steps: quest.steps,
        });

        // Re-parse mutated quest through questContract so defaults (e.g., flow nodes'
        // observables: []) are applied to newly-upserted entries before invariants /
        // completeness checks iterate them. Without this, input nodes lacking an
        // `observables` key (the MCP input contract overrides the default with
        // `.optional()`) trip "node.observables is not iterable" in offender-finder
        // transformers such as questDuplicateObservableIdsInNodeTransformer and
        // questTerminalNodesMissingObservablesTransformer.
        Object.assign(quest, questContract.parse(quest));

        // Resolve contract source paths against disk and reject status-vs-disk mismatches.
        // Scoped to the contracts being WRITTEN in this call (validated.contracts) — running
        // it against quest.contracts on every modify-quest call would re-validate paths the
        // caller did not touch, which is both wasteful and surfaces stale state from a prior
        // disk change (e.g., a contract path that became invalid after a refactor).
        if (validated.contracts !== undefined) {
          const writtenContracts = quest.contracts.filter((entry) =>
            (validated.contracts ?? []).some(
              (incoming) => String(incoming.id) === String(entry.id),
            ),
          );
          // PathSeeker writes contract sources as bare-repo-relative (e.g., `packages/web/...`).
          // The strict filePathContract union demands absolute or `./`-prefixed relative; prepend
          // `./` so a bare path matches relativeFilePathContract. fs.access then resolves the
          // `./`-relative path against cwd at the I/O layer.
          const sourceExistenceChecks = await Promise.all(
            writtenContracts.map(async (entry) => {
              const sourceStr = String(entry.source);
              const normalized =
                sourceStr.startsWith('/') ||
                sourceStr.startsWith('./') ||
                sourceStr.startsWith('../')
                  ? sourceStr
                  : `./${sourceStr}`;
              const filePath = filePathContract.parse(normalized);
              const exists = await fsIsAccessibleAdapter({ filePath });
              return { source: sourceStr, exists };
            }),
          );
          const resolvedSources = new Set<unknown>(
            sourceExistenceChecks.filter((c) => c.exists).map((c) => c.source),
          );
          const sourceMismatchOffenders = questContractSourceResolutionTransformer({
            contracts: writtenContracts,
            resolvedSources,
          });
          if (sourceMismatchOffenders.length > 0) {
            const sourceFailedChecks: VerifyQuestCheck[] = sourceMismatchOffenders.map((message) =>
              verifyQuestCheckContract.parse({
                name: 'Contract Source Resolution',
                passed: false,
                details: String(message),
              }),
            );
            return modifyQuestResultContract.parse({
              success: false,
              error: 'Contract source path resolution failed',
              failedChecks: sourceFailedChecks,
            });
          }
        }

        // Tier 3: save-time invariants (POST-mutation; runs on every call). When the
        // input transitions the quest INTO 'in_progress', the invariants set ALSO
        // includes the 'completeness' scope (whole-quest coverage checks: step
        // contract refs resolve, new contracts have creating step, observables
        // satisfied). Those completeness checks fire premature during the
        // slice-by-slice seek_synth commits — they only make sense once the plan
        // is fully assembled, which is the moment of transition to 'in_progress'.
        const invariantFailures = questSaveInvariantsTransformer({
          quest,
          ...(validated.status === undefined ? {} : { nextStatus: validated.status }),
        });
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

        if (validated.pausedAtStatus === null) {
          Reflect.deleteProperty(quest, 'pausedAtStatus');
        } else if (validated.pausedAtStatus !== undefined) {
          quest.pausedAtStatus = validated.pausedAtStatus;
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
