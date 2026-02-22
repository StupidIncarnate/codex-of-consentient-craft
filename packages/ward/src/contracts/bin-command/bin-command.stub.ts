import { binCommandContract, type BinCommand } from './bin-command-contract';

export const BinCommandStub = ({
  value = '/project/node_modules/.bin/eslint',
}: { value?: string } = {}): BinCommand => binCommandContract.parse(value);
