/**
 * PURPOSE: Builds a valid QuestHumanVerdictRecordResult for tests
 *
 * USAGE:
 * QuestHumanVerdictRecordResultStub();
 * // Returns a valid QuestHumanVerdictRecordResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questHumanVerdictRecordResultContract } from './quest-human-verdict-record-result-contract';
import type { QuestHumanVerdictRecordResult } from './quest-human-verdict-record-result-contract';

export const QuestHumanVerdictRecordResultStub = ({
  ...props
}: StubArgument<QuestHumanVerdictRecordResult> = {}): QuestHumanVerdictRecordResult =>
  questHumanVerdictRecordResultContract.parse({ quest: QuestStub(), ...props });
