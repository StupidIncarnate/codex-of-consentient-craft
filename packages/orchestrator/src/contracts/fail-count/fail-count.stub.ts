import { failCountContract } from './fail-count-contract';
import type { FailCount } from './fail-count-contract';

export const FailCountStub = ({ value }: { value: number } = { value: 0 }): FailCount =>
  failCountContract.parse(value);
