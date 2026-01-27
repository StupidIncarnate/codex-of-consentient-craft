import { blockingReasonContract } from './blocking-reason-contract';
import type { BlockingReason } from './blocking-reason-contract';

export const BlockingReasonStub = ({ value }: { value?: string } = {}): BlockingReason =>
  blockingReasonContract.parse(value ?? 'Step blocked pending user input');
