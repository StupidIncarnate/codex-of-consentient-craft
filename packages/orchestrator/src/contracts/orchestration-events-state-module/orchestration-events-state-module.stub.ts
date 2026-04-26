import type { StubArgument } from '@dungeonmaster/shared/@types';

import { OrchestrationEventsStateFacadeStub } from '../orchestration-events-state-facade/orchestration-events-state-facade.stub';
import { orchestrationEventsStateModuleContract } from './orchestration-events-state-module-contract';
import type { OrchestrationEventsStateModule } from './orchestration-events-state-module-contract';

/**
 * Default stub — module wrapper around the no-op facade stub. Tests rarely need to override.
 */
export const OrchestrationEventsStateModuleStub = ({
  ...props
}: StubArgument<OrchestrationEventsStateModule> = {}): OrchestrationEventsStateModule =>
  orchestrationEventsStateModuleContract.parse({
    orchestrationEventsState: OrchestrationEventsStateFacadeStub(),
    ...props,
  });
