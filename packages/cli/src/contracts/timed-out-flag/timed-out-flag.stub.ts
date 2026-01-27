import { timedOutFlagContract, type TimedOutFlag } from './timed-out-flag-contract';

export const TimedOutFlagStub = ({ value = false }: { value?: boolean } = {}): TimedOutFlag =>
  timedOutFlagContract.parse(value);
