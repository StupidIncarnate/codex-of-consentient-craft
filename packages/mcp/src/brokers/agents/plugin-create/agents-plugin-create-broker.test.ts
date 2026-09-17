import { PathSegmentStub as FilePathStub } from '@dungeonmaster/shared/contracts';
import { mcpServerStatics } from '../../../statics/mcp-server/mcp-server-statics';
import { agentsPluginCreateBrokerProxy } from './agents-plugin-create-broker.proxy';

describe('agentsPluginCreateBroker', () => {
  it('VALID: {targetProjectRoot} => creates plugin.json and mcp_config.json under .agents/plugins/dungeonmaster', async () => {
    const proxy = agentsPluginCreateBrokerProxy();
    const targetProjectRoot = FilePathStub({ value: '/project' });

    proxy.setupSuccess({ targetProjectRoot });

    const result = await proxy.callBroker({ targetProjectRoot });

    expect(result).toStrictEqual({ success: true });

    const writtenPlugin = JSON.parse(
      String(proxy.getWrittenPluginJson({ targetProjectRoot })),
    ) as Record<PropertyKey, unknown>;

    expect(writtenPlugin).toStrictEqual({
      name: 'dungeonmaster',
    });

    const writtenMcpConfig = JSON.parse(
      String(proxy.getWrittenMcpConfigJson({ targetProjectRoot })),
    ) as Record<PropertyKey, unknown>;

    expect(writtenMcpConfig).toStrictEqual({
      mcpServers: {
        dungeonmaster: {
          command: 'node',
          args: ['-e', mcpServerStatics.resolveScript],
        },
      },
    });
  });
});
