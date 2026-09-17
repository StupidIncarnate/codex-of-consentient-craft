import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { agentsHooksCreatorTransformer } from '../../../transformers/agents-hooks-creator/agents-hooks-creator-transformer';
import { agentsRulesCreatorTransformer } from '../../../transformers/agents-rules-creator/agents-rules-creator-transformer';
import { agentsMdCreatorTransformer } from '../../../transformers/agents-md-creator/agents-md-creator-transformer';
import { installAgentsSetupBroker } from './install-agents-setup-broker';
import { installAgentsSetupBrokerProxy } from './install-agents-setup-broker.proxy';

const JSON_INDENT_SPACES = 2;

describe('installAgentsSetupBroker', () => {
  it('VALID: creates .agents files, plugin rules, and writes AGENTS.md when CLAUDE.md exists', async () => {
    const proxy = installAgentsSetupBrokerProxy();
    const targetProjectRoot = FilePathStub({ value: '/test/repo' });
    proxy.setupSuccess({ targetProjectRoot });

    const claudeMdPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.claudeMd}`,
    });
    const agentsMdPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.agentsMd}`,
    });

    proxy.setupFileExists({ filePath: claudeMdPath, exists: true });
    proxy.setupFileExists({ filePath: agentsMdPath, exists: false });

    const result = await installAgentsSetupBroker({ targetProjectRoot });

    expect(result).toStrictEqual({ success: true });

    const hooksPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.agents.dir}/${locationsStatics.repoRoot.agents.hooksJson}`,
    });
    const writtenHooks = proxy.getWrittenFor({ filepath: hooksPath });

    expect(writtenHooks).toBe(
      JSON.stringify(agentsHooksCreatorTransformer(), null, JSON_INDENT_SPACES),
    );

    const rulesPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.agents.dir}/${locationsStatics.repoRoot.agents.pluginsDir}/${mcpToolsStatics.server.name}/${locationsStatics.repoRoot.agents.rulesDir}/${locationsStatics.repoRoot.agentsMd}`,
    });
    const writtenRules = proxy.getWrittenFor({ filepath: rulesPath });

    expect(writtenRules).toBe(agentsRulesCreatorTransformer());

    const writtenAgentsMd = proxy.getWrittenFor({ filepath: agentsMdPath });

    expect(writtenAgentsMd).toBe(agentsMdCreatorTransformer());
  });

  it('VALID: skips writing AGENTS.md when AGENTS.md already exists', async () => {
    const proxy = installAgentsSetupBrokerProxy();
    const targetProjectRoot = FilePathStub({ value: '/test/repo' });
    proxy.setupSuccess({ targetProjectRoot });

    const claudeMdPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.claudeMd}`,
    });
    const agentsMdPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.agentsMd}`,
    });

    proxy.setupFileExists({ filePath: claudeMdPath, exists: true });
    proxy.setupFileExists({ filePath: agentsMdPath, exists: true });

    const result = await installAgentsSetupBroker({ targetProjectRoot });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getWrittenFor({ filepath: agentsMdPath })).toBe(undefined);
  });

  it('VALID: skips writing AGENTS.md when CLAUDE.md does not exist', async () => {
    const proxy = installAgentsSetupBrokerProxy();
    const targetProjectRoot = FilePathStub({ value: '/test/repo' });
    proxy.setupSuccess({ targetProjectRoot });

    const claudeMdPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.claudeMd}`,
    });
    const agentsMdPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.agentsMd}`,
    });

    proxy.setupFileExists({ filePath: claudeMdPath, exists: false });
    proxy.setupFileExists({ filePath: agentsMdPath, exists: false });

    const result = await installAgentsSetupBroker({ targetProjectRoot });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getWrittenFor({ filepath: agentsMdPath })).toBe(undefined);
  });
});
