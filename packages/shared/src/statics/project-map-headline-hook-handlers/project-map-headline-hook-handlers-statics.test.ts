import { projectMapHeadlineHookHandlersStatics } from './project-map-headline-hook-handlers-statics';

describe('projectMapHeadlineHookHandlersStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineHookHandlersStatics).toStrictEqual({
      binNamePadWidth: 40,
      hooksSectionHeader: '## Hooks',
      hooksSectionDescription:
        'Each row maps a bin script name to the responder it invokes. Detected spawn and fs-write effects are shown as indented annotations.',
      hooksSectionEmpty: '(no bin entries found in this package)',
      exemplarSectionPrefix: '## Detailed exemplar — `',
      exemplarSectionSuffix: '`',
      exemplarDescription:
        'This section traces one hook invocation end-to-end: stdin JSON event → startup → flow → responder → adapter calls → exit code.',
      exemplarRequestChainHeader: '### Call trace',
      spawnAnnotationPrefix: '  → spawn: ',
      fsWriteAnnotationPrefix: '  → fs writes: ',
      boundaryBoxInnerWidth: 56,
      boundaryBoxPad: 2,
      genericBoundaryBoxLabel: 'BOUNDARY →',
      genericBoundaryBoxNote: '(cross-package adapter call)',
      genericBoundaryBoxFill: '═',
      genericBoundaryBoxCornerTL: '╔',
      genericBoundaryBoxCornerTR: '╗',
      genericBoundaryBoxCornerBL: '╚',
      genericBoundaryBoxCornerBR: '╝',
      genericBoundaryBoxSide: '║',
      genericBoundaryBoxIndent: '      ',
    });
  });
});
