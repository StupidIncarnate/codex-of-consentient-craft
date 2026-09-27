import type { StubArgument } from '../../@types/stub-argument.type';

import { qaWalkPathContract } from './qa-walk-path-contract';
import type { QaWalkPath } from './qa-walk-path-contract';

export const QaWalkPathStub = ({ ...props }: StubArgument<QaWalkPath> = {}): QaWalkPath =>
  qaWalkPathContract.parse({
    nodeIds: ['queue-has-entries', 'toolbar-visible', 'click-send-batch', 'batch-sent'],
    branchLabels: ['1 or more queued', 'clicks send'],
    exitsFlow: false,
    ...props,
  });
