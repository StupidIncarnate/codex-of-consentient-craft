import type { HookPostEditResponderResult } from './hook-post-edit-responder-result-contract';
import { hookPostEditResponderResultContract } from './hook-post-edit-responder-result-contract';
import { LintResultStub } from '../lint-result/lint-result.stub';
import { MessageStub } from '../message/message.stub';
import type { StubArgument } from '@questmaestro/shared/@types';

export const HookPostEditResponderResultStub = ({
  ...props
}: StubArgument<HookPostEditResponderResult> = {}): HookPostEditResponderResult =>
  hookPostEditResponderResultContract.parse({
    violations: [LintResultStub()],
    message: MessageStub({ value: 'Post-edit check complete' }),
    ...props,
  });
