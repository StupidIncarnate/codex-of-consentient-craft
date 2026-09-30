/**
 * PURPOSE: Builds a valid QuestChatResult for tests
 *
 * USAGE:
 * QuestChatResultStub();
 * // Returns a valid QuestChatResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questChatResultContract } from './quest-chat-result-contract';
import type { QuestChatResult } from './quest-chat-result-contract';

export const QuestChatResultStub = ({
  ...props
}: StubArgument<QuestChatResult> = {}): QuestChatResult =>
  questChatResultContract.parse({ chatProcessId: 'sample', ...props });
