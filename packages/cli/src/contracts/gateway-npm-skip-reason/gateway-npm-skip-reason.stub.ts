import type { z } from '#gateway/npm/zod';

import {
  gatewayNpmSkipReasonContract,
  type GatewayNpmSkipReason,
} from './gateway-npm-skip-reason-contract';

type GatewayNpmSkipReasonInput = z.input<typeof gatewayNpmSkipReasonContract>;

export const GatewayNpmSkipReasonStub = ({
  value,
}: { value?: GatewayNpmSkipReasonInput } = {}): GatewayNpmSkipReason =>
  gatewayNpmSkipReasonContract.parse(value ?? 'version');
