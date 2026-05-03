import { projectMapHeadlineFrontendReactStatics } from './project-map-headline-frontend-react-statics';

describe('projectMapHeadlineFrontendReactStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineFrontendReactStatics).toStrictEqual({
      compositionSectionHeader: '## Widget composition',
      compositionSectionEmpty: '(no widgets found in this package)',
      hubsSectionHeader: '## Widget hubs (in-degree >= 5)',
      hubsSectionEmpty: '(no hubs — all widgets have in-degree < 5)',
      treeConnectors: {
        pipe: '│',
        branch: '├─',
        last: '└─',
        indent: '   ',
      },
      bindingsPrefix: '   bindings: ',
      bindingFlowLineSubIndent: '   ',
      httpMethodPadWidth: 6,
    });
  });
});
