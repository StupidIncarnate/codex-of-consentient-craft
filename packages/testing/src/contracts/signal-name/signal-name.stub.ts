import { signalNameContract, type SignalName } from './signal-name-contract';

export const SignalNameStub = ({ value }: { value: string } = { value: 'SIGTERM' }): SignalName =>
  signalNameContract.parse(value);
