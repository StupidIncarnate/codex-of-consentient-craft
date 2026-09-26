import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { gatewayTestingBarrelPathTransformer } from './gateway-testing-barrel-path-transformer';

describe('gatewayTestingBarrelPathTransformer', () => {
  it('VALID: {callerFilePath: repo-anchored path, gatewayFolder: npm} => builds npm testing barrel path', () => {
    const result = gatewayTestingBarrelPathTransformer({
      callerFilePath: FilePathStub({
        value: '/repo/packages/mcp/src/brokers/x/x-broker.proxy.ts',
      }),
      gatewayFolder: 'npm',
    });

    expect(result).toBe('/repo/packages/npm/src/testing/index.ts');
  });

  it('VALID: {callerFilePath: nested worktree path, gatewayFolder: node} => anchors on the last /packages/ segment', () => {
    const result = gatewayTestingBarrelPathTransformer({
      callerFilePath: FilePathStub({
        value: '/repo/worktrees/gateway-pivot/packages/mcp/src/responders/x/x-responder.proxy.ts',
      }),
      gatewayFolder: 'node',
    });

    expect(result).toBe('/repo/worktrees/gateway-pivot/packages/node/src/testing/index.ts');
  });

  it('EMPTY: {callerFilePath: no /packages/ segment} => returns null', () => {
    const result = gatewayTestingBarrelPathTransformer({
      callerFilePath: FilePathStub({ value: '/project/src/brokers/x/x-broker.proxy.ts' }),
      gatewayFolder: 'npm',
    });

    expect(result).toBe(null);
  });
});
