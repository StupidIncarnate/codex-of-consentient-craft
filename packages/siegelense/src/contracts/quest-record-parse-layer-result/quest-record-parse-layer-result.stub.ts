/**
 * PURPOSE: Builds a valid QuestRecordParseLayerResult for tests
 *
 * USAGE:
 * QuestRecordParseLayerResultStub();
 * // Returns a valid QuestRecordParseLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questRecordParseLayerResultContract } from './quest-record-parse-layer-result-contract';
import type { QuestRecordParseLayerResult } from './quest-record-parse-layer-result-contract';

export const QuestRecordParseLayerResultStub = ({
  ...props
}: StubArgument<QuestRecordParseLayerResult> = {}): QuestRecordParseLayerResult =>
  questRecordParseLayerResultContract.parse({ quest: QuestStub(), blocked: 'sample', ...props });
