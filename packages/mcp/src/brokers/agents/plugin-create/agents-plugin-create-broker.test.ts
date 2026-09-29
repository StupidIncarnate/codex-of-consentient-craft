import { PathSegmentStub as FilePathStub } from '@dungeonmaster/shared/contracts/path-segment/path-segment.stub';
import { mcpServerStatics } from '../../../statics/mcp-server/mcp-server-statics';
import { agentsPluginCreateBrokerProxy } from './agents-plugin-create-broker.proxy';

describe('agentsPluginCreateBroker', () => {
  it('VALID: {targetProjectRoot} => creates plugin.json and mcp_config.json under .agents/plugins/dungeonmaster', async () => {
    const proxy = agentsPluginCreateBrokerProxy();
    const targetProjectRoot = FilePathStub({ value: '/project' });

    proxy.setupSuccess({ targetProjectRoot });

    await expect(proxy.callBroker({ targetProjectRoot })).resolves.toBe(undefined);

    const writtenPluginContent = String(proxy.getWrittenPluginJson({ targetProjectRoot }));
    const writtenPlugin = JSON.parse(writtenPluginContent) as Record<PropertyKey, unknown>;

    expect(writtenPlugin).toStrictEqual({
      name: 'dungeonmaster',
    });
    // String-exact: proves the write ends in one trailing newline.
    expect(writtenPluginContent).toBe('{\n  "name": "dungeonmaster"\n}\n');

    const writtenMcpConfigContent = String(proxy.getWrittenMcpConfigJson({ targetProjectRoot }));
    const writtenMcpConfig = JSON.parse(writtenMcpConfigContent) as Record<PropertyKey, unknown>;

    expect(writtenMcpConfig).toStrictEqual({
      mcpServers: {
        dungeonmaster: {
          command: 'node',
          args: ['-e', mcpServerStatics.resolveScript],
        },
      },
    });
    // String-exact: proves the write ends in one trailing newline.
    expect(writtenMcpConfigContent).toBe(
      `${JSON.stringify(
        {
          mcpServers: {
            dungeonmaster: {
              command: 'node',
              args: ['-e', mcpServerStatics.resolveScript],
            },
          },
        },
        null,
        2,
      )}\n`,
    );
  });
});
