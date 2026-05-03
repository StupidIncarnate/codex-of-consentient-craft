import { projectMapHeadlineHookHandlersStatics } from './project-map-headline-hook-handlers-statics';

describe('projectMapHeadlineHookHandlersStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineHookHandlersStatics).toStrictEqual({
      binNamePadWidth: 40,
      hooksSectionHeader: '## Hooks',
      hooksSectionDescription:
        'Each row maps a bin script name to the responder it invokes. Detected spawn and fs-write effects are shown as indented annotations.',
      hooksSectionEmpty: '(no bin entries found in this package)',
      spawnAnnotationPrefix: '  → spawn: ',
      fsWriteAnnotationPrefix: '  → fs writes: ',
    });
  });
});
