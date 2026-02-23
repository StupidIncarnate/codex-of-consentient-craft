import type { StubArgument } from '@dungeonmaster/shared/@types';

import { userTextStreamLineContract } from './user-text-stream-line-contract';
import type { UserTextStreamLine } from './user-text-stream-line-contract';

/**
 * User message with string content form.
 */
export const UserTextStringStreamLineStub = ({
  ...props
}: StubArgument<UserTextStreamLine> = {}): UserTextStreamLine =>
  userTextStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: 'Hello',
    },
    ...props,
  });

/**
 * User message with array content form.
 */
export const UserTextArrayStreamLineStub = ({
  ...props
}: StubArgument<UserTextStreamLine> = {}): UserTextStreamLine =>
  userTextStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    },
    ...props,
  });
