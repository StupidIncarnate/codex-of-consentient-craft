import type { StubArgument } from '../../@types/stub-argument.type';
import { gatewayLintConfigContract, type GatewayLintConfig } from './gateway-lint-config-contract';

export const GatewayLintConfigStub = ({
  ...props
}: StubArgument<GatewayLintConfig> = {}): GatewayLintConfig =>
  gatewayLintConfigContract.parse({
    ...props,
  });
