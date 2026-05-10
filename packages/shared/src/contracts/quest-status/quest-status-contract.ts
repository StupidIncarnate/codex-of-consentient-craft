/**
 * PURPOSE: Defines valid quest status values
 *
 * USAGE:
 * questStatusContract.parse('in_progress');
 * // Returns: 'in_progress' as QuestStatus
 */

import { z } from 'zod';

export const questStatusContract = z.enum([
  'created',
  'pending',
  'explore_flows',
  'review_flows',
  'flows_approved',
  'explore_observables',
  'review_observables',
  'approved',
  'explore_design',
  'review_design',
  'design_approved',
  'seek_scope',
  'seek_synth',
  'seek_walk',
  'in_progress',
  'paused',
  'blocked',
  'complete',
  'abandoned',
]);

export type QuestStatus = z.infer<typeof questStatusContract>;
