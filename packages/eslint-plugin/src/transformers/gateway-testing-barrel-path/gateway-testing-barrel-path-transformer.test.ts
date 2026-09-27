import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { gatewayTestingBarrelPathTransformer } from './gateway-testing-barrel-path-transformer';

describe('gatewayTestingBarrelPathTransformer', () => {
  it('VALID: {callerFilePath: repo-anchored path, gatewayFolder: npm, subpath: glob} => builds the glob testing barrel path', () => {
    const result = gatewayTestingBarrelPathTransformer({
      callerFilePath: FilePathStub({
        value: '/repo/packages/mcp/src/brokers/x/x-broker.proxy.ts',
      }),
      gatewayFolder: 'npm',
      subpath: 'glob',
    });

    expect(result).toBe('/repo/packages/@gateway/npm/src/glob/glob.proxy.ts');
  });

  it('VALID: {callerFilePath: nested worktree path, gatewayFolder: node} => anchors on the last /packages/ segment', () => {
    const result = gatewayTestingBarrelPathTransformer({
      callerFilePath: FilePathStub({
        value: '/repo/worktrees/gateway-pivot/packages/mcp/src/responders/x/x-responder.proxy.ts',
      }),
      gatewayFolder: 'node',
      subpath: 'fs__promises',
    });

    expect(result).toBe(
      '/repo/worktrees/gateway-pivot/packages/@gateway/node/src/fs__promises/fs__promises.proxy.ts',
    );
  });

  it('EMPTY: {callerFilePath: no /packages/ segment} => returns null', () => {
    const result = gatewayTestingBarrelPathTransformer({
      callerFilePath: FilePathStub({ value: '/project/src/brokers/x/x-broker.proxy.ts' }),
      gatewayFolder: 'npm',
      subpath: 'glob',
    });

    expect(result).toBe(null);
  });
});
