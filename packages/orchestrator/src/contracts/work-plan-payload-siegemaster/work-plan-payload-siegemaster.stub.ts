import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workPlanPayloadSiegemasterContract } from './work-plan-payload-siegemaster-contract';
import type { WorkPlanPayloadSiegemaster } from './work-plan-payload-siegemaster-contract';

export const WorkPlanPayloadSiegemasterStub = ({
  ...props
}: StubArgument<WorkPlanPayloadSiegemaster> = {}): WorkPlanPayloadSiegemaster =>
  workPlanPayloadSiegemasterContract.parse({
    path: {
      nodeIds: ['queue-has-entries', 'toolbar-visible', 'click-send-batch', 'batch-sent'],
      branchLabels: ['1 or more queued', 'clicks send'],
      exitsFlow: false,
    },
    offMapFamily: 'hostile-input',
    ...props,
  });
