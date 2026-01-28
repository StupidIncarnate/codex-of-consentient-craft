import { keyNameContract } from './key-name-contract';
import type { KeyName } from './key-name-contract';

export const KeyNameStub = ({ value }: { value: string } = { value: 'enter' }): KeyName =>
  keyNameContract.parse(value);
