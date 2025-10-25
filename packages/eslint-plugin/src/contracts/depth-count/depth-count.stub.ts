import { depthCountContract } from './depth-count-contract';
import type { DepthCount } from './depth-count-contract';

export const DepthCountStub = ({ value }: { value: number } = { value: 1 }): DepthCount =>
  depthCountContract.parse(value);
