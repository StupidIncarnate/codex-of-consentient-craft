import { OrchestrationEventsStateModuleStub } from '../../contracts/orchestration-events-state-module/orchestration-events-state-module.stub';
import { orchestrationEventsStateExtractTransformer } from './orchestration-events-state-extract-transformer';

describe('orchestrationEventsStateExtractTransformer', (): void => {
  it('VALID: {stubbed module} => returns the inner facade with on/off methods', (): void => {
    const facade = orchestrationEventsStateExtractTransformer({
      rawModule: OrchestrationEventsStateModuleStub(),
    });

    expect(facade.on()).toBe(undefined);
    expect(facade.off()).toBe(undefined);
  });

  it('ERROR: {missing inner export} => throws', (): void => {
    expect((): unknown => orchestrationEventsStateExtractTransformer({ rawModule: {} })).toThrow(
      /Required/u,
    );
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => orchestrationEventsStateExtractTransformer({ rawModule: 42 })).toThrow(
      /Expected object/u,
    );
  });
});
