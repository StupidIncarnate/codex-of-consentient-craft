import { projectMapHeadlineFrontendReactStatics } from './project-map-headline-frontend-react-statics';

describe('projectMapHeadlineFrontendReactStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineFrontendReactStatics).toStrictEqual({
      compositionSectionHeader: '## Widget composition',
      compositionSectionEmpty: '(no widgets found in this package)',
      hubsSectionHeader: '## Widget hubs (in-degree >= 5)',
      hubsSectionEmpty: '(no hubs — all widgets have in-degree < 5)',
      exemplarSectionHeader: '## Detailed exemplar — one user interaction',
      exemplarSectionEmpty: '(no widget with bindings found — exemplar omitted)',
      treeConnectors: {
        pipe: '│',
        branch: '├─',
        last: '└─',
        indent: '   ',
      },
      bindingsPrefix: '   bindings: ',
      exemplarStepLabels: {
        click: '[click handler in widget]',
        broker: '[broker fired from event handler]',
        httpWire: '[HTTP → server]',
        stateWrite: '[state write]',
        rerender: '[binding re-renders widget]',
      },
      boundaryBoxLabel: 'web → server (HTTP)',
      boundaryBoxPadding: 20,
    });
  });
});
