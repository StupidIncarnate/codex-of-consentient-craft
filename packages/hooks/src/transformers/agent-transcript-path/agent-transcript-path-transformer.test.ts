import { AgentStub } from '@dungeonmaster/shared/contracts/agent/agent.stub';
import { agentTranscriptPathTransformer } from './agent-transcript-path-transformer';

describe('agentTranscriptPathTransformer', () => {
  it('VALID: {transcriptPath: main-session file} => candidate 2 is the session/subagents/agent-<id>.jsonl path', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123.jsonl',
      agentId: AgentStub({ id: 'abc' }).id,
    });

    expect(result).toStrictEqual([
      '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      '/home/user/.claude/projects/-repo/agent-abc.jsonl',
    ]);
  });

  it('VALID: {transcriptPath: already the agent own file} => that exact path is first', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      agentId: AgentStub({ id: 'abc' }).id,
    });

    expect(result).toStrictEqual([
      '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      '/home/user/.claude/projects/-repo/session123/subagents/agent-abc/subagents/agent-abc.jsonl',
    ]);
  });

  it('VALID: {transcriptPath: a different agent file in the same subagents dir} => candidate 3 yields this agent, the other agent path is absent', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123/subagents/agent-OTHER.jsonl',
      agentId: AgentStub({ id: 'abc' }).id,
    });

    expect(result).toStrictEqual([
      '/home/user/.claude/projects/-repo/session123/subagents/agent-OTHER/subagents/agent-abc.jsonl',
      '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
    ]);
  });

  it('EDGE: {transcriptPath: no .jsonl suffix} => still produces candidates without throwing', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123',
      agentId: AgentStub({ id: 'abc' }).id,
    });

    expect(result).toStrictEqual([
      '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      '/home/user/.claude/projects/-repo/agent-abc.jsonl',
    ]);
  });

  it('EDGE: {transcriptPath: dirname+agent file reconstructs the input} => the duplicate candidate is emitted once', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/s/subagents/agent-z9.jsonl',
      agentId: AgentStub({ id: 'z9' }).id,
    });

    expect(result).toStrictEqual([
      '/s/subagents/agent-z9.jsonl',
      '/s/subagents/agent-z9/subagents/agent-z9.jsonl',
    ]);
  });

  it('EMPTY: {transcriptPath: ""} => returns the two hardcoded-slash candidates without throwing', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '',
      agentId: AgentStub({ id: 'abc' }).id,
    });

    expect(result).toStrictEqual(['/subagents/agent-abc.jsonl', '/agent-abc.jsonl']);
  });
});
