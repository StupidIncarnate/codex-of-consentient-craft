/**
 * PURPOSE: After PathSeeker creates steps, generate the full work item chain
 *          (codeweaver[per package] -> ward -> flowrider[per flow, chained] ->
 *           siegemaster[per flow, chained] -> lawbringer -> blightwarden -> final-ward).
 *           Blightwarden is a single work item that summons its five report-only minions itself
 *           as Agent sub-agents (mirrors pathseeker). Codeweaver owns every step EXCEPT
 *           flowrider-owned ones (flows/ + startup/ folder types and .integration.test.ts / .e2e.ts
 *           files, per isFlowriderOwnedStepGuard); those route to the per-flow flowrider items
 *           (which own the flow-perspective test suite). Flowrider items are emitted only when ≥1
 *           flowrider-owned step exists.
 *
 * USAGE:
 * stepsToWorkItemsTransformer({ steps, flows, pathseekerWorkItemId, now });
 * // Returns: WorkItem[] with dependency chain wired (one flowriderItem + one siegeItem per flow)
 */

import { workItemContract } from '@dungeonmaster/shared/contracts';
import type {
  DependencyStep,
  Flow,
  QuestWorkItemId,
  StepId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { isFlowriderOwnedStepGuard } from '../../guards/is-flowrider-owned-step/is-flowrider-owned-step-guard';
import { isLawbringerReviewableStepGuard } from '../../guards/is-lawbringer-reviewable-step/is-lawbringer-reviewable-step-guard';
import { slotManagerStatics } from '../../statics/slot-manager/slot-manager-statics';
import { mergeCyclicStepChunksTransformer } from '../merge-cyclic-step-chunks/merge-cyclic-step-chunks-transformer';
import { stepsToPackageChunksTransformer } from '../steps-to-package-chunks/steps-to-package-chunks-transformer';

export const stepsToWorkItemsTransformer = ({
  steps,
  flows,
  pathseekerWorkItemId,
  now,
}: {
  steps: DependencyStep[];
  flows: Flow[];
  pathseekerWorkItemId: QuestWorkItemId;
  now: IsoTimestamp;
}): WorkItem[] => {
  // Flow-test-owned steps are owned by flowrider (it writes their impl + flow/e2e/integration test
  // suite), not codeweaver. Partition them out so codeweaver chunks exclude them and flowrider items
  // can carry their refs.
  const flowStartupSteps = steps.filter((step) => isFlowriderOwnedStepGuard({ step }));
  const flowStartupStepRefs = flowStartupSteps.map((step) => `steps/${String(step.id)}`);

  // Pass 1: chunk the codeweaver steps (one chunk per package, flow/startup excluded) AND
  // pre-populate stepIdToCwId for every step across every chunk BEFORE pass 2 reads it. This is
  // required because a step in chunk N may depend on a step in chunk M where M > N.
  // mergeCyclicStepChunksTransformer collapses any chunks whose dependsOn edges form a cycle (a
  // package-bucket step bracketing a chain through no-focusFile solo chunks) into one chunk, so the
  // codeweaver work-item graph stays acyclic.
  const cwChunks = mergeCyclicStepChunksTransformer({
    chunks: stepsToPackageChunksTransformer({ steps }),
  });
  const stepIdToCwId = new Map<StepId, QuestWorkItemId>();
  const assignedCwIds: QuestWorkItemId[] = cwChunks.map((chunk) => {
    const cwId = workItemContract.shape.id.parse(crypto.randomUUID());
    for (const step of chunk) {
      stepIdToCwId.set(step.id, cwId);
    }
    return cwId;
  });

  // Pass 2: build each codeweaver work item, resolving every step dep via the id map.
  const cwItems: WorkItem[] = cwChunks.map((chunk, index) => {
    const cwId = assignedCwIds[index];

    const dependsOnSet = new Set<QuestWorkItemId>([pathseekerWorkItemId]);
    for (const step of chunk) {
      for (const depStepId of step.dependsOn) {
        const depCwId = stepIdToCwId.get(depStepId);
        if (depCwId !== undefined && depCwId !== cwId) {
          dependsOnSet.add(depCwId);
        }
      }
    }

    return workItemContract.parse({
      id: cwId,
      role: 'codeweaver',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: chunk.map((step) => `steps/${String(step.id)}`),
      dependsOn: [...dependsOnSet],
      // Code-recovery retry budget: a codeweaver `failed` splices a spiritmender fix + a fresh
      // codeweaver run until this many attempts are spent, then escalates to a PathSeeker replan.
      maxAttempts: slotManagerStatics.codeweaver.maxAttempts,
      createdAt: now,
    });
  });

  const allCwIds = cwItems.map((item) => item.id);

  const wardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: allCwIds,
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'changed',
  });

  // Flowrider: emitted only when ≥1 flow/startup step exists (the summoning rule). One item per
  // flow, chained sequentially so at most one runs at a time (dev server / port / FS contention),
  // first rooted on the changed-ward. Each carries its flow ref plus ALL flow/startup step refs —
  // steps have no flow link, so every chained flowrider sees the same step set; chaining means a
  // later flow's agent sees the earlier flow's committed files and extends rather than collides.
  const flowriderItems: WorkItem[] =
    flowStartupSteps.length > 0
      ? flows.reduce<WorkItem[]>((acc, flow) => {
          const prevFlowriderId: QuestWorkItemId | undefined =
            acc.length > 0 ? acc[acc.length - 1]?.id : undefined;
          const flowriderDependsOn: QuestWorkItemId[] =
            prevFlowriderId === undefined ? [wardItem.id] : [wardItem.id, prevFlowriderId];

          const flowriderItem = workItemContract.parse({
            id: crypto.randomUUID(),
            role: 'flowrider',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: [`flows/${String(flow.id)}`, ...flowStartupStepRefs],
            dependsOn: flowriderDependsOn,
            maxAttempts: slotManagerStatics.flowrider.maxAttempts,
            createdAt: now,
          });
          return [...acc, flowriderItem];
        }, [])
      : [];

  // Emit one siegeItem per flow, chained sequentially. Each siege depends on its own flow's
  // flowrider (so the flow-test suite exists before siege manually QAs + reviews it); when no
  // flowrider exists (no flow/startup steps) it falls back to the changed-ward.
  const siegeItems: WorkItem[] = flows.reduce<WorkItem[]>((acc, flow, index) => {
    const prevSiegeId: QuestWorkItemId | undefined =
      acc.length > 0 ? acc[acc.length - 1]?.id : undefined;
    const upstreamId: QuestWorkItemId = flowriderItems[index]?.id ?? wardItem.id;
    const siegeDependsOn: QuestWorkItemId[] =
      prevSiegeId === undefined ? [upstreamId] : [upstreamId, prevSiegeId];

    const siegeItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'siegemaster',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`flows/${String(flow.id)}`],
      dependsOn: siegeDependsOn,
      // Recovery budget: a siege `failed` splices a spiritmender + ward + a fresh siege retry until
      // this many total attempts are spent, then the failure escalates to a PathSeeker replan
      // (questRecoverRoleBroker) — never an immediate block.
      maxAttempts: slotManagerStatics.siegemaster.maxAttempts,
      createdAt: now,
    });
    return [...acc, siegeItem];
  }, []);

  const allSiegeIds = siegeItems.map((item) => item.id);

  // Lawbringer deps: all siegeItems (so laws wait for every flow's siege).
  // Empty-flows guard: if no sieges exist, lawbringers depend on the wardItem directly.
  const lawbringerDependsOn: QuestWorkItemId[] =
    allSiegeIds.length > 0 ? [...allSiegeIds] : [wardItem.id];

  // Lawbringer mirrors codeweaver: one parent work item per package (it fans out lawbringer-minions
  // per pair inside its own turn). Filter to reviewable source pairs first so a `[command]` / barrel /
  // package.json step never spawns a reviewer with nothing to review. stepsToPackageChunksTransformer
  // additionally excludes flowrider-owned steps. No cyclic merge: lawbringer items share one barrier
  // dependsOn (the sieges/ward) with no inter-item edges.
  const lawbringerSteps = steps.filter((step) => isLawbringerReviewableStepGuard({ step }));
  const lawChunks = stepsToPackageChunksTransformer({ steps: lawbringerSteps });
  const lawItems: WorkItem[] = lawChunks.map((chunk) =>
    workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'lawbringer',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: chunk.map((step) => `steps/${String(step.id)}`),
      dependsOn: lawbringerDependsOn,
      maxAttempts: slotManagerStatics.lawbringer.maxAttempts,
      createdAt: now,
    }),
  );

  const allLawIds = lawItems.map((item) => item.id);

  // Blightwarden runs between lawbringers and the final ward as a SINGLE work item. It summons its
  // five report-only minions (security, dedup, perf, integrity, dead-code) itself as Agent
  // sub-agents — that parallelism lives inside its turn, not in the work-item graph (mirrors how
  // pathseeker summons its surface/cleanup minions). Deps: all laws if any; otherwise all sieges;
  // otherwise the ward (empty-flows edge).
  const blightwardenDependsOn: QuestWorkItemId[] =
    allLawIds.length > 0 ? allLawIds : allSiegeIds.length > 0 ? [...allSiegeIds] : [wardItem.id];

  const blightwardenItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'blightwarden',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: blightwardenDependsOn,
    maxAttempts: slotManagerStatics.blightwarden.maxAttempts,
    createdAt: now,
  });

  const finalWardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: [blightwardenItem.id],
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'full',
  });

  return [
    ...cwItems,
    wardItem,
    ...flowriderItems,
    ...siegeItems,
    ...lawItems,
    blightwardenItem,
    finalWardItem,
  ];
};
