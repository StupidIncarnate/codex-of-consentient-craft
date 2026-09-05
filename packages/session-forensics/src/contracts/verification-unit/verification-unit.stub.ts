import { verificationUnitContract, type VerificationUnit } from './verification-unit-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const VerificationUnitStub = ({
  ...props
}: StubArgument<VerificationUnit> = {}): VerificationUnit =>
  verificationUnitContract.parse({
    flowId: 'render-images-in-transcript',
    flowType: 'runtime',
    kind: 'observable',
    unitId: 'check-thumbnail-renders',
    packages: ['web'],
    verificationMethod: 'test',
    trackVerdicts: {
      codeweaverSignoff: 'confirmed',
    },
    ...props,
  });
