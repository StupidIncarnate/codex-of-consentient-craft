import { mcpCallerContextContract } from './mcp-caller-context-contract';
import { McpCallerContextStub } from './mcp-caller-context.stub';

describe('mcpCallerContextContract', () => {
  it('VALID: {cwd, sessionId} => parses a top-level session caller', () => {
    const result = mcpCallerContextContract.parse(McpCallerContextStub());

    expect(result).toStrictEqual({
      cwd: '/home/user/repo',
      sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    });
  });

  it('VALID: {cwd, sessionId, agentId} => parses a sub-agent caller', () => {
    const result = mcpCallerContextContract.parse(
      McpCallerContextStub({ agentId: 'a493e1c2168b46114' }),
    );

    expect(result).toStrictEqual({
      cwd: '/home/user/repo',
      sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      agentId: 'a493e1c2168b46114',
    });
  });

  it('INVALID: {cwd: relative path} => throws', () => {
    expect(() =>
      mcpCallerContextContract.parse({
        cwd: 'repo/worktrees/x',
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      }),
    ).toThrow(/Path must be absolute/u);
  });

  it('INVALID: {sessionId missing} => throws', () => {
    expect(() => mcpCallerContextContract.parse({ cwd: '/home/user/repo' })).toThrow(
      /received undefined/u,
    );
  });
});
