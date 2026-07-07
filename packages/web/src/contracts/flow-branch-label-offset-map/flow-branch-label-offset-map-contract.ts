/**
 * PURPOSE: Defines the output of flowBranchLabelOffsetsTransformer — a horizontal label offset
 * (px) per branch edge id, used to spread a decision's sibling branch labels apart so they read as
 * one row instead of stacking. Only edges that share a source with another labeled branch appear;
 * an offset of 0 means that label is already clear of its siblings.
 *
 * USAGE:
 * flowBranchLabelOffsetMapContract.parse({ 'dec-to-left': -40, 'dec-to-down': 40 });
 * // Returns: FlowBranchLabelOffsetMap keyed by edge id with branded px offsets
 */

import { z } from 'zod';

const flowBranchLabelOffsetContract = z.number().brand<'FlowBranchLabelOffset'>();

export const flowBranchLabelOffsetMapContract = z
  .record(z.string(), flowBranchLabelOffsetContract)
  .brand<'FlowBranchLabelOffsetMap'>();

export type FlowBranchLabelOffsetMap = z.infer<typeof flowBranchLabelOffsetMapContract>;
