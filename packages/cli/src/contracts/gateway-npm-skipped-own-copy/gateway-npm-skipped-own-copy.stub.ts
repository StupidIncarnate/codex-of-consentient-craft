import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  gatewayNpmSkippedOwnCopyContract,
  type GatewayNpmSkippedOwnCopy,
} from './gateway-npm-skipped-own-copy-contract';

export const GatewayNpmSkippedOwnCopyStub = ({
  ...props
}: StubArgument<GatewayNpmSkippedOwnCopy> = {}): GatewayNpmSkippedOwnCopy =>
  gatewayNpmSkippedOwnCopyContract.parse({
    name: 'zod',
    reason: 'version',
    ...props,
  });
