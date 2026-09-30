import type { StubArgument } from '../../@types/stub-argument.type';

import { workPlanPieceContract } from './work-plan-piece-contract';
import type { WorkPlanPiece } from './work-plan-piece-contract';

export const WorkPlanPieceStub = ({ ...props }: StubArgument<WorkPlanPiece> = {}): WorkPlanPiece =>
  workPlanPieceContract.parse({
    id: 'pc-badge',
    pieceName: 'comment count badge',
    step: 'work',
    assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
    contextUnitIds: ['send-flow:terminal:batch-sent'],
    context: 'the badge counts PERSISTED comments, never the queued ones',
    notes: ['the widget already exists — this piece only changes what it counts'],
    payload: {
      files: [
        {
          path: './packages/web/src/widgets/comment-badge/comment-badge-widget.tsx',
          change: 'new',
          in: '{ count: number }',
          out: 'ReactElement',
        },
        {
          path: './packages/web/src/widgets/comment-badge/comment-badge-widget.test.tsx',
          change: 'new',
          in: '{ count: number }',
          out: 'void',
          proves: ['send-flow:observable:check-badge-count-text'],
        },
      ],
      facts: ['COMMENT_COUNT_BADGE is already the testid every widget test filters on'],
      fences: ['this piece owns packages/web only'],
      traps: ['the badge counts PERSISTED comments, not queued ones'],
      doNotTouch: ['packages/server/src/responders/comment/batch'],
      units: [
        {
          unitId: 'send-flow:observable:check-badge-count-text',
          kind: 'observable',
          observableType: 'ui-state',
          text: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
          assert: 'render the widget with two persisted comments and read the badge text',
          failsIf: 'the badge reads 0 while two comments are persisted',
        },
      ],
    },
    ...props,
  });
