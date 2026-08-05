/**
 * PURPOSE: Builds the Start-Quest relay seed for a quest: appends the quest type's implementation
 * operation items (bug-hunt's pesteater; feature quests already carry Chaos-authored codeweaver
 * items) plus the fixed verify tail to the operations ledger, creates ONE work item for the first
 * actionable (pending) operation item so the dispatch loop has something to pick up, and stamps
 * `baseRef` (the commit the quest's review diff is measured from) so review roles never lose track
 * of it once the default branch absorbs the quest's own commits.
 *
 * Flowrider gets ONE whole-quest operation item carrying every quest flow id in `flowIds`, and that
 * single session fans its own work out across those flows internally — authoring test suites is
 * parallel-safe.
 *
 * Siegemaster gets ONE ITEM PER FLOW. Its work is strictly serial (one dev server, one reset lever),
 * so a whole-quest item put every flow behind one session's context and one pt budget. Per-flow
 * items give each flow its own budget and its own completion gate.
 *
 * USAGE:
 * const { operations, workItems, baseRef } = await questBuildRelayGraphBroker({ quest, priorWorkItemIds, now });
 * // operations = FULL replacement ledger (plan items completed + tail appended, first actionable
 * //   marked in_progress); workItems = the single first work item, linked operations/<id>; baseRef
 * //   is the NEW value to stamp (present only when quest.baseRef was unset and HEAD was readable —
 * //   omit means "leave quest.baseRef exactly as it is").
 * // Persist all three via questOperationsUpdateBroker (NOT questModifyBroker — this writes the ledger).
 *
 * WHEN-TO-USE: Once per Start Quest transition, from OrchestrationStartResponder, after checking
 *   the tail has not already been appended (idempotency lives in the responder). Re-calling this
 *   broker directly on an already-seeded quest (e.g. quest-hydrate-broker) is also safe: baseRef is
 *   only ever computed once, from the first call that sees it unset.
 */

import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  operationItemContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type {
  OperationItem,
  Quest,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { isChatWorkItemRoleGuard } from '@dungeonmaster/shared/guards';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { gitHeadShaAdapter } from '../../../adapters/git/head-sha/git-head-sha-adapter';
import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';

type GitBaseRef = NonNullable<Quest['baseRef']>;

export const questBuildRelayGraphBroker = async ({
  quest,
  priorWorkItemIds,
  now,
}: {
  quest: Quest;
  priorWorkItemIds: QuestWorkItemId[];
  now: IsoTimestamp;
}): Promise<{ operations: OperationItem[]; workItems: WorkItem[]; baseRef?: GitBaseRef }> => {
  // Stamp only when unset — a re-Start (or any direct re-call) must never move the base to include
  // the quest's own implementation commits, which is the exact defect baseRef exists to fix. When
  // it IS unset, reading HEAD is I/O (the adapter spawns `git`), so it only runs on that path; a
  // git failure resolves to null here, degrading to "no base" rather than throwing — seeding must
  // still succeed even when the base can't be pinned.
  const baseRef: GitBaseRef | undefined =
    quest.baseRef ??
    (await gitHeadShaAdapter({ cwd: absoluteFilePathContract.parse(processCwdAdapter()) })) ??
    undefined;

  const registry = questTypeRegistryStatics[quest.questType];

  // Intake plan items (every chat role — chaoswhisperer/glyphsmith/bughunt) are done by the time
  // the user starts the quest — force any the intake agent forgot to complete, so advance never
  // tries to dispatch a fresh chat session for them.
  const settledExisting = quest.operations.map((operation) =>
    isChatWorkItemRoleGuard({ role: operation.role }) && operation.status !== 'complete'
      ? operationItemContract.parse({ ...operation, status: 'complete' })
      : operation,
  );

  const implementationOps = registry.startImplementationOps.map((seed) =>
    operationItemContract.parse({
      id: crypto.randomUUID(),
      role: seed.role,
      text: seed.text,
      status: 'pending',
      locked: true,
    }),
  );

  // Tail seeds expand in registry order. Most roles serve the whole diff and set no `flowIds`.
  //
  // `flowrider` stays ONE whole-quest item: authoring test suites is parallel-safe, so its session
  // fans out to minions that run concurrently and the whole spine fits one pass.
  //
  // `siegemaster` fans out to ONE ITEM PER FLOW. Its work is strictly serial (one dev server, one
  // reset lever), so a whole-quest item put every flow behind a single session's context AND a
  // single pt budget of `slotManagerStatics.siegemaster.maxAttempts`. Per-flow items give each flow
  // its own budget — the pt chain keys on role + base text, and the text carries the flow id — and
  // scope the completion gate to a checklist one session can actually finish.
  const tailOps = registry.relayTail.flatMap((entry) => {
    const seed = {
      role: entry.role,
      status: 'pending',
      locked: true,
      ...('wardMode' in entry ? { wardMode: entry.wardMode } : {}),
    };

    if (entry.role === 'siegemaster') {
      // A flow-less quest still gets exactly one item: inbound `GAP:` work from earlier roles has
      // to land somewhere, and dropping the role entirely would leave nobody accountable for it.
      if (quest.flows.length === 0) {
        return [
          operationItemContract.parse({ ...seed, id: crypto.randomUUID(), text: entry.text }),
        ];
      }
      return quest.flows.map((flow) =>
        operationItemContract.parse({
          ...seed,
          id: crypto.randomUUID(),
          text: `${entry.text} — flow: ${String(flow.id)}`,
          flowIds: [flow.id],
        }),
      );
    }

    return [
      operationItemContract.parse({
        ...seed,
        id: crypto.randomUUID(),
        text: entry.text,
        ...(entry.role === 'flowrider' ? { flowIds: quest.flows.map((flow) => flow.id) } : {}),
      }),
    ];
  });

  const operations = [...settledExisting, ...implementationOps, ...tailOps];

  const firstActionable = operations.find((operation) => operation.status === 'pending');
  if (firstActionable === undefined) {
    return { operations, workItems: [], ...(baseRef === undefined ? {} : { baseRef }) };
  }

  const firstWorkItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: firstActionable.role,
    status: 'pending',
    spawnerType: firstActionable.role === 'ward' ? 'command' : 'agent',
    relatedDataItems: [`operations/${String(firstActionable.id)}`],
    dependsOn: priorWorkItemIds,
    maxAttempts: 1,
    createdAt: now,
    ...(firstActionable.wardMode === undefined ? {} : { wardMode: firstActionable.wardMode }),
  });

  return {
    operations: operations.map((operation) =>
      operation.id === firstActionable.id
        ? operationItemContract.parse({ ...operation, status: 'in_progress' })
        : operation,
    ),
    workItems: [firstWorkItem],
    ...(baseRef === undefined ? {} : { baseRef }),
  };
};
