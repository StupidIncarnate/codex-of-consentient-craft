import { transcriptResolveForHookBroker } from './transcript-resolve-for-hook-broker';
import { transcriptResolveForHookBrokerProxy } from './transcript-resolve-for-hook-broker.proxy';

describe('transcriptResolveForHookBroker', () => {
  describe('no agentId (main session caller)', () => {
    it('VALID: {transcriptPath exists} => returns that exact path', () => {
      const proxy = transcriptResolveForHookBrokerProxy();
      const transcriptPath = '/home/user/.claude/projects/-repo/session123.jsonl';
      proxy.setupExists({ path: transcriptPath, exists: true });

      const result = transcriptResolveForHookBroker({ transcriptPath });

      expect(result).toBe('/home/user/.claude/projects/-repo/session123.jsonl');
    });

    it('EMPTY: {transcriptPath does not exist} => returns null', () => {
      const proxy = transcriptResolveForHookBrokerProxy();
      const transcriptPath = '/home/user/.claude/projects/-repo/session123.jsonl';
      proxy.setupExists({ path: transcriptPath, exists: false });

      const result = transcriptResolveForHookBroker({ transcriptPath });

      expect(result).toBe(null);
    });
  });

  describe('agentId present (sub-agent caller)', () => {
    it('VALID: {subagents/agent-<id>.jsonl candidate exists} => returns it', () => {
      const proxy = transcriptResolveForHookBrokerProxy();
      const transcriptPath = '/home/user/.claude/projects/-repo/session123.jsonl';
      const agentId = 'abc123';
      const subagentsCandidate =
        '/home/user/.claude/projects/-repo/session123/subagents/agent-abc123.jsonl';
      proxy.setupExists({ path: subagentsCandidate, exists: true });

      const result = transcriptResolveForHookBroker({ transcriptPath, agentId });

      expect(result).toBe(
        '/home/user/.claude/projects/-repo/session123/subagents/agent-abc123.jsonl',
      );
    });

    it('VALID: {transcriptPath is already the agent own file and exists} => returns it', () => {
      const proxy = transcriptResolveForHookBrokerProxy();
      const transcriptPath = '/home/user/.claude/projects/-repo/subagents/agent-def456.jsonl';
      const agentId = 'def456';
      proxy.setupExists({ path: transcriptPath, exists: true });

      const result = transcriptResolveForHookBroker({ transcriptPath, agentId });

      expect(result).toBe('/home/user/.claude/projects/-repo/subagents/agent-def456.jsonl');
    });

    it('VALID: {first candidate missing, later candidate exists} => returns the later candidate', () => {
      const proxy = transcriptResolveForHookBrokerProxy();
      const transcriptPath = '/home/user/.claude/projects/-repo/session789.jsonl';
      const agentId = 'xyz789';
      const laterCandidate = '/home/user/.claude/projects/-repo/agent-xyz789.jsonl';
      proxy.setupExists({ path: laterCandidate, exists: true });

      const result = transcriptResolveForHookBroker({ transcriptPath, agentId });

      expect(result).toBe('/home/user/.claude/projects/-repo/agent-xyz789.jsonl');
    });

    it('EMPTY: {no candidate exists but transcriptPath itself does} => returns null, never the parent transcript', () => {
      const proxy = transcriptResolveForHookBrokerProxy();
      const transcriptPath = '/home/user/.claude/projects/-repo/session999.jsonl';
      const agentId = 'never-fallback';
      proxy.setupExists({ path: transcriptPath, exists: true });

      const result = transcriptResolveForHookBroker({ transcriptPath, agentId });

      expect(result).toBe(null);
    });
  });
});
