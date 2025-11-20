import { commandNameContract, type CommandName } from './command-name-contract';

export const CommandNameStub = ({ value }: { value: string } = { value: 'test' }): CommandName =>
  commandNameContract.parse(value);
