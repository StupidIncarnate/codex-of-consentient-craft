import { transcriptLineContract } from './transcript-line-contract';
import { TranscriptLineStub } from './transcript-line.stub';

describe('transcriptLineContract', () => {
  describe('valid lines', () => {
    it('VALID: {a user text line} => parses and keeps every passthrough field', () => {
      expect(TranscriptLineStub()).toStrictEqual({
        uuid: 'a1b2c3d4-0000-4000-8000-000000000001-user',
        timestamp: '2026-01-01T00:00:00.000Z',
        message: { role: 'user', content: 'Seeded by the session-with-nested-subagent recipe.' },
      });
    });

    it('VALID: {a Task completion line} => keeps toolUseResult.agentId', () => {
      const line = TranscriptLineStub({
        uuid: 'sess-task-outer-result',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'toolu_x', content: 'done' }],
        },
        toolUseResult: { agentId: 'agent-outer' },
      });

      expect(line).toStrictEqual({
        uuid: 'sess-task-outer-result',
        timestamp: '2026-01-01T00:00:00.000Z',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'toolu_x', content: 'done' }],
        },
        toolUseResult: { agentId: 'agent-outer' },
      });
    });
  });

  describe('invalid lines', () => {
    it('INVALID: {no uuid} => throws', () => {
      expect(() =>
        transcriptLineContract.parse({
          timestamp: '2026-01-01T00:00:00.000Z',
          message: { content: 'x' },
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {no timestamp} => throws', () => {
      expect(() => transcriptLineContract.parse({ uuid: 'u', message: { content: 'x' } })).toThrow(
        /Required/u,
      );
    });
  });
});
