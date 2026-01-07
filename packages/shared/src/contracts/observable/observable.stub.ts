import type { StubArgument } from '@dungeonmaster/shared/@types';

import { observableContract } from './observable-contract';
import type { Observable } from './observable-contract';

export const ObservableStub = ({ ...props }: StubArgument<Observable> = {}): Observable =>
  observableContract.parse({
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    trigger: 'Click test button',
    dependsOn: [],
    outcomes: [],
    ...props,
  });
