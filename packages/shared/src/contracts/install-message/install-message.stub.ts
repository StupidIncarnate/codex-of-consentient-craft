import { installMessageContract, type InstallMessage } from './install-message-contract';

export const InstallMessageStub = ({ value }: { value: unknown }): InstallMessage =>
  installMessageContract.parse(value);
