import { orchestrationEventsStateFacadeContract } from './orchestration-events-state-facade-contract';
import type { OrchestrationEventsStateFacade } from './orchestration-events-state-facade-contract';
import { OrchestrationEventsStateFacadeStub } from './orchestration-events-state-facade.stub';

describe('orchestrationEventsStateFacadeContract', (): void => {
  it('VALID: {default stub} => on returns undefined when called with empty params', (): void => {
    const facade = OrchestrationEventsStateFacadeStub();

    expect(facade.on()).toBe(undefined);
  });

  it('VALID: {real on/off arrow functions} => off returns undefined', (): void => {
    // `.loose()` infers `{[x: string]: unknown}` — `on`/`off` live outside the schema (see the
    // contract's own header), so this cast asserts what this test itself supplied above.
    const facade = orchestrationEventsStateFacadeContract.parse({
      on: () => {},
      off: () => {},
    }) as OrchestrationEventsStateFacade;

    expect(facade.off()).toBe(undefined);
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => orchestrationEventsStateFacadeContract.parse('foo')).toThrow(
      /expected object, received string/u,
    );
  });
});
