import type { StubArgument } from '../../@types/stub-argument.type';
import { gatewayLintConfigFileContract } from './gateway-lint-config-file-contract';
import type { GatewayLintConfigFile } from './gateway-lint-config-file-contract';

export const GatewayLintConfigFileStub = ({
  ...props
}: StubArgument<GatewayLintConfigFile> = {}): GatewayLintConfigFile =>
  gatewayLintConfigFileContract.parse({ ...props });
