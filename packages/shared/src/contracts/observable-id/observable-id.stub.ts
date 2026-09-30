import type { FlowObservable } from '../flow-observable/flow-observable-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';

export const ObservableIdStub = (
  { value }: { value: string } = { value: 'login-redirects-to-dashboard' },
): FlowObservable['id'] => flowObservableContract.shape.id.parse(value);
