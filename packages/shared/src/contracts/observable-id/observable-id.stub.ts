import { observableIdContract } from './observable-id-contract';
import type { ObservableId } from './observable-id-contract';

export const ObservableIdStub = (
  { value }: { value: string } = { value: 'login-redirects-to-dashboard' },
): ObservableId => observableIdContract.parse(value);
