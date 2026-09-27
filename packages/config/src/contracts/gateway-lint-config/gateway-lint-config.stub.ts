import type { StubArgument } from '@dungeonmaster/shared/@types';
import { gatewayLintConfigContract, type GatewayLintConfig } from './gateway-lint-config-contract';

export const GatewayLintConfigStub = ({
  ...props
}: StubArgument<GatewayLintConfig> = {}): GatewayLintConfig =>
  gatewayLintConfigContract.parse({
    ...props,
  });
