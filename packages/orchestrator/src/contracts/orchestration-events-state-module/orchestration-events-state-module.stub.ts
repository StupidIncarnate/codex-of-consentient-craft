import type { StubArgument } from '@dungeonmaster/shared/@types';

import { OrchestrationEventsStateFacadeStub } from '../orchestration-events-state-facade/orchestration-events-state-facade.stub';
import { orchestrationEventsStateModuleContract } from './orchestration-events-state-module-contract';
import type { OrchestrationEventsStateModule } from './orchestration-events-state-module-contract';

/**
 * Default stub — module wrapper around the no-op facade stub. Tests rarely need to override.
 */
export const OrchestrationEventsStateModuleStub = ({
  ...props
}: StubArgument<OrchestrationEventsStateModule> = {}): OrchestrationEventsStateModule => {
  const { orchestrationEventsState, ...dataProps } = props;

  return {
    // `orchestrationEventsState` is a REQUIRED field on the schema, so `.parse()` needs SOME value
    // for it even though the real one is substituted right after — an empty object satisfies the
    // schema's own `type: 'object'` check, and the facade stub below replaces it either way.
    ...orchestrationEventsStateModuleContract.parse({ orchestrationEventsState: {}, ...dataProps }),
    // Routed through the facade's OWN stub rather than a bare `?? OrchestrationEventsStateFacadeStub()`
    // fallback — `StubArgument` recurses into a nested object field, so a PARTIALLY overridden
    // `orchestrationEventsState` (e.g. `{ on: customFn }` alone) still needs its own `off` default,
    // which only the facade stub's own merge logic supplies.
    orchestrationEventsState: OrchestrationEventsStateFacadeStub(orchestrationEventsState),
  };
};
