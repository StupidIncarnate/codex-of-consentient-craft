/**
 * PURPOSE: Seeds planningNotes with stubbed gate-content fields required for a given quest status
 *
 * USAGE:
 * questGateContentSeedTransformer({ status: 'seek_synth' });
 * // Returns { scopeClassification: PlanningScopeClassificationStub(), surfaceReports: [], blightReports: [] }
 *
 * WHEN-TO-USE: Building quest JSON for E2E seeding where planningNotes fields are gated by status
 * WHEN-NOT-TO-USE: Production code — stubs are test-only data
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import {
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
  questStatusContract,
} from '@dungeonmaster/shared/contracts';

type GateContentRequirement = Readonly<{
  scopeClassification: boolean;
  synthesis: boolean;
  walkFindings: boolean;
  reviewReport: boolean;
}>;

const GATE_CONTENT_REQUIREMENTS: Readonly<Partial<Record<QuestStatus, GateContentRequirement>>> = {
  seek_synth: {
    scopeClassification: true,
    synthesis: false,
    walkFindings: false,
    reviewReport: false,
  },
  seek_walk: {
    scopeClassification: true,
    synthesis: true,
    walkFindings: false,
    reviewReport: false,
  },
  seek_plan: {
    scopeClassification: true,
    synthesis: true,
    walkFindings: true,
    reviewReport: false,
  },
  in_progress: {
    scopeClassification: true,
    synthesis: true,
    walkFindings: true,
    reviewReport: true,
  },
};

type PlanningNotesInput = Record<PropertyKey, unknown>;

export const questGateContentSeedTransformer = ({
  status,
  override,
}: {
  status: string;
  override?: PlanningNotesInput;
}): PlanningNotesInput => {
  const seeded: Record<PropertyKey, unknown> = { ...(override ?? {}) };
  if (seeded.surfaceReports === undefined) {
    seeded.surfaceReports = [];
  }
  if (seeded.blightReports === undefined) {
    seeded.blightReports = [];
  }
  const parseResult = questStatusContract.safeParse(status);
  if (!parseResult.success) {
    return seeded;
  }
  const requirements = GATE_CONTENT_REQUIREMENTS[parseResult.data];
  if (requirements === undefined) {
    return seeded;
  }
  if (requirements.scopeClassification && seeded.scopeClassification === undefined) {
    seeded.scopeClassification = PlanningScopeClassificationStub();
  }
  if (requirements.synthesis && seeded.synthesis === undefined) {
    seeded.synthesis = PlanningSynthesisStub();
  }
  if (requirements.walkFindings && seeded.walkFindings === undefined) {
    seeded.walkFindings = PlanningWalkFindingsStub();
  }
  if (requirements.reviewReport && seeded.reviewReport === undefined) {
    seeded.reviewReport = PlanningReviewReportStub();
  }
  return seeded;
};
