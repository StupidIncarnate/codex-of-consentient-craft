import type { StubArgument } from '@dungeonmaster/shared/@types';
import { gatewayLintConfigFileContract } from './gateway-lint-config-file-contract';
import type { GatewayLintConfigFile } from './gateway-lint-config-file-contract';

export const GatewayLintConfigFileStub = ({
  ...props
}: StubArgument<GatewayLintConfigFile> = {}): GatewayLintConfigFile =>
  gatewayLintConfigFileContract.parse({ ...props });
