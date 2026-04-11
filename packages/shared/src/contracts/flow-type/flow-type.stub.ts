import { flowTypeContract } from './flow-type-contract';
import type { FlowType } from './flow-type-contract';

export const FlowTypeStub = ({ value }: { value?: FlowType } = {}): FlowType =>
  flowTypeContract.parse(value ?? 'runtime');
