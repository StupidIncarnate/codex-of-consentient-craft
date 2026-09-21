import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workPlanPayloadFlowriderContract } from './work-plan-payload-flowrider-contract';
import type { WorkPlanPayloadFlowrider } from './work-plan-payload-flowrider-contract';

export const WorkPlanPayloadFlowriderStub = ({
  ...props
}: StubArgument<WorkPlanPayloadFlowrider> = {}): WorkPlanPayloadFlowrider =>
  workPlanPayloadFlowriderContract.parse({
    specPath: './packages/web/src/flows/send/send-batch.e2e.ts',
    mode: 'new',
    harnesses: [
      {
        path: './packages/web/test/harnesses/send/send.harness.ts',
        change: 'new',
        in: '{ page: Page }',
        out: 'SendHarness',
      },
    ],
    walk: {
      shape: 'journey',
      paths: [
        {
          nodeIds: ['queue-has-entries', 'toolbar-visible', 'click-send-batch', 'batch-sent'],
          branchLabels: ['1 or more queued', 'clicks send'],
          exitsFlow: false,
        },
      ],
      pathsTruncated: false,
    },
    units: [
      {
        unitId: 'send-flow:terminal:batch-sent',
        kind: 'terminal',
        layer: 'browser',
        observableTarget: { target: 'node', nodeId: 'batch-sent' },
        assert: 'the queue panel renders zero rows once the send resolves',
        failsIf: 'the panel still renders the sent rows',
      },
    ],
    facts: ['the send button carries testid PIXEL_BTN and the label SEND'],
    fences: ['this piece owns one spec file'],
    traps: ['the queue drains asynchronously — waiting on a timeout reads the pre-send state'],
    doNotTouch: ['packages/web/src/widgets/comment-badge'],
    ...props,
  });
