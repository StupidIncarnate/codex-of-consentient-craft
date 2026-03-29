/**
 * PURPOSE: Integration test verifying InstallFlow delegates to the config-create responder
 *
 * USAGE:
 * npm run ward -- --only test -- packages/mcp/src/flows/install/install-flow.integration.test.ts
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context: no existing config} => delegates to responder and creates .mcp.json', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-create-mcp-config' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });
      expect(configContent).toMatch(/^.*"dungeonmaster".*$/mu);
      expect(configContent).toMatch(/^.*"type": "stdio".*$/mu);
      expect(settingsContent).toMatch(/^.*mcp__dungeonmaster__get-architecture.*$/mu);
    });

    it('VALID: {context: config exists with dungeonmaster} => returns skipped', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-skip-mcp-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            mcpServers: {
              dungeonmaster: {
                type: 'stdio',
                command: 'npx',
                args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
              },
            },
          }),
        }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'skipped',
        message: 'MCP config already exists, added permissions',
      });
    });
  });
});
