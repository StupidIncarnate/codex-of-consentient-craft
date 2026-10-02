import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  gatewayNpmDependencyContract,
  type GatewayNpmDependency,
} from './gateway-npm-dependency-contract';

export const GatewayNpmDependencyStub = ({
  ...props
}: StubArgument<GatewayNpmDependency> = {}): GatewayNpmDependency =>
  gatewayNpmDependencyContract.parse({
    name: 'left-pad',
    range: '^1.3.0',
    folder: 'left-pad',
    location: 'dependencies',
    ...props,
  });
