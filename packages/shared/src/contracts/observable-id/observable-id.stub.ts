import type { FlowObservable } from '../flow-observable/flow-observable-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';

const observableIdContract = flowObservableContract.shape.id;

export const ObservableIdStub = (
  { value }: { value: string } = { value: 'login-redirects-to-dashboard' },
): FlowObservable['id'] => observableIdContract.parse(value);
