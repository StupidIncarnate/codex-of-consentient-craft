import { installContextContract, type InstallContext } from './install-context-contract';

export const InstallContextStub = ({ value }: { value: unknown }): InstallContext =>
  installContextContract.parse(value);
