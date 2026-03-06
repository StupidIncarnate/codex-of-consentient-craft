import { stepIdContract } from './step-id-contract';
import type { StepId } from './step-id-contract';

export const StepIdStub = ({ value }: { value: string } = { value: 'create-login-api' }): StepId =>
  stepIdContract.parse(value);
