import type { HookSessionStartResponderResult } from './hook-session-start-responder-result-contract';
import { hookSessionStartResponderResultContract } from './hook-session-start-responder-result-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const HookSessionStartResponderResultStub = ({
  ...props
}: StubArgument<HookSessionStartResponderResult> = {}): HookSessionStartResponderResult =>
  hookSessionStartResponderResultContract.parse({
    shouldOutput: false,
    ...props,
  });
