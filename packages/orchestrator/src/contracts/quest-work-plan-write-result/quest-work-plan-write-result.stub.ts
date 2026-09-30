/**
 * PURPOSE: Builds a valid QuestWorkPlanWriteResult for tests
 *
 * USAGE:
 * QuestWorkPlanWriteResultStub();
 * // Returns a valid QuestWorkPlanWriteResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OperationItemStub } from '@dungeonmaster/shared/contracts/operation-item/operation-item.stub';

import { questWorkPlanWriteResultContract } from './quest-work-plan-write-result-contract';
import type { QuestWorkPlanWriteResult } from './quest-work-plan-write-result-contract';

export const QuestWorkPlanWriteResultStub = ({
  ...props
}: StubArgument<QuestWorkPlanWriteResult> = {}): QuestWorkPlanWriteResult =>
  questWorkPlanWriteResultContract.parse({ operationItemId: OperationItemStub().id, ...props });
