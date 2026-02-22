import { wardDetailInputContract } from './ward-detail-input-contract';
import type { WardDetailInput } from './ward-detail-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const WardDetailInputStub = ({
  ...props
}: StubArgument<WardDetailInput> = {}): WardDetailInput =>
  wardDetailInputContract.parse({
    runId: '1739625600000-a3f1',
    filePath: 'src/app.ts',
    ...props,
  });
