import type { StubArgument } from '@dungeonmaster/shared/@types';

import { registerMonitorSessionResultContract } from './register-monitor-session-result-contract';
import type { RegisterMonitorSessionResult } from './register-monitor-session-result-contract';

export const RegisterMonitorSessionResultStub = ({
  ...props
}: StubArgument<RegisterMonitorSessionResult> = {}): RegisterMonitorSessionResult =>
  registerMonitorSessionResultContract.parse({
    status: 'registered',
    orphansReset: 0,
    ...props,
  });
