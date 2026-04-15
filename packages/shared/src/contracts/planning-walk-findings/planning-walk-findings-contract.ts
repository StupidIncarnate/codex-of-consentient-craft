/**
 * PURPOSE: Defines the PlanningWalkFindings structure — PathSeeker's walk-the-code verification results
 *
 * USAGE:
 * planningWalkFindingsContract.parse({filesRead: [...], structuralIssuesFound: [...], planPatches: [...], verifiedAt: '2024-...'});
 * // Returns: PlanningWalkFindings object — PathSeeker's Phase 5 output
 */

import { z } from 'zod';

import { repoRelativePathContract } from '../repo-relative-path/repo-relative-path-contract';

export const planningWalkFindingsContract = z.object({
  filesRead: z.array(repoRelativePathContract).default([]),
  structuralIssuesFound: z.array(z.string().min(1).brand<'StructuralIssue'>()).default([]),
  planPatches: z.array(z.string().min(1).brand<'PlanPatch'>()).default([]),
  verifiedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type PlanningWalkFindings = z.infer<typeof planningWalkFindingsContract>;
