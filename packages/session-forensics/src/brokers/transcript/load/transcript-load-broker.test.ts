import { SessionIdStub, PathSegmentStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { transcriptLoadBroker } from './transcript-load-broker';
import { transcriptLoadBrokerProxy } from './transcript-load-broker.proxy';
import { TranscriptRecordStub } from '../../../contracts/transcript-record/transcript-record.stub';

describe('transcriptLoadBroker', () => {
  describe('main session transcript', () => {
    it('VALID: {resolvable transcript, two well-formed lines} => returns two records in order', () => {
      const proxy = transcriptLoadBrokerProxy();
      const target = SessionIdStub({ value: 'abc-123' });
      const lines = [
        JSON.stringify({
          type: 'assistant',
          timestamp: '2026-09-01T19:09:06.542Z',
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'First line.' }],
          },
        }),
        JSON.stringify({
          type: 'user',
          timestamp: '2026-09-01T19:10:00.000Z',
          message: { content: 'Second line.' },
        }),
      ];
      proxy.setupTranscript({
        target,
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        contents: ContentTextStub({ value: lines.join('\n') }),
      });

      const result = transcriptLoadBroker({ target });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'First line.' }],
          },
        }),
        TranscriptRecordStub({
          type: 'user',
          timestamp: '2026-09-01T19:10:00.000Z',
          message: { content: 'Second line.' },
        }),
      ]);
    });

    it('VALID: {record with no timestamp} => still returns the record', () => {
      const proxy = transcriptLoadBrokerProxy();
      const target = SessionIdStub({ value: 'no-timestamp-session' });
      const line = JSON.stringify({
        type: 'user',
        message: { content: 'No timestamp on this line.' },
      });
      proxy.setupTranscript({
        target,
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        contents: ContentTextStub({ value: line }),
      });

      const result = transcriptLoadBroker({ target });

      expect(result).toStrictEqual([
        { type: 'user', message: { content: 'No timestamp on this line.' } },
      ]);
    });
  });

  describe('no match', () => {
    it('EMPTY: {transcriptResolveBroker finds nothing} => returns [] without reading a file', () => {
      const proxy = transcriptLoadBrokerProxy();
      proxy.setupMissing();

      const result = transcriptLoadBroker({ target: SessionIdStub({ value: 'ghost-session' }) });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {resolvable but empty file} => returns []', () => {
      const proxy = transcriptLoadBrokerProxy();
      const target = SessionIdStub({ value: 'empty-session' });
      proxy.setupTranscript({
        target,
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        contents: ContentTextStub({ value: '' }),
      });

      const result = transcriptLoadBroker({ target });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {final line truncated} => returns the good records, drops the broken one', () => {
      const proxy = transcriptLoadBrokerProxy();
      const target = SessionIdStub({ value: 'truncated-session' });
      const validLine = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'Complete line.' }],
        },
      });
      proxy.setupTranscript({
        target,
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        contents: ContentTextStub({ value: [validLine, '{"type":"assis'].join('\n') }),
      });

      const result = transcriptLoadBroker({ target });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'Complete line.' }],
          },
        }),
      ]);
    });

    it('EDGE: {sub-agent target with parentSessionId} => resolves and loads', () => {
      const proxy = transcriptLoadBrokerProxy();
      const target = SessionIdStub({ value: 'agent-target' });
      const parentSessionId = SessionIdStub({ value: 'session-1' });
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-01T19:09:06.542Z',
        message: {
          model: 'claude-opus-5',
          content: [{ type: 'text', text: 'Sub-agent turn.' }],
        },
      });
      proxy.setupSubagentTranscript({
        target,
        projectDir: PathSegmentStub({ value: 'proj-a' }),
        parentSessionId,
        contents: ContentTextStub({ value: line }),
      });

      const result = transcriptLoadBroker({ target, parentSessionId });

      expect(result).toStrictEqual([
        TranscriptRecordStub({
          message: {
            model: 'claude-opus-5',
            content: [{ type: 'text', text: 'Sub-agent turn.' }],
          },
        }),
      ]);
    });
  });
});
