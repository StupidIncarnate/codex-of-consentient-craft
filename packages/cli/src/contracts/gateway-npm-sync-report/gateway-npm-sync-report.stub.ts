import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  gatewayNpmSyncReportContract,
  type GatewayNpmSyncReport,
} from './gateway-npm-sync-report-contract';

export const GatewayNpmSyncReportStub = ({
  ...props
}: StubArgument<GatewayNpmSyncReport> = {}): GatewayNpmSyncReport =>
  gatewayNpmSyncReportContract.parse({
    copied: [],
    generated: [],
    untyped: [],
    esmOnly: [],
    ...props,
  });
