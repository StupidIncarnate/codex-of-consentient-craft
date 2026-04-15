/**
 * PURPOSE: Returns PathSeeker's phased planningNotes for a quest (scope classification, surface reports, synthesis, walk findings, review report)
 *
 * USAGE:
 * const notes = await questGetPlanningNotesBroker({ questId });
 * // Returns empty-shape stub (all sub-fields undefined / empty) until real implementation lands
 *
 * WHEN-TO-USE: PathSeeker resume-on-restart — re-read already-committed phase artifacts instead of redoing work.
 */

// TODO: This is a Step 0.2 scaffold stub. Real implementation (plus the planning-* contracts
// this return shape will reference) comes later in the plan. The shape here matches the
// target PlanningNotes contract so downstream responders/adapters/flow/startup typecheck now.

export type QuestGetPlanningNotesResult = {
  readonly scopeClassification: undefined;
  readonly surfaceReports: readonly never[];
  readonly synthesis: undefined;
  readonly walkFindings: undefined;
  readonly reviewReport: undefined;
};

export const questGetPlanningNotesBroker = async ({
  questId: _questId,
}: {
  questId: string;
}): Promise<QuestGetPlanningNotesResult> => {
  await Promise.resolve();
  return {
    scopeClassification: undefined,
    surfaceReports: [],
    synthesis: undefined,
    walkFindings: undefined,
    reviewReport: undefined,
  };
};
