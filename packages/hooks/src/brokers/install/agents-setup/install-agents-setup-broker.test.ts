import { FilePathStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { installAgentsSetupBroker } from './install-agents-setup-broker';
import { installAgentsSetupBrokerProxy } from './install-agents-setup-broker.proxy';

describe('installAgentsSetupBroker', () => {
  it('VALID: creates .agents files and symlinks AGENTS.md -> CLAUDE.md when CLAUDE.md exists', async () => {
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
    proxy.setupSymlinkSuccess({
      target: PathSegmentStub({ value: locationsStatics.repoRoot.claudeMd }),
    });

    const result = await installAgentsSetupBroker({ targetProjectRoot });

    expect(result).toStrictEqual({ success: true });

    const hooksPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.agents.dir}/${locationsStatics.repoRoot.agents.hooksJson}`,
    });
    const writtenHooks = proxy.getWrittenFor({ filepath: hooksPath });
    expect(typeof writtenHooks).toBe('string');
    expect(writtenHooks).toContain('dungeonmaster-guard');

    const rulesPath = FilePathStub({
      value: `/test/repo/${locationsStatics.repoRoot.agents.dir}/${locationsStatics.repoRoot.agents.rulesDir}/${locationsStatics.repoRoot.agents.dungeonmasterRulesMd}`,
    });
    const writtenRules = proxy.getWrittenFor({ filepath: rulesPath });
    expect(typeof writtenRules).toBe('string');
    expect(writtenRules).toContain('Dungeonmaster Operating Rules');

    expect(proxy.getAllSymlinks()).toStrictEqual([
      {
        target: locationsStatics.repoRoot.claudeMd,
        linkPath: agentsMdPath,
      },
    ]);
  });

  it('VALID: skips symlink when AGENTS.md already exists', async () => {
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
    expect(proxy.getAllSymlinks()).toStrictEqual([]);
  });

  it('VALID: skips symlink when CLAUDE.md does not exist', async () => {
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
    expect(proxy.getAllSymlinks()).toStrictEqual([]);
  });
});
