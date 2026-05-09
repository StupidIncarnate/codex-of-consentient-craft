import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planningScopeClassificationContract } from './planning-scope-classification-contract';
import type { PlanningScopeClassification } from './planning-scope-classification-contract';

export const PlanningScopeClassificationStub = ({
  ...props
}: StubArgument<PlanningScopeClassification> = {}): PlanningScopeClassification =>
  planningScopeClassificationContract.parse({
    size: 'medium',
    slicing: 'Slice A handles auth, Slice B handles session storage',
    slices: [],
    rationale: 'Two independent surfaces with a shared session contract',
    classifiedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
