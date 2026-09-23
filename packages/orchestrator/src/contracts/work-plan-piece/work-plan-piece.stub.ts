import type { StubArgument } from '@dungeonmaster/shared/@types';

import { WorkPlanPayloadCodeweaverStub } from '../work-plan-payload-codeweaver/work-plan-payload-codeweaver.stub';

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
    payload: WorkPlanPayloadCodeweaverStub(),
    ...props,
  });
