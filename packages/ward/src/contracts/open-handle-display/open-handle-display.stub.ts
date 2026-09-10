import { openHandleDisplayContract } from './open-handle-display-contract';
import type { OpenHandleDisplay } from './open-handle-display-contract';

export const OpenHandleDisplayStub = (
  { value }: { value: string } = {
    value: '  ward  setInterval still armed when src/poll.test.ts finished\n      at a (a.ts:1:1)',
  },
): OpenHandleDisplay => openHandleDisplayContract.parse(value);
