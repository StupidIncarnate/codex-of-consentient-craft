import { questFlowObservableSeedStatics } from './quest-flow-observable-seed-statics';

describe('questFlowObservableSeedStatics', () => {
  it('VALID: {observable} => holds the harness observable literals', () => {
    expect(questFlowObservableSeedStatics).toStrictEqual({
      observable: {
        id: 'harness-terminal-observable',
        type: 'ui-state',
        description: 'harness-seeded observable',
        package: 'auth-service',
      },
    });
  });
});
