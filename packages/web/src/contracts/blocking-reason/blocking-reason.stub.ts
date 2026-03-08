import { blockingReasonContract } from './blocking-reason-contract';
import type { BlockingReason } from './blocking-reason-contract';

export const BlockingReasonStub = ({ value }: { value?: string } = {}): BlockingReason =>
  blockingReasonContract.parse(value ?? 'Waiting for dependency step-1');
