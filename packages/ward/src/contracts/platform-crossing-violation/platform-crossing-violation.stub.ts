import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  platformCrossingViolationContract,
  type PlatformCrossingViolation,
} from './platform-crossing-violation-contract';

export const PlatformCrossingViolationStub = ({
  ...props
}: StubArgument<PlatformCrossingViolation> = {}): PlatformCrossingViolation =>
  platformCrossingViolationContract.parse({
    packageName: 'web',
    platform: 'browser',
    chain: ['@dungeonmaster/node/fs'],
    crossedGatewayPackage: '@dungeonmaster/node',
    ...props,
  });
