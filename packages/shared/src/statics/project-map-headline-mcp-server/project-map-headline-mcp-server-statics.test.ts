import { projectMapHeadlineMcpServerStatics } from './project-map-headline-mcp-server-statics';

describe('projectMapHeadlineMcpServerStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineMcpServerStatics).toStrictEqual({
      toolNamePadWidth: 28,
      toolsSectionHeader: '## Tools — every MCP tool',
      toolsSectionDescription:
        'Exhaustive: every MCP tool the server registers is listed below. Each section header names the flow file where the tools are registered.',
      toolsSectionEmpty: '(no tools found in this package)',
    });
  });
});
