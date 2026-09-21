/**
 * PURPOSE: Everything ONE dispatched session needs to start, in one shape — what `get-quest-work`
 * serves on its `{ questId, workItemId }` call form. Reach for this over `qaChecklistContract`
 * (`@dungeonmaster/shared/contracts`) whenever the reader is a SESSION rather than a renderer: that
 * one answers "what does this flow contain", where this answers "what am I, what was I assigned,
 * what did the session before me leave, and where is the git/ward/lane state I would otherwise have
 * to go and run commands for".
 *
 * USAGE:
 * questWorkViewContract.parse(view);
 * // Returns: QuestWorkView — every absent value present as an explicit null
 *
 * NOTHING HERE IS `.optional()`, AND THAT IS THE LOAD-BEARING RULE. `JSON.stringify` drops an
 * `undefined` key outright, so an unset optional field vanishes from the served text — and to a
 * session an absent key reads as a failed fetch, which is a `wall`. Every absent value is
 * `.nullable()` and arrives as `null`. The arrays are `.default([])` for the same reason: an empty
 * list is an answer, a missing key is not.
 *
 * NOTHING HERE IS A DISCRIMINATED UNION EITHER. `git.baseBranch` matters only to `warpgate` and
 * `instance` only on a `needsLane` step, but a return whose SHAPE changes per family means every
 * prompt has to know which variant it was handed, and a variant is a branch a prompt cannot test.
 * One shape, `null` where a family has no use for a row.
 *
 * THE SUB-SHAPES ARE MODULE-LOCAL CONSTS, not sibling contract folders — the same construction
 * `wardDetailContract` uses for its six nested objects. Each one exists only as a row of this
 * return; none is parsed, stubbed or read anywhere else, and a folder per row would be a dozen
 * stubs and tests pinning shapes that only ever travel together. Their TYPES are exported, because
 * the layer brokers that build each row declare them as their return type.
 *
 * `assignedUnits` IS BUILT FROM `workItem.assignedUnitIds`, NEVER FROM THE PIECE. The piece's own
 * list is INTENT and the router re-filters it at dispatch to what is still unsettled, so serving
 * the piece's list hands a session units its predecessor already settled and gives the signal gate
 * a denominator the router never assigned.
 *
 * `surface` COMES FROM THE BUILT CHECKLIST ITEM's `checkSurface` AND IS NEVER RE-DERIVED.
 * `qaCheckSurfaceStatics.byOutcomeType[observableType]` is the trap: `observableType` is present on
 * the `observable` kind alone, so that route yields nothing for terminals, labelled branches and
 * off-map families — three of the four kinds, silently.
 */

