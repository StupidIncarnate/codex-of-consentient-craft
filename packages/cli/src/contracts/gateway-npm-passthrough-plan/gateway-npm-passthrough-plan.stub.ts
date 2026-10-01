import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  gatewayNpmPassthroughPlanContract,
  type GatewayNpmPassthroughPlan,
} from './gateway-npm-passthrough-plan-contract';

export const GatewayNpmPassthroughPlanStub = ({
  ...props
}: StubArgument<GatewayNpmPassthroughPlan> = {}): GatewayNpmPassthroughPlan =>
  gatewayNpmPassthroughPlanContract.parse({
    dependency: { name: 'left-pad', range: '^1.3.0', folder: 'left-pad' },
    shape: 'named',
    ...props,
  });
