/**
 * PURPOSE: Builds a valid FollowupChatStartResult for tests
 *
 * USAGE:
 * FollowupChatStartResultStub();
 * // Returns a valid FollowupChatStartResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { followupChatStartResultContract } from './followup-chat-start-result-contract';
import type { FollowupChatStartResult } from './followup-chat-start-result-contract';

export const FollowupChatStartResultStub = ({
  ...props
}: StubArgument<FollowupChatStartResult> = {}): FollowupChatStartResult =>
  followupChatStartResultContract.parse({ chatProcessId: 'sample', ...props });
