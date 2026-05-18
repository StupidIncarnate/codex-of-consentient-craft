import { dispatchCountContract } from './dispatch-count-contract';
import type { DispatchCount } from './dispatch-count-contract';

export const DispatchCountStub = ({ value }: { value: number } = { value: 0 }): DispatchCount =>
  dispatchCountContract.parse(value);
