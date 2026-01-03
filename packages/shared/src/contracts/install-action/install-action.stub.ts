import { installActionContract, type InstallAction } from './install-action-contract';

export const InstallActionStub = ({ value }: { value: unknown }): InstallAction =>
  installActionContract.parse(value);
