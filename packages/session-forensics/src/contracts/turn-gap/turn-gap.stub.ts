import { turnGapContract, type TurnGap } from './turn-gap-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TurnGapStub = ({ ...props }: StubArgument<TurnGap> = {}): TurnGap =>
  turnGapContract.parse({
    gapStartedAt: '2026-09-01T19:09:06.542Z',
    elapsedMinutes: 42.5,
    gapSeconds: 180,
    ...props,
  });
