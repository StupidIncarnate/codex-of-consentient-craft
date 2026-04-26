import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationEventsStateFacadeContract } from './orchestration-events-state-facade-contract';
import type { OrchestrationEventsStateFacade } from './orchestration-events-state-facade-contract';

const noop = (): void => {};

/**
 * Default stub — no-op on/off methods. Tests typically replace via `props` or rely on the
 * real singleton resolved at runtime via `require`.
 */
export const OrchestrationEventsStateFacadeStub = ({
  ...props
}: StubArgument<OrchestrationEventsStateFacade> = {}): OrchestrationEventsStateFacade =>
  orchestrationEventsStateFacadeContract.parse({
    on: noop,
    off: noop,
    ...props,
  });
