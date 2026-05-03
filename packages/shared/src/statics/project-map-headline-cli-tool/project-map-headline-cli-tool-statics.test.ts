import { projectMapHeadlineCliToolStatics } from './project-map-headline-cli-tool-statics';

describe('projectMapHeadlineCliToolStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineCliToolStatics).toStrictEqual({
      commandNamePadWidth: 28,
      subcommandsSectionHeader: '## Subcommands',
      subcommandsSectionDescription:
        'Each row maps a CLI subcommand literal to the responder or flow file that handles it.',
      subcommandsSectionEmpty: '(no subcommands detected in this package)',
    });
  });
});
