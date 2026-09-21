import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workPlanValidationFailureContract } from './work-plan-validation-failure-contract';
import type { WorkPlanValidationFailure } from './work-plan-validation-failure-contract';

export const WorkPlanValidationFailureStub = ({
  ...props
}: StubArgument<WorkPlanValidationFailure> = {}): WorkPlanValidationFailure =>
  workPlanValidationFailureContract.parse({
    pieceId: 'pc-scan',
    check: 5,
    message: "pc-scan: assigned unit 'flow-send:observable:x' is not in scope for operation item",
    ...props,
  });
