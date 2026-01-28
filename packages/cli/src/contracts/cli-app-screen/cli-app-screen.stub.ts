import { cliAppScreenContract } from './cli-app-screen-contract';
import type { CliAppScreen } from './cli-app-screen-contract';

export const CliAppScreenStub = ({ value }: { value: string } = { value: 'menu' }): CliAppScreen =>
  cliAppScreenContract.parse(value);
