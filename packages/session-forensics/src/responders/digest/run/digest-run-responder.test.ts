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
          'Lines in the transcript  1',
          'Times the model replied  1 (one reply covers several lines of the transcript)',
          'Session started          2026-09-01T19:09:06.542Z',
          'Session ended            2026-09-01T19:09:06.542Z',
          'Ran for                  0.0 minutes',
          'Models used              claude-opus-5x1',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 0',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 0',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 0',
          '',
          'Tool calls the model made (0 in total)',
          '',
          'Bytes returned by tools  0',
          'Sub-agents started       0',
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
          'Lines in the transcript  0',
          'Times the model replied  0 (one reply covers several lines of the transcript)',
          'Session started          (nothing in the file was timestamped)',
          'Models used              ',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 0',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 0',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 0',
          '',
          'Tool calls the model made (0 in total)',
          '',
          'Bytes returned by tools  0',
          'Sub-agents started       0',
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
          'Lines in the transcript  1',
          'Times the model replied  1 (one reply covers several lines of the transcript)',
          'Session started          2026-09-01T19:09:06.542Z',
          'Session ended            2026-09-01T19:09:06.542Z',
          'Ran for                  0.0 minutes',
          'Models used              claude-opus-5x1',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 0',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 0',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 0',
          '',
          'Tool calls the model made (0 in total)',
          '',
          'Bytes returned by tools  0',
          'Sub-agents started       3',
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
          'Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools',
          '19:09-19:24               1           0            0             0                 0  ',
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
          'Gaps of 120 seconds or more between one model reply and the next.',
          'A gap that names sub-agents is time the session spent waiting on a helper.',
          'A gap marked *** NOTHING RUNNING *** had nothing happening at all.',
          'Minutes in  Gap      Sub-agents running',
          '0.0m 300s  *** NOTHING RUNNING ***',
          '',
          'Ran for                 5.0 minutes',
          'Spent in gaps           5.0 minutes  (100.0%)',
          '  waiting on a sub-agent  0.0 minutes  (0.0%)',
          '  nothing running at all  5.0 minutes  (100.0%)',
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
          'Gaps of 120 seconds or more between one model reply and the next.',
          'A gap that names sub-agents is time the session spent waiting on a helper.',
          'A gap marked *** NOTHING RUNNING *** had nothing happening at all.',
          'Minutes in  Gap      Sub-agents running',
          '0.0m 300s  agent-alpha',
          '5.0m 300s  *** NOTHING RUNNING ***',
          '',
          'Ran for                 10.0 minutes',
          'Spent in gaps           10.0 minutes  (100.0%)',
          '  waiting on a sub-agent  5.0 minutes  (50.0%)',
          '  nothing running at all  5.0 minutes  (50.0%)',
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
          'Flow bare-flow',
          "  sign-off track         REQUIRED  signed  confirmed  can't confirm  NOT SIGNED",
          '  codeweaverSignoff             0       0          0              0           0',
          '  flowriderSignoff              0       0          0              0           0',
          '  siegemasterSignoff            7       0          0              0           7',
          '',
          'These counts can be too high.',
          'This reading has no operation item, so it counts rows a real checklist would leave out.',
          'For the exact numbers, ask get-qa-checklist({questId, operationItemId}).',
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
