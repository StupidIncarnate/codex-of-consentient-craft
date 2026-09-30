import type { Flow } from '../flow/flow-contract';
import { flowContract } from '../flow/flow-contract';

export const FlowIdStub = ({ value }: { value: string } = { value: 'login-flow' }): Flow['id'] =>
  flowContract.shape.id.parse(value);
