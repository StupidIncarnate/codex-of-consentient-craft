import { nodeLabelContract } from './node-label-contract';
import type { NodeLabel } from './node-label-contract';

export const NodeLabelStub = (
  { value }: { value: string } = { value: 'open-guild-modal' },
): NodeLabel => nodeLabelContract.parse(value);
