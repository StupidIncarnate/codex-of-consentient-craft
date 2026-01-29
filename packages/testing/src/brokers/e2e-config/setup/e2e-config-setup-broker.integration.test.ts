import { e2eConfigSetupBroker } from './e2e-config-setup-broker';
import { installTestbedCreateBroker } from '../../install-testbed/create/install-testbed-create-broker';
import { BaseNameStub } from '../../../contracts/base-name/base-name.stub';

describe('e2eConfigSetupBroker', () => {
  it('VALID: {projectPath, dungeonmasterPath} => creates .mcp.json', () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'e2e-config-test' }),
    });
    const expectedMcpPath = `${testbed.dungeonmasterPath}/packages/mcp/src/index.ts`;

    e2eConfigSetupBroker({
      projectPath: testbed.projectPath,
      dungeonmasterPath: testbed.dungeonmasterPath,
    });

    const mcpConfig = testbed.getMcpConfig();
    testbed.cleanup();

    expect(mcpConfig).toStrictEqual({
      mcpServers: {
        dungeonmaster: {
          type: 'stdio',
          command: 'npx',
          args: ['tsx', expectedMcpPath],
        },
      },
    });
  });

  it('VALID: {projectPath, dungeonmasterPath} => creates .claude/settings.json', () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'e2e-config-settings' }),
    });

    e2eConfigSetupBroker({
      projectPath: testbed.projectPath,
      dungeonmasterPath: testbed.dungeonmasterPath,
    });

    const claudeSettings = testbed.getClaudeSettings();
    testbed.cleanup();

    expect(claudeSettings).toStrictEqual({
      permissions: {
        allow: ['mcp__dungeonmaster__*', 'Bash(npx tsx:*)'],
        deny: [],
      },
    });
  });

  it('VALID: {projectPath, dungeonmasterPath} => creates .dungeonmaster config', () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'e2e-config-dm' }),
    });

    e2eConfigSetupBroker({
      projectPath: testbed.projectPath,
      dungeonmasterPath: testbed.dungeonmasterPath,
    });

    const dmConfig = testbed.getDungeonmasterConfig();
    testbed.cleanup();

    expect(dmConfig).toStrictEqual({
      questFolder: '.dungeonmaster-quests',
      wardCommands: {},
    });
  });
});
