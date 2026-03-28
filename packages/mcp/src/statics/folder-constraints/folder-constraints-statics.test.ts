import { folderConstraintsStatics } from './folder-constraints-statics';

describe('folderConstraintsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(folderConstraintsStatics).toStrictEqual({
      adapters: 'adapters-constraints.md',
      bindings: 'bindings-constraints.md',
      brokers: 'brokers-constraints.md',
      contracts: 'contracts-constraints.md',
      errors: 'errors-constraints.md',
      flows: 'flows-constraints.md',
      guards: 'guards-constraints.md',
      middleware: 'middleware-constraints.md',
      responders: 'responders-constraints.md',
      state: 'state-constraints.md',
      statics: 'statics-constraints.md',
      startup: 'startup-constraints.md',
      transformers: 'transformers-constraints.md',
      widgets: 'widgets-constraints.md',
    });
  });
});
