import {
  SessionIdStub,
  AgentIdStub,
  QuestIdStub,
  ContentTextStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { DigestRunResponder } from './digest-run-responder';
import { DigestRunResponderProxy } from './digest-run-responder.proxy';
import { DigestCommandStub } from '../../../contracts/digest-command/digest-command.stub';
import { TranscriptRecordStub } from '../../../contracts/transcript-record/transcript-record.stub';

describe('DigestRunResponder', () => {
  describe('summary command', () => {
    it('VALID: {command: summary} => renders the whole fixed block for a populated session', () => {
      const proxy = DigestRunResponderProxy();
      const target = SessionIdStub({ value: 'session-summary-valid' });
      const contents = ContentTextStub({ value: JSON.stringify(TranscriptRecordStub()) });
      proxy.setupSession({ target, contents });

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'summary' }),
        target,
      });

      expect(String(result)).toBe(
        [
          'LINES     1',
          'API CALLS 1 (assistant records — one API response spans several transcript lines)',
          'START     2026-09-01T19:09:06.542Z',
          'END       2026-09-01T19:09:06.542Z',
          'WALL      0.0 min',
          'MODELS    claude-opus-5x1',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 0',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 0',
          '  of which thinking : 0',
          '  TOTAL context-in  : 0',
          '',
          'TOOL CALLS (0)',
          '',
          'TOOL RESULT BYTES 0',
          'SUBAGENTS 0',
        ].join('\n'),
      );
    });

    it('EMPTY: {target resolves to nothing} => the no-timestamp render, subagent count 0', () => {
      const proxy = DigestRunResponderProxy();
      proxy.setupNoTranscript();

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'summary' }),
        target: SessionIdStub({ value: 'session-ghost' }),
      });

      expect(String(result)).toBe(
        [
          'LINES     0',
          'API CALLS 0 (assistant records — one API response spans several transcript lines)',
          'START     (no timestamped record)',
          'MODELS    ',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 0',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 0',
          '  of which thinking : 0',
          '  TOTAL context-in  : 0',
          '',
          'TOOL CALLS (0)',
          '',
          'TOOL RESULT BYTES 0',
          'SUBAGENTS 0',
        ].join('\n'),
      );
    });

    it('EDGE: {roster has three sub-agent rows} => the count reaches the render', () => {
      const proxy = DigestRunResponderProxy();
      const target = SessionIdStub({ value: 'session-summary-edge' });
      const contents = ContentTextStub({ value: JSON.stringify(TranscriptRecordStub()) });
      proxy.setupSessionWithSubagents({
        target,
        contents,
        agents: [
          { agentId: AgentIdStub({ value: 'agent-one' }) },
          { agentId: AgentIdStub({ value: 'agent-two' }) },
          { agentId: AgentIdStub({ value: 'agent-three' }) },
        ],
      });

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'summary' }),
        target,
      });

      expect(String(result)).toBe(
        [
          'LINES     1',
          'API CALLS 1 (assistant records — one API response spans several transcript lines)',
          'START     2026-09-01T19:09:06.542Z',
          'END       2026-09-01T19:09:06.542Z',
          'WALL      0.0 min',
          'MODELS    claude-opus-5x1',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 0',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 0',
          '  of which thinking : 0',
          '  TOTAL context-in  : 0',
          '',
          'TOOL CALLS (0)',
          '',
          'TOOL RESULT BYTES 0',
          'SUBAGENTS 3',
        ].join('\n'),
      );
    });
  });

  describe('buckets command', () => {
    it('VALID: {command: buckets} => renders the header plus one row for a populated session', () => {
      const proxy = DigestRunResponderProxy();
      const target = SessionIdStub({ value: 'session-buckets-valid' });
      const contents = ContentTextStub({ value: JSON.stringify(TranscriptRecordStub()) });
      proxy.setupSession({ target, contents });

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'buckets' }),
        target,
      });

      expect(String(result)).toBe(
        [
          'WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS',
          '19:09-19:24            1      0         0             0             0  ',
        ].join('\n'),
      );
    });
  });

  describe('gaps command', () => {
    it('VALID: {command: gaps} => renders header, one idle gap row, and the summary', () => {
      const proxy = DigestRunResponderProxy();
      const target = SessionIdStub({ value: 'session-gaps-valid' });
      const contents = ContentTextStub({
        value: [
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' })),
        ].join('\n'),
      });
      proxy.setupSession({ target, contents });

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'gaps' }),
        target,
      });

      expect(String(result)).toBe(
        [
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '0.0m 300s  *** NOTHING RUNNING ***',
          '',
          'WALL CLOCK      5.0 min',
          'IN GAPS         5.0 min  (100.0%)',
          '  blocked on sub  0.0 min  (0.0%)',
          '  TRUE IDLE       5.0 min  (100.0%)',
        ].join('\n'),
      );
    });

    it('EDGE: {one roster row has no timestamped transcript} => that window is skipped, the timestamped one is used', () => {
      const proxy = DigestRunResponderProxy();
      const target = SessionIdStub({ value: 'session-gaps-edge' });
      const contents = ContentTextStub({
        value: [
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' })),
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:10:00.000Z' })),
        ].join('\n'),
      });
      // subagentRosterLoadBroker only ever reports startedAt/endedAt as a matched pair, derived
      // together from a sub-agent's own transcript timestamps — a real row can never carry
      // exactly one of the two. A sub-agent with no readable transcript at all is the real-world
      // shape that produces a row missing BOTH, which is what exercises the responder's "skip a
      // row missing either timestamp" filter here.
      proxy.setupSessionWithSubagents({
        target,
        contents,
        agents: [
          {
            agentId: AgentIdStub({ value: 'agent-alpha' }),
            transcriptContents: ContentTextStub({
              value: JSON.stringify(
                TranscriptRecordStub({ timestamp: '2026-09-01T19:02:00.000Z' }),
              ),
            }),
          },
          { agentId: AgentIdStub({ value: 'agent-beta' }) },
        ],
      });

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'gaps' }),
        target,
      });

      expect(String(result)).toBe(
        [
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '0.0m 300s  agent-alpha',
          '5.0m 300s  *** NOTHING RUNNING ***',
          '',
          'WALL CLOCK      10.0 min',
          'IN GAPS         10.0 min  (100.0%)',
          '  blocked on sub  5.0 min  (50.0%)',
          '  TRUE IDLE       5.0 min  (50.0%)',
        ].join('\n'),
      );
    });
  });

  describe('coverage command', () => {
    it('VALID: {command: coverage} => renders the flow block and the caveat', () => {
      const proxy = DigestRunResponderProxy();
      const questId = QuestIdStub({ value: 'bare-flow-quest' });
      const flow = FlowStub({ id: 'bare-flow', flowType: 'runtime', nodes: [], edges: [] });
      proxy.setupQuest({ questId, questJson: { flows: [flow] } });

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'coverage' }),
        target: questId,
      });

      expect(String(result)).toBe(
        [
          'bare-flow',
          '  track                    OWED  signed  confirmed  unconfirmable  UNSIGNED',
          '  codeweaverSignoff           0       0          0              0         0',
          '  flowriderSignoff            0       0          0              0         0',
          '  siegemasterSignoff          7       0          0              0         7',
          '',
          'NOT AUTHORITATIVE — get-qa-checklist({questId, operationItemId}) is the real denominator.',
        ].join('\n'),
      );
    });

    it("EMPTY: {quest not found} => returns ''", () => {
      const proxy = DigestRunResponderProxy();
      proxy.setupMissingQuest();

      const result = DigestRunResponder({
        command: DigestCommandStub({ value: 'coverage' }),
        target: QuestIdStub({ value: 'ghost-quest' }),
      });

      expect(String(result)).toBe('');
    });
  });
});
