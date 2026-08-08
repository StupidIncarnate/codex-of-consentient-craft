import { flowLayoutSignatureContract } from './flow-layout-signature-contract';
import type { FlowLayoutSignature } from './flow-layout-signature-contract';

export const FlowLayoutSignatureStub = ({ value }: { value?: string } = {}): FlowLayoutSignature =>
  flowLayoutSignatureContract.parse(value ?? '{"id":"login-flow","nodes":[]}');
