import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orphanReadingContract } from './orphan-reading-contract';
import type { OrphanReading } from './orphan-reading-contract';

export const OrphanReadingStub = ({ ...props }: StubArgument<OrphanReading> = {}): OrphanReading =>
  orphanReadingContract.parse({
    pgid: 33_812,
    cmd: 'npm run dev:no-watch',
    alive: true,
    ...props,
  });
