import type { StubArgument } from '@dungeonmaster/shared/@types';

import { qaVerificationUnitContract } from './qa-verification-unit-contract';
import type { QaVerificationUnit } from './qa-verification-unit-contract';

export const QaVerificationUnitStub = ({
  ...props
}: StubArgument<QaVerificationUnit> = {}): QaVerificationUnit =>
  qaVerificationUnitContract.parse({
    kind: 'terminal',
    id: 'login-flow:terminal:dashboard',
    flowId: 'login-flow',
    nodeId: 'dashboard',
    nodeLabel: 'Dashboard',
    ...props,
  });
