import { folderConstraintsStatics } from './folder-constraints-statics';

describe('folderConstraintsStatics', () => {
  it('VALID: has adapters mapping', () => {
    expect(folderConstraintsStatics.adapters).toBe('adapters-constraints.md');
  });

  it('VALID: has bindings mapping', () => {
    expect(folderConstraintsStatics.bindings).toBe('bindings-constraints.md');
  });

  it('VALID: has brokers mapping', () => {
    expect(folderConstraintsStatics.brokers).toBe('brokers-constraints.md');
  });

  it('VALID: has contracts mapping', () => {
    expect(folderConstraintsStatics.contracts).toBe('contracts-constraints.md');
  });

  it('VALID: has errors mapping', () => {
    expect(folderConstraintsStatics.errors).toBe('errors-constraints.md');
  });

  it('VALID: has flows mapping', () => {
    expect(folderConstraintsStatics.flows).toBe('flows-constraints.md');
  });

  it('VALID: has guards mapping', () => {
    expect(folderConstraintsStatics.guards).toBe('guards-constraints.md');
  });

  it('VALID: has middleware mapping', () => {
    expect(folderConstraintsStatics.middleware).toBe('middleware-constraints.md');
  });

  it('VALID: has responders mapping', () => {
    expect(folderConstraintsStatics.responders).toBe('responders-constraints.md');
  });

  it('VALID: has state mapping', () => {
    expect(folderConstraintsStatics.state).toBe('state-constraints.md');
  });

  it('VALID: has statics mapping', () => {
    expect(folderConstraintsStatics.statics).toBe('statics-constraints.md');
  });

  it('VALID: has startup mapping', () => {
    expect(folderConstraintsStatics.startup).toBe('startup-constraints.md');
  });

  it('VALID: has transformers mapping', () => {
    expect(folderConstraintsStatics.transformers).toBe('transformers-constraints.md');
  });

  it('VALID: has widgets mapping', () => {
    expect(folderConstraintsStatics.widgets).toBe('widgets-constraints.md');
  });

  it('VALID: all filenames end with -constraints.md', () => {
    const filenames = Object.values(folderConstraintsStatics);
    const allMatch = filenames.every((filename) => filename.endsWith('-constraints.md'));

    expect(allMatch).toBe(true);
  });

  it('VALID: has 14 folder type mappings', () => {
    const keys = Object.keys(folderConstraintsStatics);

    expect(keys).toHaveLength(14);
  });
});
