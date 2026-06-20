import { observableCountContract } from './observable-count-contract';
import type { ObservableCount } from './observable-count-contract';

export const ObservableCountStub = ({ value }: { value?: number } = {}): ObservableCount =>
  observableCountContract.parse(value ?? 0);
