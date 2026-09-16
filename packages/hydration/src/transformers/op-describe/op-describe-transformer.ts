/**
 * PURPOSE: Names what the runner was doing, for the one line a mid-run error puts in front of a
 * reader. Reach for this in every mid-run throw: an error naming an ingredient but not the op
 * leaves a five-ingredient plan unreadable, and this is the one place that description is written.
 *
 * USAGE:
 * opDescribeTransformer({ op: OpCreateStub({ ref: 'guild[0:0]/quest[0:1]' }) });
 * // Returns 'create guild[0:0]/quest[0:1]'
 */
import { opDescriptionContract } from '../../contracts/op-description/op-description-contract';
import type { OpDescription } from '../../contracts/op-description/op-description-contract';
import type { HydrationOp } from '../../contracts/hydration-op/hydration-op-contract';

export const opDescribeTransformer = ({ op }: { op: HydrationOp }): OpDescription => {
  if (op.op === 'create') {
    return opDescriptionContract.parse(`create ${op.ref}`);
  }
  if (op.op === 'set') {
    return opDescriptionContract.parse(`set ${op.ref}`);
  }
  if (op.op === 'remove') {
    return opDescriptionContract.parse(`remove ${op.ref}`);
  }
  if (op.op === 'saveRecord') {
    return opDescriptionContract.parse(`saveRecord ${op.ref}`);
  }
  if (op.op === 'extra') {
    return opDescriptionContract.parse(`extra ${op.verb} ${op.ref}`);
  }
  return opDescriptionContract.parse(
    op.scope === undefined
      ? `filter ${op.ingredient}`
      : `filter ${op.ingredient} under ${op.scope}`,
  );
};
