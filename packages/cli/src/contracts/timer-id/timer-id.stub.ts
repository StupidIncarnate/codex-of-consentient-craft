import { timerIdContract } from './timer-id-contract';
import type { TimerId } from './timer-id-contract';

const STUB_TIMER_ID = 12345;

export const TimerIdStub = ({ value }: { value: unknown } = { value: STUB_TIMER_ID }): TimerId =>
  timerIdContract.parse(value);
