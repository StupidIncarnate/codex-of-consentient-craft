/**
 * PURPOSE: Builds a valid QuestGetQaChecklistResult for tests
 *
 * USAGE:
 * QuestGetQaChecklistResultStub();
 * // Returns a valid QuestGetQaChecklistResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questGetQaChecklistResultContract } from './quest-get-qa-checklist-result-contract';
import type { QuestGetQaChecklistResult } from './quest-get-qa-checklist-result-contract';

export const QuestGetQaChecklistResultStub = ({
  ...props
}: StubArgument<QuestGetQaChecklistResult> = {}): QuestGetQaChecklistResult =>
  questGetQaChecklistResultContract.parse({ checklists: [], ...props });
