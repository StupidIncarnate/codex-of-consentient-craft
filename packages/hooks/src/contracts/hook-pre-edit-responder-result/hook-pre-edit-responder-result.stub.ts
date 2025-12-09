import type { HookPreEditResponderResult } from './hook-pre-edit-responder-result-contract';
import { hookPreEditResponderResultContract } from './hook-pre-edit-responder-result-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const HookPreEditResponderResultStub = ({
  ...props
}: StubArgument<HookPreEditResponderResult> = {}): HookPreEditResponderResult =>
  hookPreEditResponderResultContract.parse({
    shouldBlock: false,
    ...props,
  });
