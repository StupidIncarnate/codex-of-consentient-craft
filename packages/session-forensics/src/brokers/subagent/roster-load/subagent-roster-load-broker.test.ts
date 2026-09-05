import {
  AbsoluteFilePathStub,
  AgentIdStub,
  ContentTextStub,
  PathSegmentStub,
} from '@dungeonmaster/shared/contracts';

import { subagentRosterLoadBroker } from './subagent-roster-load-broker';
import { subagentRosterLoadBrokerProxy } from './subagent-roster-load-broker.proxy';
import { SubagentRosterRowStub } from '../../../contracts/subagent-roster-row/subagent-roster-row.stub';
import { SubagentMetaStub } from '../../../contracts/subagent-meta/subagent-meta.stub';
import { TranscriptRecordStub } from '../../../contracts/transcript-record/transcript-record.stub';
import { jsonlToRecordsTransformer } from '../../../transformers/jsonl-to-records/jsonl-to-records-transformer';

const SESSION_FILE_PATH = AbsoluteFilePathStub({
  value: '/home/user/.claude/projects/proj/session-1.jsonl',
});
const AGENT_A_ID = AgentIdStub({ value: 'agent-a' });
const AGENT_B_ID = AgentIdStub({ value: 'agent-b' });

describe('subagentRosterLoadBroker', () => {
  describe('multiple sub-agents', () => {
    it('VALID: {two sub-agents listed out of dispatch order} => returns two rows sorted by start time ascending', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      const metaA = SubagentMetaStub();
      const metaB = SubagentMetaStub();
      const transcriptA = ContentTextStub({
        value: JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
      });
      const transcriptB = ContentTextStub({
        value: JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' })),
      });

      proxy.setupRoster({
        sessionFilePath: SESSION_FILE_PATH,
        agents: [
          { kind: 'valid', agentId: AGENT_B_ID, meta: metaB, transcriptJsonl: transcriptB },
          { kind: 'valid', agentId: AGENT_A_ID, meta: metaA, transcriptJsonl: transcriptA },
        ],
      });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([
        SubagentRosterRowStub({
          agentId: AGENT_A_ID,
          meta: metaA,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
          turnCount: 1,
          records: [...jsonlToRecordsTransformer({ contents: transcriptA })],
        }),
        SubagentRosterRowStub({
          agentId: AGENT_B_ID,
          meta: metaB,
          startedAt: '2026-09-01T19:05:00.000Z',
          endedAt: '2026-09-01T19:05:00.000Z',
          turnCount: 1,
          records: [...jsonlToRecordsTransformer({ contents: transcriptB })],
        }),
      ]);
    });
  });

  describe('no subagents directory', () => {
    it('EMPTY: {no subagents directory} => returns []', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      proxy.setupNoSubagentsDir({ sessionFilePath: SESSION_FILE_PATH });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {subagents directory exists but is empty} => returns []', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      proxy.setupRoster({ sessionFilePath: SESSION_FILE_PATH, agents: [] });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unreadable meta files', () => {
    it('EDGE: {one meta.json is malformed JSON} => that agent is skipped, the other still returned', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      const meta = SubagentMetaStub();
      const transcript = ContentTextStub({
        value: JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
      });

      proxy.setupRoster({
        sessionFilePath: SESSION_FILE_PATH,
        agents: [
          {
            kind: 'malformedMetaJson',
            agentId: AGENT_B_ID,
            rawMetaText: ContentTextStub({ value: '{not valid json' }),
          },
          { kind: 'valid', agentId: AGENT_A_ID, meta, transcriptJsonl: transcript },
        ],
      });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([
        SubagentRosterRowStub({
          agentId: AGENT_A_ID,
          meta,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
          turnCount: 1,
          records: [...jsonlToRecordsTransformer({ contents: transcript })],
        }),
      ]);
    });

    it('EDGE: {one meta.json parses as JSON but fails the contract} => that agent is skipped, the other still returned', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      const meta = SubagentMetaStub();
      const transcript = ContentTextStub({
        value: JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
      });

      proxy.setupRoster({
        sessionFilePath: SESSION_FILE_PATH,
        agents: [
          { kind: 'invalidMeta', agentId: AGENT_B_ID, rawMeta: { agentType: 'general-purpose' } },
          { kind: 'valid', agentId: AGENT_A_ID, meta, transcriptJsonl: transcript },
        ],
      });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([
        SubagentRosterRowStub({
          agentId: AGENT_A_ID,
          meta,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
          turnCount: 1,
          records: [...jsonlToRecordsTransformer({ contents: transcript })],
        }),
      ]);
    });
  });

  describe('missing or timestamp-less transcript', () => {
    it('EDGE: {meta with no matching transcript file} => row returned with no timestamps and zero turns', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      const meta = SubagentMetaStub();

      proxy.setupRoster({
        sessionFilePath: SESSION_FILE_PATH,
        agents: [{ kind: 'valid', agentId: AGENT_A_ID, meta }],
      });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([
        SubagentRosterRowStub({
          agentId: AGENT_A_ID,
          meta,
          turnCount: 0,
          records: [],
        }),
      ]);
    });

    it('EDGE: {transcript records carry no timestamps} => row returned with timestamps absent', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      const meta = SubagentMetaStub();
      const transcript = ContentTextStub({ value: JSON.stringify({ type: 'assistant' }) });

      proxy.setupRoster({
        sessionFilePath: SESSION_FILE_PATH,
        agents: [{ kind: 'valid', agentId: AGENT_A_ID, meta, transcriptJsonl: transcript }],
      });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([
        SubagentRosterRowStub({
          agentId: AGENT_A_ID,
          meta,
          turnCount: 1,
          records: [...jsonlToRecordsTransformer({ contents: transcript })],
        }),
      ]);
    });
  });

  describe('turn counting', () => {
    it('VALID: {records include both assistant and user turns} => turnCount counts only assistant records', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      const meta = SubagentMetaStub();
      const assistantRecord = TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' });
      const userRecord = TranscriptRecordStub({
        timestamp: '2026-09-01T19:01:00.000Z',
        type: 'user',
      });
      const transcript = ContentTextStub({
        value: [JSON.stringify(assistantRecord), JSON.stringify(userRecord)].join('\n'),
      });

      proxy.setupRoster({
        sessionFilePath: SESSION_FILE_PATH,
        agents: [{ kind: 'valid', agentId: AGENT_A_ID, meta, transcriptJsonl: transcript }],
      });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([
        SubagentRosterRowStub({
          agentId: AGENT_A_ID,
          meta,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:01:00.000Z',
          turnCount: 1,
          records: [...jsonlToRecordsTransformer({ contents: transcript })],
        }),
      ]);
    });
  });

  describe('stray files', () => {
    it('EDGE: {a stray non-meta file in the directory} => ignored', () => {
      const proxy = subagentRosterLoadBrokerProxy();
      const meta = SubagentMetaStub();
      const transcript = ContentTextStub({
        value: JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
      });

      proxy.setupRoster({
        sessionFilePath: SESSION_FILE_PATH,
        agents: [
          { kind: 'strayFile', fileName: PathSegmentStub({ value: 'notes.txt' }) },
          { kind: 'valid', agentId: AGENT_A_ID, meta, transcriptJsonl: transcript },
        ],
      });

      const result = subagentRosterLoadBroker({ sessionFilePath: SESSION_FILE_PATH });

      expect(result).toStrictEqual([
        SubagentRosterRowStub({
          agentId: AGENT_A_ID,
          meta,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
          turnCount: 1,
          records: [...jsonlToRecordsTransformer({ contents: transcript })],
        }),
      ]);
    });
  });
});
