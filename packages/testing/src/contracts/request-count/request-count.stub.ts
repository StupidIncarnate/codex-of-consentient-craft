import { requestCountContract } from './request-count-contract';
import type { RequestCount } from './request-count-contract';

export const RequestCountStub = ({ value }: { value: number } = { value: 0 }): RequestCount =>
  requestCountContract.parse(value);
