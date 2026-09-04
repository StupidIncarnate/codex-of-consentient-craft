import {
  AbsoluteFilePathStub,
  PathSegmentStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { transcriptResolveBroker } from './transcript-resolve-broker';
import { transcriptResolveBrokerProxy } from './transcript-resolve-broker.proxy';

describe('transcriptResolveBroker', () => {
  describe('main session resolution', () => {
    it('VALID: {sessionId present in the only project dir} => returns its path', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupSessionAt({
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        sessionId: SessionIdStub({ value: 'abc-123' }),
      });

      const result = transcriptResolveBroker({ target: SessionIdStub({ value: 'abc-123' }) });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.claude/projects/proj-a/abc-123.jsonl' }),
      );
    });

    it('VALID: {sessionId present in the second of three project dirs} => returns its path', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupSessionAt({
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        sessionId: SessionIdStub({ value: 'other-session-a' }),
      });
      proxy.setupSessionAt({
        projectDir: PathSegmentStub({ value: 'proj-b' }),
        sessionId: SessionIdStub({ value: 'target-session' }),
      });
      proxy.setupSessionAt({
        projectDir: PathSegmentStub({ value: 'proj-c' }),
        sessionId: SessionIdStub({ value: 'other-session-c' }),
      });

      const result = transcriptResolveBroker({
        target: SessionIdStub({ value: 'target-session' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.claude/projects/proj-b/target-session.jsonl',
        }),
      );
    });

    it('EDGE: {project dir with no matching file, another with the match} => skips and continues', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupSessionAt({
        projectDir: PathSegmentStub({ value: 'proj-empty' }),
        sessionId: SessionIdStub({ value: 'unrelated-session' }),
      });
      proxy.setupSessionAt({
        projectDir: PathSegmentStub({ value: 'proj-match' }),
        sessionId: SessionIdStub({ value: 'target-session' }),
      });

      const result = transcriptResolveBroker({
        target: SessionIdStub({ value: 'target-session' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.claude/projects/proj-match/target-session.jsonl',
        }),
      );
    });

    it('EDGE: {target starting with agent-, a same-named top-level file exists} => never matches it', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupSessionAt({
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        sessionId: SessionIdStub({ value: 'agent-abc123' }),
      });

      const result = transcriptResolveBroker({
        target: SessionIdStub({ value: 'agent-abc123' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('sub-agent resolution', () => {
    it('VALID: {sub-agent id with parentSessionId} => resolves under that session only', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupSubagentAt({
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        sessionId: SessionIdStub({ value: 'session-1' }),
        agentId: SessionIdStub({ value: 'agent-target' }),
      });

      const result = transcriptResolveBroker({
        target: SessionIdStub({ value: 'agent-target' }),
        parentSessionId: SessionIdStub({ value: 'session-1' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.claude/projects/proj-a/session-1/subagents/agent-target.jsonl',
        }),
      );
    });

    it('VALID: {sub-agent id, no parentSessionId} => found by searching session dirs', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupSubagentAt({
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        sessionId: SessionIdStub({ value: 'session-1' }),
        agentId: SessionIdStub({ value: 'agent-target' }),
      });

      const result = transcriptResolveBroker({ target: SessionIdStub({ value: 'agent-target' }) });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.claude/projects/proj-a/session-1/subagents/agent-target.jsonl',
        }),
      );
    });

    it('EDGE: {sub-agent whose parent is the second session dir searched} => found', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupSubagentAt({
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        sessionId: SessionIdStub({ value: 'session-1' }),
        agentId: SessionIdStub({ value: 'agent-other' }),
      });
      proxy.setupSubagentAt({
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        sessionId: SessionIdStub({ value: 'session-2' }),
        agentId: SessionIdStub({ value: 'agent-target' }),
      });

      const result = transcriptResolveBroker({ target: SessionIdStub({ value: 'agent-target' }) });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.claude/projects/proj-a/session-2/subagents/agent-target.jsonl',
        }),
      );
    });
  });

  describe('no match', () => {
    it('EMPTY: {nothing anywhere} => returns undefined', () => {
      const proxy = transcriptResolveBrokerProxy();
      proxy.setupNothing();

      const result = transcriptResolveBroker({ target: SessionIdStub({ value: 'ghost-session' }) });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {projects root does not exist} => returns undefined, no throw', () => {
      transcriptResolveBrokerProxy();

      const result = transcriptResolveBroker({ target: SessionIdStub({ value: 'ghost-session' }) });

      expect(result).toBe(undefined);
    });
  });
});
