import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { agentTranscriptPathTransformer } from './agent-transcript-path-transformer';

describe('agentTranscriptPathTransformer', () => {
  it('VALID: {transcriptPath: main-session file} => candidate 2 is the session/subagents/agent-<id>.jsonl path', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123.jsonl',
      agentId: 'abc',
    });

    expect(result).toStrictEqual([
      AbsoluteFilePathStub({
        value: '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      }),
      AbsoluteFilePathStub({ value: '/home/user/.claude/projects/-repo/agent-abc.jsonl' }),
    ]);
  });

  it('VALID: {transcriptPath: already the agent own file} => that exact path is first', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      agentId: 'abc',
    });

    expect(result).toStrictEqual([
      AbsoluteFilePathStub({
        value: '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      }),
      AbsoluteFilePathStub({
        value:
          '/home/user/.claude/projects/-repo/session123/subagents/agent-abc/subagents/agent-abc.jsonl',
      }),
    ]);
  });

  it('VALID: {transcriptPath: a different agent file in the same subagents dir} => candidate 3 yields this agent, the other agent path is absent', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123/subagents/agent-OTHER.jsonl',
      agentId: 'abc',
    });

    expect(result).toStrictEqual([
      AbsoluteFilePathStub({
        value:
          '/home/user/.claude/projects/-repo/session123/subagents/agent-OTHER/subagents/agent-abc.jsonl',
      }),
      AbsoluteFilePathStub({
        value: '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      }),
    ]);
  });

  it('EDGE: {transcriptPath: no .jsonl suffix} => still produces candidates without throwing', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/home/user/.claude/projects/-repo/session123',
      agentId: 'abc',
    });

    expect(result).toStrictEqual([
      AbsoluteFilePathStub({
        value: '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
      }),
      AbsoluteFilePathStub({ value: '/home/user/.claude/projects/-repo/agent-abc.jsonl' }),
    ]);
  });

  it('EDGE: {transcriptPath: dirname+agent file reconstructs the input} => the duplicate candidate is emitted once', () => {
    const result = agentTranscriptPathTransformer({
      transcriptPath: '/s/subagents/agent-z9.jsonl',
      agentId: 'z9',
    });

    expect(result).toStrictEqual([
      AbsoluteFilePathStub({ value: '/s/subagents/agent-z9.jsonl' }),
      AbsoluteFilePathStub({ value: '/s/subagents/agent-z9/subagents/agent-z9.jsonl' }),
    ]);
  });

  it('EMPTY: {transcriptPath: "", agentId: ""} => returns the two hardcoded-slash candidates without throwing', () => {
    const result = agentTranscriptPathTransformer({ transcriptPath: '', agentId: '' });

    expect(result).toStrictEqual([
      AbsoluteFilePathStub({ value: '/subagents/agent-.jsonl' }),
      AbsoluteFilePathStub({ value: '/agent-.jsonl' }),
    ]);
  });
});
