import type { StubArgument } from '@dungeonmaster/shared/@types';

import { debugSessionBrokerParamsContract } from './debug-session-broker-params-contract';
import type { DebugSessionBrokerParams } from './debug-session-broker-params-contract';
import { CliAppScreenStub } from '../cli-app-screen/cli-app-screen.stub';
import { RenderCapabilitiesStub } from '../render-capabilities/render-capabilities.stub';

export const DebugSessionBrokerParamsStub = ({
  ...props
}: StubArgument<DebugSessionBrokerParams> = {}): DebugSessionBrokerParams =>
  debugSessionBrokerParamsContract.parse({
    onCommand: (): void => {
      // No-op
    },
    onResponse: (): void => {
      // No-op
    },
    renderCapabilities: RenderCapabilitiesStub(),
    initialScreen: CliAppScreenStub(),
    ...props,
  });
