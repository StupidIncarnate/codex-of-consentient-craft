import type { Flow } from '../flow/flow-contract';
import { flowContract } from '../flow/flow-contract';

const flowIdContract = flowContract.shape.id;

export const FlowIdStub = ({ value }: { value: string } = { value: 'login-flow' }): Flow['id'] =>
  flowIdContract.parse(value);
