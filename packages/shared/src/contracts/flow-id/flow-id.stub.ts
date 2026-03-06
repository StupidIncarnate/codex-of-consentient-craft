import { flowIdContract } from './flow-id-contract';
import type { FlowId } from './flow-id-contract';

export const FlowIdStub = ({ value }: { value: string } = { value: 'login-flow' }): FlowId =>
  flowIdContract.parse(value);
