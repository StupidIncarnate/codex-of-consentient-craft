import { frameworkPresetKeysStatics } from './framework-preset-keys-statics';

describe('frameworkPresetKeysStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(frameworkPresetKeysStatics).toStrictEqual({
      keys: {
        all: [
          'widgets',
          'bindings',
          'state',
          'flows',
          'responders',
          'contracts',
          'brokers',
          'transformers',
          'errors',
          'middleware',
          'adapters',
          'startup',
        ],
      },
    });
  });
});
