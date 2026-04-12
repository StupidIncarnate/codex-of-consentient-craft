import { stepFocusActionKindContract } from './step-focus-action-kind-contract';
import type { StepFocusActionKind } from './step-focus-action-kind-contract';

export const StepFocusActionKindStub = ({
  value,
}: { value?: StepFocusActionKind } = {}): StepFocusActionKind =>
  stepFocusActionKindContract.parse(value ?? 'verification');
