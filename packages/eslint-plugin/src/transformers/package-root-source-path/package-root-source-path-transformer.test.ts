import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { packageRootSourcePathTransformer } from './package-root-source-path-transformer';

describe('packageRootSourcePathTransformer', () => {
  it('VALID: {callerFilePath: repo-anchored path, packageName: orchestrator, relativePath: index.ts} => builds the package root barrel path', () => {
    const result = packageRootSourcePathTransformer({
      callerFilePath: FilePathStub({
        value:
          '/repo/packages/mcp/src/adapters/orchestrator/get-next-step/get-next-step-adapter.proxy.ts',
      }),
      packageName: 'orchestrator',
      relativePath: 'index.ts',
    });

    expect(result).toBe('/repo/packages/orchestrator/src/index.ts');
  });

  it('VALID: {callerFilePath: nested worktree path, packageName: orchestrator, relativePath: a proxy target} => anchors on the last /packages/ segment', () => {
    const result = packageRootSourcePathTransformer({
      callerFilePath: FilePathStub({
        value:
          '/repo/worktrees/gateway-pivot/packages/mcp/src/adapters/orchestrator/get-next-step/get-next-step-adapter.proxy.ts',
      }),
      packageName: 'orchestrator',
      relativePath: 'startup/start-orchestrator.proxy.ts',
    });

    expect(result).toBe(
      '/repo/worktrees/gateway-pivot/packages/orchestrator/src/startup/start-orchestrator.proxy.ts',
    );
  });

  it('EMPTY: {callerFilePath: no /packages/ segment} => returns null', () => {
    const result = packageRootSourcePathTransformer({
      callerFilePath: FilePathStub({ value: '/project/src/brokers/x/x-broker.proxy.ts' }),
      packageName: 'orchestrator',
      relativePath: 'index.ts',
    });

    expect(result).toBe(null);
  });
});
