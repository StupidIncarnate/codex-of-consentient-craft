import { orchestrationEventsStateFacadeContract } from './orchestration-events-state-facade-contract';
import { OrchestrationEventsStateFacadeStub } from './orchestration-events-state-facade.stub';

describe('orchestrationEventsStateFacadeContract', (): void => {
  it('VALID: {default stub} => on returns undefined when called with empty params', (): void => {
    const facade = OrchestrationEventsStateFacadeStub();

    expect(facade.on()).toBe(undefined);
  });

  it('VALID: {real on/off arrow functions} => off returns undefined', (): void => {
    const facade = orchestrationEventsStateFacadeContract.parse({
      on: () => {},
      off: () => {},
    });

    expect(facade.off()).toBe(undefined);
  });

  it('ERROR: {non-function on} => throws', (): void => {
    expect((): unknown =>
      orchestrationEventsStateFacadeContract.parse({ on: 'nope', off: () => {} }),
    ).toThrow(/Expected function/u);
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => orchestrationEventsStateFacadeContract.parse('foo')).toThrow(
      /Expected object/u,
    );
  });
});
