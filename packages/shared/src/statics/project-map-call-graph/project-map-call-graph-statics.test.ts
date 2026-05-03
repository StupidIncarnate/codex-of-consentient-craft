import { projectMapCallGraphStatics } from './project-map-call-graph-statics';

describe('projectMapCallGraphStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapCallGraphStatics).toStrictEqual({
      excludedFolderTypes: ['contracts', 'transformers', 'guards', 'assets', 'statics', 'errors'],
      structuralFolderTypes: ['startup', 'flows', 'responders', 'widgets', 'bindings'],
    });
  });
});
