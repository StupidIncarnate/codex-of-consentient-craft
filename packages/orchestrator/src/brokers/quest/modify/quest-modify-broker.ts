/**
 * PURPOSE: Upserts data into an existing quest (operations, toolingRequirements, contracts, flows, designDecisions, planningNotes)
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
 * - The read-modify-write critical section is serialized per-questId via questWithModifyLockBroker —
 *   the SAME mutex every other whole-file quest writer takes (questOperationsUpdateBroker,
 *   questResetFlowSignoffsBroker, the smoketest writers). Parallel callers on the same questId
 *   observe serialized execution; different questIds run concurrently. File writes use atomic
 *   temp+rename via questPersistBroker, whose temp path is derived from the quest file path — so two
 *   unserialized writers would also collide on that one `quest.json.tmp`.
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
import {
  hasQuestGateContentGuard,
  isQuestBlockedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { questHasValidStatusTransitionGuard } from '../../../guards/quest-has-valid-status-transition/quest-has-valid-status-transition-guard';
import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { questArrayUpsertTransformer } from '../../../transformers/quest-array-upsert/quest-array-upsert-transformer';
import { questContractSourceResolutionTransformer } from '../../../transformers/quest-contract-source-resolution/quest-contract-source-resolution-transformer';
import { questDuplicateIdMessageTransformer } from '../../../transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer';
import { questHasUniqueSiblingIdsGuard } from '../../../guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard';
import { questInputForbiddenFieldsTransformer } from '../../../transformers/quest-input-forbidden-fields/quest-input-forbidden-fields-transformer';
import { questPackageEntryViolationsTransformer } from '../../../transformers/quest-package-entry-violations/quest-package-entry-violations-transformer';
import { questResolvedCommentsTransformer } from '../../../transformers/quest-resolved-comments/quest-resolved-comments-transformer';
import { questSaveInvariantsTransformer } from '../../../transformers/quest-save-invariants/quest-save-invariants-transformer';
import { workItemsToQuestStatusTransformer } from '../../../transformers/work-items-to-quest-status/work-items-to-quest-status-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questRepoRootBroker } from '../repo-root/quest-repo-root-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';
import { resolvePackageEntryFactsLayerBroker } from './resolve-package-entry-facts-layer-broker';

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
    return await questWithModifyLockBroker({
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

        if (validated.operations) {
          // Locked operation items (the plan item + the orchestrator-seeded verify tail) cannot
          // be deleted through the agent path — only Chaos's own unlocked implementation items
          // are hers to remove.
          const lockedIds = new Set(
            quest.operations
              .filter((operation) => operation.locked)
              .map((operation) => String(operation.id)),
          );
          const lockedDeleteOffenders = validated.operations.filter(
            (operation) =>
              '_delete' in operation &&
              operation._delete === true &&
              lockedIds.has(String(operation.id)),
          );
          if (lockedDeleteOffenders.length > 0) {
            const lockedChecks: VerifyQuestCheck[] = lockedDeleteOffenders.map((offender) =>
              verifyQuestCheckContract.parse({
                name: 'Locked Operation Item',
                passed: false,
                details: `Operation item '${String(offender.id)}' is locked and cannot be deleted`,
              }),
            );
            return modifyQuestResultContract.parse({
              success: false,
              error: 'Locked operation items cannot be deleted',
              failedChecks: lockedChecks,
            });
          }

          quest.operations = questArrayUpsertTransformer({
            existing: quest.operations,
            updates: validated.operations as typeof quest.operations,
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

        if (validated.packagesAffected !== undefined) {
          // The entries carry no `id`, so there is no merge key to upsert on — the whole list is
          // replaced. That is also the semantics the field wants: it is a TAG LIST, the closed set
          // every node tag and operation item draws its names from, and a caller dropping a package
          // from the quest must be able to say so by omitting it.
          quest.packagesAffected = validated.packagesAffected;
        }

        if (validated.flows) {
          quest.flows = questArrayUpsertTransformer({
            existing: quest.flows,
            updates: validated.flows as typeof quest.flows,
          });
        }

        // This is the comment-batch route's own server-side persist path — the MCP layer strips
        // `comments` from an agent's modify-quest payload before it ever reaches here, so this
        // branch serves the user's write (queued flow-diagram comments), never an agent's.
        if (validated.comments) {
          quest.comments = questArrayUpsertTransformer({
            existing: quest.comments,
            updates: validated.comments as typeof quest.comments,
          });
        }

        if (validated.planningNotes) {
          const incoming = validated.planningNotes;
          const current = quest.planningNotes;
          const incomingLedger = incoming.qaLedger;
          const incomingBlightLedger = incoming.blightLedger;
          const incomingQuestNotes = incoming.questNotes;

          quest.planningNotes = {
            ...current,
            ...(incoming.blightReports !== undefined && {
              blightReports: questArrayUpsertTransformer({
                existing: current.blightReports,
                updates: incoming.blightReports as typeof current.blightReports,
              }),
            }),
            // Keyed on itemId, not the `id: UUID` questArrayUpsertTransformer expects, so the
            // upsert is spelled out here: a unit's newest disposition REPLACES its prior one, which
            // is what lets a pt-N session correct what a predecessor recorded rather than stacking
            // a second entry the checklist would then count twice. The incoming batch is collapsed
            // by itemId first (last one wins) so one payload carrying two dispositions for the same
            // unit cannot smuggle a duplicate past the same rule.
            ...(incomingLedger !== undefined && {
              qaLedger: [
                ...current.qaLedger.filter(
                  (entry) => !incomingLedger.some((update) => update.itemId === entry.itemId),
                ),
                ...[...new Map(incomingLedger.map((entry) => [entry.itemId, entry])).values()],
              ] as typeof current.qaLedger,
            }),
            // Mirrors the qaLedger branch above, itemId-keyed rather than the generic UUID
            // questArrayUpsertTransformer upsert blightReports uses: a unit's newest disposition
            // REPLACES its prior one, so a continuation session can correct what a predecessor
            // recorded instead of stacking a second entry the checklist would then count twice.
            // The incoming batch is collapsed by itemId first (last one wins) so one payload
            // carrying two dispositions for the same unit cannot smuggle a duplicate past the same
            // rule. An empty `blightLedger: []` payload takes this branch (incoming !== undefined)
            // but the filter+collapse over an empty array is a no-op, so existing entries survive.
            ...(incomingBlightLedger !== undefined && {
              blightLedger: [
                ...current.blightLedger.filter(
                  (entry) => !incomingBlightLedger.some((update) => update.itemId === entry.itemId),
                ),
                ...[
                  ...new Map(incomingBlightLedger.map((entry) => [entry.itemId, entry])).values(),
                ],
              ] as typeof current.blightLedger,
            }),
            // Mirrors the two ledger branches above, keyed on the note's `id`: re-stating a note
            // REPLACES its prior entry rather than appending a second, so a later pass that sharpens
            // an earlier note leaves one entry, not two. The incoming batch is collapsed by id first
            // (last one wins) so one payload carrying the same id twice cannot smuggle a duplicate
            // past the same rule. An empty `questNotes: []` payload takes this branch (incoming
            // !== undefined) but the filter+collapse over an empty array is a no-op, so existing
            // notes survive.
            ...(incomingQuestNotes !== undefined && {
              questNotes: [
                ...current.questNotes.filter(
                  (entry) => !incomingQuestNotes.some((update) => update.id === entry.id),
                ),
                ...[...new Map(incomingQuestNotes.map((entry) => [entry.id, entry])).values()],
              ] as typeof current.questNotes,
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

        // Re-parse mutated quest through questContract so defaults (e.g., flow nodes'
        // observables: []) are applied to newly-upserted entries before invariants /
        // completeness checks iterate them. Without this, input nodes lacking an
        // `observables` key (the MCP input contract overrides the default with
        // `.optional()`) trip "node.observables is not iterable" in offender-finder
        // transformers such as questDuplicateObservableIdsInNodeTransformer and
        // questTerminalNodesMissingObservablesTransformer.
        Object.assign(quest, questContract.parse(quest));

        // Orphan comment cleanup — drops any comment whose flow/node/observable anchor no longer
        // resolves after this write's flow upserts, inside the same lock and before persist, so a
        // deletion from the web UI and from an agent's modify-quest{flows} write are cleaned
        // identically (#dd-orphan-cleanup-server-side). Must run AFTER the re-parse above: the
        // re-parse is what applies the `observables: []` default to a node the input upserted
        // without an `observables` key, and cleaning up before it would read `undefined`
        // observables and wrongly orphan every observable-anchored comment on a freshly written
        // node. Guarded on `validated.flows !== undefined` because only a write that touches
        // flows/nodes/observables can remove an anchor — a title-only write leaves quest.comments
        // byte-identical and runs no anchor resolution at all.
        //
        // This cleanup is BEST EFFORT (#dd-no-orphan-validation-gate): a stray orphaned comment
        // that survives is tolerated and harmless, and must NEVER be promoted to a save-time
        // validation gate — it must never fail a save, block a status transition, or appear as a
        // failedCheck. A quest carrying a dangling comment is cosmetically imperfect and
        // functionally harmless, whereas an invariant that rejects one would wedge a quest on a
        // record the user owns and no agent is allowed to delete.
        if (validated.flows !== undefined) {
          quest.comments = questResolvedCommentsTransformer({
            comments: quest.comments,
            flows: quest.flows,
          });
        }

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
          // Agents write contract sources as bare-repo-relative (e.g., `packages/web/...`).
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

        // Package entries are judged against DISK, which no contract can do for itself: an 'edit' or
        // 'delete' must name a package that already exists, a 'new' one must not, and deleting a
        // package that something still imports would leave the post-quest dependency graph with a
        // dangling edge. Scoped to the entries this call WRITES, for the same reason the contract
        // branch above is: re-resolving a list the caller did not touch surfaces stale disk state.
        if (validated.packagesAffected !== undefined) {
          // Locations are repo-relative to the repo THIS quest targets, which the guild names —
          // never to whatever directory the orchestrator process was launched from. A quest driving
          // a sibling repo declares that repo's packages, and resolving them anywhere else turns
          // every one of them into a phantom.
          const projectRoot = await questRepoRootBroker({ questId: validated.questId });
          const { existingLocations, dependentsByPackage, stampedEntries } =
            await resolvePackageEntryFactsLayerBroker({
              entries: quest.packagesAffected,
              projectRoot,
            });
          // The DETECTOR owns `packageType` for a package that already exists — an author declaring
          // one is guessing, and everything downstream (e2e eligibility, the groundstomper fan-out,
          // the dependency graph) reads this field as if it were measured. Only a 'new' entry keeps
          // what it declared, because there is nothing on disk to measure.
          quest.packagesAffected = stampedEntries;
          const packageEntryOffenders = questPackageEntryViolationsTransformer({
            entries: stampedEntries,
            existingLocations,
            dependentsByPackage,
          });
          if (packageEntryOffenders.length > 0) {
            const packageEntryChecks: VerifyQuestCheck[] = packageEntryOffenders.map((message) =>
              verifyQuestCheckContract.parse({
                name: 'Package Entry Resolution',
                passed: false,
                details: String(message),
              }),
            );
            return modifyQuestResultContract.parse({
              success: false,
              error: 'Package entry validation failed',
              failedChecks: packageEntryChecks,
            });
          }
        }

        // Tier 3: save-time invariants (POST-mutation; runs on every call). Structural checks
        // only — the static plan-completeness gate is gone: acceptance is verified at runtime by
        // ward + the verify roles (flowrider/siegemaster) looping to done against the immutable
        // observables.
        const invariantFailures = questSaveInvariantsTransformer({
          quest,
          currentStatus: loadedQuest.status,
          ...(validated.status === undefined ? {} : { nextStatus: validated.status }),
        });
        if (invariantFailures.length > 0) {
          return modifyQuestResultContract.parse({
            success: false,
            error: 'Save invariants failed',
            failedChecks: invariantFailures,
          });
        }

        if (validated.status) {
          // Explicit transition (start / pause / resume / abandon / block) — already gated above
          // by the transition-validity guard and completeness checks.
          quest.status = validated.status;
        } else if (validated.workItems !== undefined) {
          // Work items changed with no explicit status: the new status is whatever they imply.
          // workItemsToQuestStatusTransformer is authoritative — it preserves the statuses it must
          // not derive over (pre-execution/paused/abandoned) and otherwise returns the
          // canonical complete / in_progress / blocked, including re-opening a quest that briefly
          // derived `complete` when fresh pending work is appended. Derived transitions are
          // consequences, not user transitions, so they bypass the transition-validity guard
          // (e.g. complete -> in_progress has no explicit edge).
          //
          // `blocked` is the one derived status NOT applied here: it is owned by the explicit
          // failure-routing path (questBlockOnFailureBroker / ward exhaustion / orchestration-loop
          // terminal / smoketest driver), which passes status explicitly AND drains pending items
          // to skipped. A bare workItems write that marks an item failed momentarily leaves its
          // downstream dead-ended — deriving `blocked` there would flicker the quest to a terminal
          // status (tripping smoketest terminal detection) before the recovery splice, which runs
          // as the next write, reopens it. Leaving blocked to the explicit path avoids that.
          const derivedStatus = workItemsToQuestStatusTransformer({
            workItems: quest.workItems,
            operations: quest.operations,
            currentStatus: quest.status,
          });
          if (!isQuestBlockedQuestStatusGuard({ status: derivedStatus })) {
            quest.status = derivedStatus;
          }
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

        return modifyQuestResultContract.parse({ success: true });
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