import {
  contentTextContract,
  filePathContract,
  flowEdgeIdContract,
  flowIdContract,
  flowNodeIdContract,
  flowRecipeNameContract,
  operationItemContract,
  operationItemIdContract,
  outcomeTypeContract,
  packageNameContract,
  pieceIdContract,
  qaChecklistItemContract,
  qaChecklistKindContract,
  qaWalkPathContract,
  questContract,
  questIdContract,
  questNoteContract,
  questWorkItemIdContract,
  repoRelativePathContract,
  siegeInstanceIdContract,
  siegeRunIdContract,
  stepNameContract,
  unitIdContract,
  unitMarkContract,
  unitObservationContract,
  unitObservationFieldsContract,
  wardResultContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { agentFamilyNameContract } from '../agent-family-name/agent-family-name-contract';
import { commitShaContract } from '../commit-sha/commit-sha-contract';
import { questWorkInstanceContract } from '../quest-work-instance/quest-work-instance-contract';
import { recipeIdContract } from '../recipe-id/recipe-id-contract';
import { wardCheckTypeContract } from '../ward-check-type/ward-check-type-contract';
import { workPlanPieceContract } from '../work-plan-piece/work-plan-piece-contract';

// `flowId` is SINGULAR and nullable, not the operation item's `flowIds` array. Every fan-out mints
// one item per flow — codeweaver per (package, flow) cell, flowrider and siegemaster per flow — so
// an item carries exactly one. The `null` case is exactly one item and it is real: the codeweaver
// contracts cell, belonging to a package that owns a contract by `source` and tags no node
// anywhere. A non-nullable `flowId` drops the only session those contracts have.
const questWorkScope = z.object({
  flowId: flowIdContract.nullable(),
  packageNames: z.array(packageNameContract).default([]),
  operationItemId: operationItemIdContract,
  operationItemText: operationItemContract.shape.text,
});

// `unitObservationFieldsContract`, not `unitObservationContract` — the latter ends in a
// `.superRefine`, and a `ZodEffects` in zod 3 carries no `.shape`.
const questWorkUnit = z.object({
  unitId: unitIdContract,
  kind: qaChecklistKindContract,
  text: qaChecklistItemContract.shape.label,
  surface: qaChecklistItemContract.shape.checkSurface,
  nodeId: flowNodeIdContract.nullable(),
  edgeId: flowEdgeIdContract.nullable(),
  observableType: outcomeTypeContract.nullable(),
  verifyByReading: z.boolean().default(false),
  mark: unitMarkContract.nullable(),
  evidence: unitObservationFieldsContract.shape.evidence.nullable(),
  toSettle: unitObservationFieldsContract.shape.toSettle.unwrap().nullable(),
  markedBy: questWorkItemIdContract.nullable(),
  markedAt: unitObservationFieldsContract.shape.at.nullable(),
});

// `flowId` is nullable for the one flow-less scope there is: the codeweaver contracts cell, whose
// render is `questFlowSliceTransformer`'s foundation view — every contract that package owns and
// which flows it tags nodes in. Without the null that session gets no render at all.
const questWorkFlow = z.object({
  flowId: flowIdContract.nullable(),
  rendered: contentTextContract,
});

const questWorkPiece = z.object({
  pieceId: pieceIdContract,
  step: stepNameContract,
  context: workPlanPieceContract.shape.context,
  recipeId: recipeIdContract.nullable(),
  baselineFor: pieceIdContract.nullable(),
  contextUnitIds: z.array(unitIdContract).default([]),
  payload: z.record(z.unknown()),
});

// A seed with no proving run is a path no walk may be sent down — an unproven recipe does not fail
// loudly, it manufactures a defect that does not exist. Serve the `null` rather than omitting the
// row, so a walker can see the gap.
const questWorkRecipe = z.object({
  name: flowRecipeNameContract,
  provenRunId: siegeRunIdContract.nullable(),
});

// `scope` is read off the commit BODY's structured `work items: <ids>` line and is `null` when the
// body carries none. Parsing a prose subject is a guess, and a wrong guess mislabels which pass
// produced a file — both grammars sit on one branch while the deterministic `commit` handler is
// rolling out.
const questWorkCommit = z.object({
  sha: commitShaContract,
  scope: z.string().min(1).brand<'CommitScope'>().nullable(),
  subject: z.string().min(1).brand<'CommitSubject'>(),
  paths: z.array(repoRelativePathContract).default([]),
});

// `.unwrap().nullable()` rather than re-declaring the branch types — the pattern
// `gitWorkingTreeFilesBroker` already uses on this same contract.
const questWorkGit = z.object({
  baseBranch: questContract.shape.baseBranch.unwrap().nullable(),
  worktreePath: questContract.shape.worktreePath.unwrap().nullable(),
  baseRef: questContract.shape.baseRef.unwrap().nullable(),
});

// A repair builds `--only <checks>` from `failingCheckTypes`. Handed files alone it guesses the
// check set, and a guess that omits the failing check reports green over the red it was sent to fix.
//
// `failingPaths` is `filePathContract`, not `repoRelativePathContract` like every other path row
// here: ward writes ABSOLUTE paths into its own detail blob — `wardOutputToFilePathsTransformer`
// parses that same field through `absoluteFilePathContract` — so a repo-relative brand would refuse
// every real reading. Serving them as ward wrote them is lossless and is what the reader's `Read`
// takes; rebasing them onto a worktree root would drop any path outside it.
const questWorkWard = z.object({
  wardResultId: wardResultContract.shape.id,
  runId: wardResultContract.shape.runId.unwrap().nullable(),
  blobPath: filePathContract,
  failingCheckTypes: z.array(wardCheckTypeContract).default([]),
  failingPaths: z.array(filePathContract).default([]),
});

// An attack is an ABSENCE claim, and an absence is only evidence against a known-good reading taken
// first — so an antagonist is served the happy walk's own run, resolved from its piece's
// `baselineFor`.
const questWorkBaseline = z.object({
  pieceId: pieceIdContract,
  workItemId: questWorkItemIdContract,
  instanceId: siegeInstanceIdContract,
  runId: siegeRunIdContract,
});

const questWorkTruncation = z.object({
  section: z.enum(['flows', 'committedPaths', 'sessionNotes', 'walkPaths']),
  dropped: z.number().int().nonnegative().brand<'DroppedCount'>(),
});

export const questWorkViewContract = z.object({
  questId: questIdContract,
  workItemId: questWorkItemIdContract,
  family: agentFamilyNameContract,
  step: stepNameContract,
  role: z.enum(['planner', 'worker', 'reviewer']),
  scope: questWorkScope,
  assignedUnits: z.array(questWorkUnit).default([]),
  inScopeUnits: z.array(questWorkUnit).default([]),
  flows: z.array(questWorkFlow).default([]),
  walkPaths: z.array(qaWalkPathContract).default([]),
  pathsTruncated: z.boolean().default(false),
  piece: questWorkPiece.nullable(),
  plannerNotes: workPlanPieceContract.shape.notes,
  sessionNotes: z.array(questNoteContract).default([]),
  mintingObservation: unitObservationContract.nullable(),
  recipes: z.array(questWorkRecipe).default([]),
  uncommittedPaths: z.array(repoRelativePathContract).default([]),
  committedPaths: z.array(questWorkCommit).default([]),
  ward: questWorkWard.nullable(),
  riftcarverLogPath: filePathContract.nullable(),
  git: questWorkGit,
  instance: questWorkInstanceContract.nullable(),
  baseline: questWorkBaseline.nullable(),
  truncated: z.array(questWorkTruncation).default([]),
});

export type QuestWorkView = z.infer<typeof questWorkViewContract>;
export type QuestWorkScope = z.infer<typeof questWorkScope>;
export type QuestWorkUnit = z.infer<typeof questWorkUnit>;
export type QuestWorkFlow = z.infer<typeof questWorkFlow>;
export type QuestWorkPiece = z.infer<typeof questWorkPiece>;
export type QuestWorkRecipe = z.infer<typeof questWorkRecipe>;
export type QuestWorkCommit = z.infer<typeof questWorkCommit>;
export type QuestWorkGit = z.infer<typeof questWorkGit>;
export type QuestWorkWard = z.infer<typeof questWorkWard>;
export type { QuestWorkInstance } from '../quest-work-instance/quest-work-instance-contract';
export type QuestWorkBaseline = z.infer<typeof questWorkBaseline>;
export type QuestWorkTruncation = z.infer<typeof questWorkTruncation>;
