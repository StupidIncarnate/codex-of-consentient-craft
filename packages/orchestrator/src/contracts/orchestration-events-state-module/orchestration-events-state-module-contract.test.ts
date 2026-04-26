import { orchestrationEventsStateModuleContract } from './orchestration-events-state-module-contract';
import { OrchestrationEventsStateModuleStub } from './orchestration-events-state-module.stub';

describe('orchestrationEventsStateModuleContract', (): void => {
  it('VALID: {default stub} => parses with on/off as functions on facade', (): void => {
    const mod = OrchestrationEventsStateModuleStub();

    expect(mod.orchestrationEventsState.on()).toBe(undefined);
  });

  it('ERROR: {missing orchestrationEventsState} => throws', (): void => {
    expect((): unknown => orchestrationEventsStateModuleContract.parse({})).toThrow(/Required/u);
  });

  it('ERROR: {non-object module} => throws', (): void => {
    expect((): unknown => orchestrationEventsStateModuleContract.parse('foo')).toThrow(
      /Expected object/u,
    );
  });

  it('VALID: {extra exports} => preserved via passthrough', (): void => {
    const mod = orchestrationEventsStateModuleContract.parse({
      orchestrationEventsState: { on: () => {}, off: () => {} },
      otherExport: 'value',
    });

    expect((mod as { otherExport?: unknown }).otherExport).toBe('value');
  });
});
