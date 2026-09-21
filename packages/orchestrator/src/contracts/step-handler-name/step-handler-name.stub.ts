import { stepHandlerNameContract } from './step-handler-name-contract';
import type { StepHandlerName } from './step-handler-name-contract';

export const StepHandlerNameStub = (
  { value }: { value?: StepHandlerName } = { value: 'ward' },
): StepHandlerName => stepHandlerNameContract.parse(value ?? 'ward');
