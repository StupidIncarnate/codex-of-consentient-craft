import { proxyPatternsStatics } from './proxy-patterns-statics';

describe('proxyPatternsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(proxyPatternsStatics).toStrictEqual({
      forbiddenWords: ['mock', 'stub', 'fake', 'spy', 'jest', 'dummy'],
      implementationSuffixes: [
        'Adapter',
        'Broker',
        'Transformer',
        'Guard',
        'Binding',
        'Widget',
        'Responder',
        'Middleware',
        'State',
        'Flow',
      ],
    });
  });
});
