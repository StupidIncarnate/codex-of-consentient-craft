import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationEventsStateModuleContract } from './orchestration-events-state-module-contract';
import type { OrchestrationEventsStateModule } from './orchestration-events-state-module-contract';

const noop = (): void => {
  /* intentional no-op */
};

/**
 * Default stub — module wrapper around a facade whose `on`/`off` are no-ops. Tests rarely need to override.
 */
export const OrchestrationEventsStateModuleStub = ({
  ...props
}: StubArgument<OrchestrationEventsStateModule> = {}): OrchestrationEventsStateModule => {
  const { orchestrationEventsState, ...dataProps } = props;

  return orchestrationEventsStateModuleContract.parse({
    // Merged field by field: `StubArgument` recurses into a nested object, so a PARTIALLY
    // overridden `orchestrationEventsState` (e.g. `{ on: customFn }` alone) still needs its own
    // `off` default.
    orchestrationEventsState: { on: noop, off: noop, ...orchestrationEventsState },
    ...dataProps,
  });
};
