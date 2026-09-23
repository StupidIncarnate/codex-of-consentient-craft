/**
 * PURPOSE: One node of the plan tree, as the union over the seven op kinds. Reach for this wherever
 * a plan is read whole; reach for one `op-*` contract when only that kind is in hand. This is a
 * `z.union`, not a `z.discriminatedUnion` — `opFilterContract`'s own type is widened to a plain
 * `ZodType` to let its nested `ops` array recurse on itself, and `z.discriminatedUnion` rejects a
 * widened branch with `TS2345`. A malformed op therefore fails as `invalid_union`, carrying every
 * branch's own `unionErrors`, never `invalid_union_discriminator`.
 *
 * USAGE:
 * hydrationOpContract.parse({ op: 'remove', ref: 'guild[0:0]/quest[0:1]' });
 * // Returns one of the seven HydrationOp members
 */
import { z } from 'zod';
import { opCreateContract } from '../op-create/op-create-contract';
import { opSetContract } from '../op-set/op-set-contract';
import { opRemoveContract } from '../op-remove/op-remove-contract';
import { opSaveRecordContract } from '../op-save-record/op-save-record-contract';
import { opExtraContract } from '../op-extra/op-extra-contract';
import { opFilterContract } from '../op-filter/op-filter-contract';
import { opAttachContract } from '../op-attach/op-attach-contract';

export const hydrationOpContract = z.union([
  opCreateContract,
  opSetContract,
  opRemoveContract,
  opSaveRecordContract,
  opExtraContract,
  opFilterContract,
  opAttachContract,
]);

export type HydrationOp = z.infer<typeof hydrationOpContract>;
