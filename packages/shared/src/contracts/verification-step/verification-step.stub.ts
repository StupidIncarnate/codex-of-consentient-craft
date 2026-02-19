import type { StubArgument } from '@dungeonmaster/shared/@types';

import { verificationStepContract } from './verification-step-contract';
import type { VerificationStep } from './verification-step-contract';

export const VerificationStepStub = ({
  ...props
}: StubArgument<VerificationStep> = {}): VerificationStep =>
  verificationStepContract.parse({
    action: 'assert',
    target: 'response.status',
    value: '200',
    condition: 'equals',
    type: 'api-call',
    ...props,
  });
