import { observableOriginContract } from './observable-origin-contract';
import type { ObservableOrigin } from './observable-origin-contract';

export const ObservableOriginStub = (
  { value }: { value: string } = { value: 'spec' },
): ObservableOrigin => observableOriginContract.parse(value);
