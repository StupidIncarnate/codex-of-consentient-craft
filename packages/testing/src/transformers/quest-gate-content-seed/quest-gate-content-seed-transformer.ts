/**
 * PURPOSE: Seeds planningNotes with the default empty gate-content shape for a given quest status
 *
 * USAGE:
 * questGateContentSeedTransformer({ status: 'in_progress' });
 * // Returns { blightReports: [] }
 *
 * WHEN-TO-USE: Building quest JSON for E2E seeding where planningNotes fields need their defaults
 * WHEN-NOT-TO-USE: Production code — this is test-only seeding
 */

type PlanningNotesInput = Record<PropertyKey, unknown>;

export const questGateContentSeedTransformer = ({
  override,
}: {
  status: string;
  override?: PlanningNotesInput;
}): PlanningNotesInput => {
  const seeded: Record<PropertyKey, unknown> = { ...(override ?? {}) };
  if (seeded.blightReports === undefined) {
    seeded.blightReports = [];
  }
  return seeded;
};
