import { riftcarverLogLineContract } from './riftcarver-log-line-contract';
import type { RiftcarverLogLine } from './riftcarver-log-line-contract';

export const RiftcarverLogLineStub = ({ value }: { value?: string } = {}): RiftcarverLogLine =>
  riftcarverLogLineContract.parse(value ?? '— build pass 1 —');
