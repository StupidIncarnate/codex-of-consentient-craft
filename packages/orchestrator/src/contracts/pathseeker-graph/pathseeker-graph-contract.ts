/**
 * PURPOSE: Result shape of questBuildPathseekerGraphBroker — the four-tier pathseeker work-item graph plus its matching slice registry, ready for the orchestration-start-responder to persist via modify-quest.
 *
 * USAGE:
 * const graph: PathseekerGraph = questBuildPathseekerGraphBroker({...});
 * // graph.workItems = [surface..., dedup, assertion, walk]; graph.slices = scopeClassification.slices
 */

import { z } from 'zod';

import {
  flowNodeIdContract,
  packageNameContract,
  sliceNameContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

const sliceContract = z.object({
  name: sliceNameContract,
  packages: z.array(packageNameContract),
  flowIds: z.array(flowNodeIdContract),
});

export const pathseekerGraphContract = z.object({
  workItems: z.array(workItemContract),
  slices: z.array(sliceContract),
});

export type PathseekerGraph = z.infer<typeof pathseekerGraphContract>;
