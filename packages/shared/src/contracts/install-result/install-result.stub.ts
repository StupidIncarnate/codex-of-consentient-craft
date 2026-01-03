import { installResultContract, type InstallResult } from './install-result-contract';

export const InstallResultStub = ({ value }: { value: unknown }): InstallResult =>
  installResultContract.parse(value);
